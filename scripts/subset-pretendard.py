"""Build page-specific Pretendard WOFF2 files from the lockfile package.

Install the build-only tooling with `python -m pip install fonttools brotli`,
run `npm run build:ko`, then run this script whenever Korean copy changes.
"""
from pathlib import Path
from fontTools.subset import main as subset

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "node_modules" / "pretendard" / "dist" / "web" / "static" / "woff2-subset"
OUTPUT = ROOT / "assets" / "fonts"
TEXT = ROOT / "ko.html"

for weight in ("Regular", "Bold"):
    source = SOURCE / f"Pretendard-{weight}.subset.woff2"
    target = OUTPUT / f"Pretendard-{weight}.subset.woff2"
    temporary = OUTPUT / f"Pretendard-{weight}.page.woff2"
    subset([
        str(source),
        f"--text-file={TEXT}",
        f"--output-file={temporary}",
        "--flavor=woff2",
        "--layout-features=*",
        "--no-hinting",
    ])
    temporary.replace(target)
    if target.stat().st_size > 60_000:
        raise SystemExit(f"{target.name} exceeds the 60 KB page-subset budget")
    print(f"{target.relative_to(ROOT)}: {target.stat().st_size} bytes")
