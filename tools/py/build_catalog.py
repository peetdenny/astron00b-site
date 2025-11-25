from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from math import asin, atan2, cos, radians, sin, degrees, pi
from pathlib import Path
from typing import List, Optional
import csv
import re


@dataclass
class RadioSource:
    id: str
    name: str
    ra_deg: Optional[float]
    dec_deg: Optional[float]
    type: str  # e.g. "supernova remnant", "H I region", "pulsar"
    category: str  # "beginner" or "advanced"
    freq_ghz: Optional[float]
    notes: str
    refs: List[str]


def load_initial_sources() -> list[RadioSource]:
    """Load curated sources from CSV and return as RadioSource objects."""

    csv_path = Path(__file__).parents[2] / "data" / "radio_sources.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    sources: list[RadioSource] = []
    with csv_path.open(newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ra = parse_ra(row.get("RA_hms", ""))
            dec = parse_dec(row.get("Dec_dms", ""))
            if ra is None or dec is None:
                # Skip entries without precise coordinates (e.g. Sun, Moon)
                continue

            freq_mhz = row.get("Frequency_MHz", "").strip()
            freq_ghz = (
                float(freq_mhz) / 1000
                if freq_mhz.replace(".", "", 1).isdigit()
                else None
            )

            sources.append(
                RadioSource(
                    id=slugify(row.get("ObjectName", "")),
                    name=row.get("ObjectName", "Unnamed source"),
                    ra_deg=ra,
                    dec_deg=dec,
                    type=row.get("OtherName", "").strip() or "radio source",
                    category="beginner",
                    freq_ghz=freq_ghz,
                    notes=row.get("Notes", "").strip(),
                    refs=[
                        "https://reeve.com/Documents/Articles%20Papers/Reeve_CelestialRadioSources.pdf"
                    ],
                )
            )

    return sources


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-") or "source"


def parse_ra(value: str) -> Optional[float]:
    value = value.strip()
    if not value or value.lower().startswith("variable"):
        return None
    parts = re.split(r"[hms:\s]+", value)
    parts = [p for p in parts if p]
    if len(parts) < 3:
        return None
    h, m, s = map(float, parts[:3])
    return (h + m / 60 + s / 3600) * 15.0


def parse_dec(value: str) -> Optional[float]:
    value = value.strip()
    if not value:
        return None
    sign = -1 if value.startswith("-") else 1
    cleaned = value.replace("+", "")
    parts = re.split(r"[d°'\" \s]+", cleaned)
    parts = [p for p in parts if p]
    if len(parts) < 3:
        return None
    deg_val, minutes, seconds = map(float, parts[:3])
    dec = deg_val + minutes / 60 + seconds / 3600
    return sign * dec


def main() -> None:
    sources = load_initial_sources()
    data = [asdict(s) for s in sources]
    project_root = Path(__file__).parents[2]
    data_dir = project_root / "data"
    public_dir = project_root / "public" / "data"
    for target_dir in (data_dir, public_dir):
        target_dir.mkdir(parents=True, exist_ok=True)
        (target_dir / "radio_sources_basic.json").write_text(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()


