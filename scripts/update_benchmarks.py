#!/usr/bin/env python3
"""Publish validated daily ETF closes with honest per-series retrieval metadata.

Price-series comparison only; not guaranteed dividend-reinvested total returns.
Importing this module never fetches data. The CLI uses the existing Stooq source.
"""
import csv
import io
import json
import math
import os
import re
import tempfile
import urllib.request
from datetime import date, datetime, time, timezone
from pathlib import Path

SYMBOLS = ("SPY", "VOO", "QQQ", "VTI", "IWM", "DIA")
MIN_OBSERVATIONS = 200
MIN_SERIES = 3
OUTPUT_PATH = Path("data/benchmarks.json")


class PublicationError(ValueError):
    """No acceptable replacement is available; leave the existing file alone."""


def fetch_history(symbol):
    url = "https://stooq.com/q/d/l/?s=" + symbol.lower() + ".us&i=d"
    request = urllib.request.Request(
        url, headers={"User-Agent": "CompoundingTools/1.0 research website"}
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read().decode("utf-8-sig")


def observation_date(value, today):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("Observation date must use YYYY-MM-DD")
    parsed = date.fromisoformat(value)
    if parsed > today:
        raise ValueError("Future observation date")
    return parsed


def validate_series(rows, today):
    """Reject malformed, duplicate, unordered, future or nonfinite observations."""
    if not isinstance(rows, list) or len(rows) < MIN_OBSERVATIONS:
        raise ValueError("Insufficient observations")
    values = []
    previous_date = None
    for row in rows:
        if not isinstance(row, list) or len(row) != 2:
            raise ValueError("Invalid observation")
        observed = observation_date(row[0], today)
        if previous_date is not None and observed <= previous_date:
            raise ValueError("Observation dates must be unique and increasing")
        price = row[1]
        if (isinstance(price, bool) or not isinstance(price, (int, float))
                or not math.isfinite(price) or price <= 0):
            raise ValueError("Price must be finite and positive")
        price = round(price, 6)
        if price <= 0:
            raise ValueError("Price rounds to zero")
        values.append([row[0], price])
        previous_date = observed
    return values


def parse_history(content, today):
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames or not {"Date", "Close"}.issubset(reader.fieldnames):
        raise ValueError("Missing historical price columns")
    # Do not silently discard corrupt rows and label a partial response fresh.
    rows = [[row["Date"], float(row["Close"])] for row in reader]
    return validate_series(rows, today)


def load_cache(path):
    try:
        previous = json.loads(path.read_text())
        return previous if isinstance(previous, dict) else {}
    except (OSError, UnicodeError, ValueError):
        return {}


def retrieval_time(value, now):
    """Accept canonical dates or timezone-aware ISO timestamps, never the future."""
    if not isinstance(value, str):
        return None
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            parsed = datetime.combine(date.fromisoformat(value), time(), timezone.utc)
        else:
            if not re.fullmatch(
                r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)",
                value,
            ):
                return None
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
        return parsed if parsed <= now else None
    except (ValueError, OverflowError):
        return None


def cached_metadata(previous, symbol, rows, now):
    metadata = previous.get("metadata")
    entry = metadata.get(symbol) if isinstance(metadata, dict) else None
    fetched_at = entry.get("fetched_at") if isinstance(entry, dict) else None
    retrieved = retrieval_time(fetched_at, now)
    if retrieved is None or retrieved.date() < date.fromisoformat(rows[-1][0]):
        fetched_at = None
    # A legacy global `updated` could have been rewritten after a failed fetch.
    # It is not evidence of when this series was retrieved.
    return {"fetched_at": fetched_at, "status": "cached"}


def refresh_benchmarks(output_path=OUTPUT_PATH, *, fetcher=None, now=None):
    """Refresh using an injectable fetcher/UTC clock for entirely offline tests."""
    path = Path(output_path)
    now = datetime.now(timezone.utc) if now is None else now
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("Refresh clock must have a timezone")
    now = now.astimezone(timezone.utc)
    fetcher = fetch_history if fetcher is None else fetcher
    previous = load_cache(path)
    cached_series = previous.get("series")
    cached_series = cached_series if isinstance(cached_series, dict) else {}
    series, metadata = {}, {}
    for symbol in SYMBOLS:
        try:
            series[symbol] = parse_history(fetcher(symbol), now.date())
            metadata[symbol] = {
                "fetched_at": now.isoformat().replace("+00:00", "Z"),
                "status": "fresh",
            }
            print(symbol, len(series[symbol]), "fresh")
        except Exception as exc:
            print("Failed", symbol, exc)
            try:
                rows = validate_series(cached_series.get(symbol), now.date())
            except (ValueError, TypeError, OverflowError):
                continue
            series[symbol] = rows
            metadata[symbol] = cached_metadata(previous, symbol, rows, now)

    if len(series) < MIN_SERIES:
        raise PublicationError("Not enough verified series to publish; preserving existing file")

    retrieved = [retrieval_time(entry["fetched_at"], now) for entry in metadata.values()]
    # Conservative aggregate, not the time this file happened to be rewritten.
    updated = min(retrieved).date().isoformat() if all(retrieved) else None
    payload = {
        "updated": updated,
        "provider": "Stooq historical daily close",
        "methodology": "Historical close series; do not assume dividend-reinvested total return",
        "series": series,
        "metadata": metadata,
    }
    content = json.dumps(payload, separators=(",", ":"), allow_nan=False) + "\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False) as file:
            temporary_path = Path(file.name)
            file.write(content)
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
    return payload


def main():
    try:
        refresh_benchmarks()
    except PublicationError as exc:
        raise SystemExit(str(exc)) from exc


if __name__ == "__main__":
    main()
