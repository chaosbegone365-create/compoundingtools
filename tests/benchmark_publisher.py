"""Offline publisher regressions. Synthetic prices are never repository data."""
import copy
import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import Mock, patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "update_benchmarks.py"
# An import must not fetch, create directories, or write a benchmark file.
with patch("urllib.request.urlopen", side_effect=AssertionError("Network forbidden")) as network:
    spec = importlib.util.spec_from_file_location("benchmark_publisher", SCRIPT)
    publisher = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(publisher)
    network.assert_not_called()

NOW = datetime(2026, 10, 25, 12, 30, tzinfo=timezone.utc)
OLD = "2026-09-30T09:15:00Z"
ROWS = [[(date(2025, 1, 1) + timedelta(days=i)).isoformat(), 100 + i / 10]
        for i in range(publisher.MIN_OBSERVATIONS)]


def csv_for(rows=ROWS):
    return "Date,Close\n" + "\n".join(f"{day},{price}" for day, price in rows) + "\n"


def cache():
    return {
        "updated": "2026-10-01",
        "series": {symbol: copy.deepcopy(ROWS) for symbol in publisher.SYMBOLS},
        "metadata": {symbol: {"fetched_at": OLD, "status": "fresh"}
                     for symbol in publisher.SYMBOLS},
    }


class PublisherTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "data" / "benchmarks.json"
        self.network = patch("urllib.request.urlopen", side_effect=AssertionError("Network forbidden"))
        self.request = self.network.start()
        self.addCleanup(self.network.stop)
        self.addCleanup(self.request.assert_not_called)
        self.log = redirect_stdout(io.StringIO())
        self.log.__enter__()
        self.addCleanup(self.log.__exit__, None, None, None)

    def save(self, previous):
        self.path.parent.mkdir(exist_ok=True)
        self.path.write_text(json.dumps(previous))

    def refresh(self, responses=None):
        responses = {} if responses is None else responses

        def fetcher(symbol):
            response = responses.get(symbol, OSError("Synthetic source failure"))
            if isinstance(response, Exception):
                raise response
            return response

        self.fetcher = Mock(side_effect=fetcher)
        result = publisher.refresh_benchmarks(self.path, fetcher=self.fetcher, now=NOW)
        self.assertEqual(self.fetcher.call_count, len(publisher.SYMBOLS))
        self.assertEqual(result, json.loads(self.path.read_text()))
        self.assertEqual(set(result["series"]), set(result["metadata"]))
        self.assertEqual(list(self.path.parent.iterdir()), [self.path])
        return result

    def test_all_success_records_each_actual_retrieval_not_price_date(self):
        result = self.refresh({symbol: csv_for() for symbol in publisher.SYMBOLS})
        self.assertEqual(result["updated"], "2026-10-25")
        self.assertEqual(result["series"]["SPY"], ROWS)
        self.assertEqual(result["series"]["SPY"][-1][0], "2025-07-19")
        for entry in result["metadata"].values():
            self.assertEqual(entry, {"fetched_at": "2026-10-25T12:30:00Z", "status": "fresh"})

    def test_partial_failure_preserves_cached_time_and_status(self):
        self.save(cache())
        result = self.refresh({"SPY": csv_for()})
        self.assertEqual(result["metadata"]["SPY"]["status"], "fresh")
        self.assertEqual(result["metadata"]["VOO"], {"fetched_at": OLD, "status": "cached"})
        self.assertEqual(result["series"]["VOO"], ROWS)
        self.assertEqual(result["updated"], "2026-09-30")

    def test_all_failure_keeps_retrieval_times_on_repeated_runs(self):
        self.save(cache())
        first = self.refresh()
        self.assertEqual(first["updated"], "2026-09-30")
        for entry in first["metadata"].values():
            self.assertEqual(entry, {"fetched_at": OLD, "status": "cached"})
        first_bytes = self.path.read_bytes()
        self.assertEqual(self.refresh(), first)
        self.assertEqual(self.path.read_bytes(), first_bytes)

    def test_legacy_cache_never_promotes_global_updated_to_retrieved(self):
        for metadata in [None, [], "invalid", {}, {"SPY": None}]:
            with self.subTest(metadata=metadata):
                previous = cache()
                previous["metadata"] = metadata
                self.save(previous)
                result = self.refresh({"SPY": csv_for()})
                self.assertIsNone(result["updated"])
                self.assertEqual(result["metadata"]["VOO"], {"fetched_at": None, "status": "cached"})
        previous = cache()
        del previous["metadata"]
        self.save(previous)
        result = self.refresh()
        self.assertIsNone(result["updated"])
        self.assertTrue(all(entry["fetched_at"] is None for entry in result["metadata"].values()))

    def test_future_invalid_or_impossible_cached_retrieval_is_unknown(self):
        for value in ["2026-10-26", "2026-10-25T12:30:01Z", "2025-02-30",
                      "2026-09-30T12:00:00", "2026-9-30", "NaN", 123,
                      "2024-12-31T00:00:00Z", "0001-01-01T00:00:00+01:00",
                      "2026-09-30T09:15:00+00:99", "2026-09-30T09:15:00+24:00"]:
            with self.subTest(value=value):
                previous = cache()
                previous["metadata"]["SPY"]["fetched_at"] = value
                self.save(previous)
                result = self.refresh()
                self.assertEqual(result["metadata"]["SPY"], {"fetched_at": None, "status": "cached"})
                self.assertIsNone(result["updated"])

    def test_valid_cached_date_and_offset_are_preserved_exactly(self):
        for value in ["2026-09-30", "2026-09-30T10:15:00+01:00"]:
            with self.subTest(value=value):
                previous = cache()
                previous["metadata"]["SPY"]["fetched_at"] = value
                self.save(previous)
                self.assertEqual(self.refresh()["metadata"]["SPY"]["fetched_at"], value)

    def test_missing_file_all_failure_creates_no_data(self):
        with self.assertRaises(publisher.PublicationError):
            self.refresh()
        self.assertFalse(self.path.parent.exists())

    def test_insufficient_series_preserves_existing_bytes(self):
        previous = cache()
        previous["series"] = {"SPY": ROWS, "VOO": ROWS}
        self.save(previous)
        original = self.path.read_bytes()
        with self.assertRaises(publisher.PublicationError):
            self.refresh()
        self.assertEqual(self.path.read_bytes(), original)

    def test_malformed_cache_does_not_break_success_and_is_preserved_on_failure(self):
        self.path.parent.mkdir()
        for content in ["not JSON", "[]", "null", '{"series":null}', '{"series":[]}']:
            with self.subTest(content=content):
                self.path.write_text(content)
                with self.assertRaises(publisher.PublicationError):
                    self.refresh()
                self.assertEqual(self.path.read_text(), content)
                result = self.refresh({symbol: csv_for() for symbol in publisher.SYMBOLS[:3]})
                self.assertEqual(len(result["series"]), 3)

    def test_malformed_cached_series_is_never_republished(self):
        variants = [None, "invalid", ROWS[:-1], list(reversed(ROWS))]
        for row in [["2026-10-26", 100], ["2025-02-30", 100], ["2025-7-19", 100],
                    [ROWS[-2][0], 100], [None, 100], [ROWS[-1][0], True],
                    [ROWS[-1][0], "123"], [ROWS[-1][0], None],
                    [ROWS[-1][0], 100, "extra"], [ROWS[-1][0], 10**400]]:
            variants.append(ROWS[:-1] + [row])
        for rows in variants:
            with self.subTest(last_row=rows[-1] if isinstance(rows, list) else rows):
                previous = cache()
                previous["series"]["SPY"] = rows
                self.save(previous)
                result = self.refresh()
                self.assertNotIn("SPY", result["series"])
                self.assertNotIn("SPY", result["metadata"])

    def test_nonfinite_and_nonpositive_prices_rejected_in_cache_and_source(self):
        for price in [float("inf"), float("-inf"), float("nan"), 0, -1, 0.0000001]:
            with self.subTest(price=price):
                rows = ROWS[:-1] + [[ROWS[-1][0], price]]
                previous = cache()
                previous["series"]["SPY"] = rows
                self.save(previous)
                result = self.refresh({"SPY": csv_for(rows)})
                self.assertNotIn("SPY", result["series"])
                self.assertNotIn("NaN", self.path.read_text())
                self.assertNotIn("Infinity", self.path.read_text())

    def test_corrupt_source_falls_back_instead_of_silently_dropping_rows(self):
        invalid_responses = ["No data", "Date,Open\n2025-01-01,100\n", csv_for(ROWS[:-1]),
                             csv_for(list(reversed(ROWS))), csv_for() + "2025-07-20,garbage\n",
                             csv_for() + "2026-10-26,100\n", csv_for() + "2025-02-30,100\n",
                             csv_for() + f"{ROWS[-1][0]},100\n"]
        for response in invalid_responses:
            with self.subTest(response=response[-60:]):
                self.save(cache())
                result = self.refresh({"SPY": response})
                self.assertEqual(result["metadata"]["SPY"], {"fetched_at": OLD, "status": "cached"})
                self.assertEqual(result["series"]["SPY"], ROWS)

    def test_atomic_write_failure_preserves_old_file_and_removes_temporary_file(self):
        self.save(cache())
        original = self.path.read_bytes()
        with patch.object(publisher.os, "replace", side_effect=OSError("Synthetic disk failure")):
            with self.assertRaises(OSError):
                self.refresh({symbol: csv_for() for symbol in publisher.SYMBOLS})
        self.assertEqual(self.path.read_bytes(), original)
        self.assertEqual(list(self.path.parent.iterdir()), [self.path])


if __name__ == "__main__":
    unittest.main(verbosity=2)
