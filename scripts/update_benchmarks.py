#!/usr/bin/env python3
"""Download daily historical ETF prices from Stooq into a static JSON file.
Price-series comparison only; not guaranteed dividend-reinvested total returns.
"""
import csv, io, json, os, urllib.request
from datetime import datetime, timezone
from pathlib import Path
symbols = ("SPY", "VOO", "QQQ", "VTI", "IWM", "DIA")
series = {}
for symbol in symbols:
    url = "https://stooq.com/q/d/l/?s=" + symbol.lower() + ".us&i=d"
    req = urllib.request.Request(url, headers={"User-Agent": "CompoundingTools/1.0 research website"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            content = resp.read().decode("utf-8-sig")
        rows = list(csv.DictReader(io.StringIO(content)))
        values = []
        for row in rows:
            try:
                date = row["Date"]
                price = float(row["Close"])
                if datetime.strptime(date, "%Y-%m-%d") and price > 0:
                    values.append([date, round(price, 6)])
            except (ValueError, KeyError, TypeError):
                continue
        if len(values) < 200:
            raise ValueError("Insufficient observations")
        series[symbol] = values
        print(symbol, len(values))
    except Exception as exc:
        print("Failed", symbol, exc)
        old = Path("data/benchmarks.json")
        if old.exists():
            previous = json.loads(old.read_text())
            if len(previous.get("series", {}).get(symbol, [])) >= 200:
                series[symbol] = previous["series"][symbol]
if len(series) < 3:
    raise SystemExit("Not enough verified series to publish; preserving existing file")
payload = {"updated": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "provider": "Stooq historical daily close", "methodology": "Historical close series; do not assume dividend-reinvested total return", "series": series}
os.makedirs("data", exist_ok=True)
Path("data/benchmarks.json").write_text(json.dumps(payload, separators=(",", ":")) + "\n")
