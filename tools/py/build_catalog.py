from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List


@dataclass
class RadioSource:
    id: str
    name: str
    ra_deg: float
    dec_deg: float
    type: str  # e.g. "supernova remnant", "H I region", "pulsar"
    category: str  # "beginner" or "advanced"
    freq_ghz: float
    notes: str
    refs: List[str]


def load_initial_sources() -> list[RadioSource]:
    """Return a small hand-picked set of bright, beginner-friendly sources.

    This is a placeholder; later we can populate from public catalogues.
    """
    return []


def main() -> None:
    sources = load_initial_sources()
    data = [asdict(s) for s in sources]
    out_path = Path(__file__).parents[2] / "data" / "radio_sources_basic.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()


