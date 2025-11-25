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
    return [
        RadioSource(
            id="cas-a",
            name="Cassiopeia A",
            ra_deg=350.85,
            dec_deg=58.82,
            type="supernova remnant",
            category="beginner",
            freq_ghz=1.4,
            notes="One of the brightest radio sources in the sky; great calibration target for continuum observations.",
            refs=[
                "https://astronomy.swin.edu.au/cosmos/c/cassiopeia+a",
            ],
        ),
        RadioSource(
            id="cyg-a",
            name="Cygnus A",
            ra_deg=299.87,
            dec_deg=40.73,
            type="radio galaxy",
            category="beginner",
            freq_ghz=1.4,
            notes="Powerful extragalactic radio source; visible with modest dishes.",
            refs=[
                "https://heasarc.gsfc.nasa.gov/W3Browse/all/cygnusa.html",
            ],
        ),
        RadioSource(
            id="taurus-a",
            name="Taurus A (Crab Nebula)",
            ra_deg=83.63,
            dec_deg=22.01,
            type="supernova remnant",
            category="beginner",
            freq_ghz=1.4,
            notes="Bright remnant with both continuum emission and pulsar activity; accessible to small dishes.",
            refs=[
                "https://science.nasa.gov/missions/chandra/crab-nebula/",
            ],
        ),
        RadioSource(
            id="sgr-a",
            name="Sagittarius A / Galactic Center",
            ra_deg=266.42,
            dec_deg=-28.94,
            type="galactic center",
            category="beginner",
            freq_ghz=1.42,
            notes="Dense region rich in H I emission; prime target for exploring galactic rotation curves.",
            refs=[
                "https://www.esa.int/Science_Exploration/Space_Science/The_Milky_Way_s_centre",
            ],
        ),
        RadioSource(
            id="orion-a",
            name="Orion Nebula (M42)",
            ra_deg=83.82,
            dec_deg=-5.39,
            type="H II region",
            category="beginner",
            freq_ghz=1.42,
            notes="Strong thermal emission; pairs well with optical observations for outreach.",
            refs=[
                "https://www.cv.nrao.edu/course/astr534/Orion.html",
            ],
        ),
        RadioSource(
            id="virgo-a",
            name="Virgo A (M87)",
            ra_deg=187.71,
            dec_deg=12.39,
            type="radio galaxy",
            category="beginner",
            freq_ghz=1.4,
            notes="Massive galaxy with famous jet; bright radio core helpful for pointing checks.",
            refs=[
                "https://science.nasa.gov/resource/messier-87-m87-virgo-a-ngc-4486/",
            ],
        ),
        RadioSource(
            id="psr-b0329+54",
            name="PSR B0329+54",
            ra_deg=53.245,
            dec_deg=54.579,
            type="pulsar",
            category="advanced",
            freq_ghz=0.4,
            notes="Bright northern pulsar detectable with larger amateur arrays; aspirational target.",
            refs=[
                "https://www.atnf.csiro.au/research/pulsar/psrcat/",
            ],
        ),
        RadioSource(
            id="vela-pulsar",
            name="Vela Pulsar",
            ra_deg=128.835,
            dec_deg=-45.176,
            type="pulsar",
            category="advanced",
            freq_ghz=0.6,
            notes="Southern hemisphere pulsar; requires high sensitivity but defines the path toward timing experiments.",
            refs=[
                "https://www.nasa.gov/image-article/vela-pulsar/",
            ],
        ),
    ]


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


