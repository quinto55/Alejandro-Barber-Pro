#!/usr/bin/env python3
"""One-time normalization pass over assets/portfolio/cut-*.jpg.

The design spec (docs/superpowers/specs/2026-08-01-alejandro-barber-pro-design.md)
assumed every portfolio photo would land around 736x736 / ~75KB, for a total
portfolio weight of ~2.4MB. The 32 images actually downloaded (Task 1/2) range
from 167x167 up to 2340x2340, totaling ~5.3MB — the eight largest (cut-14
through cut-21, 2340x2340) are roughly 5x larger than anything the page ever
displays them at (grid tiles render at ~200-350px via CSS `aspect-ratio: 1` +
`object-fit: cover`; the lightbox is capped at `min(90vw, 60rem)`, i.e. at
most 960px on a very wide viewport).

This script re-saves every portfolio JPEG in place:
  - Any image whose longer edge exceeds MAX_EDGE is downscaled to MAX_EDGE,
    preserving aspect ratio, with LANCZOS resampling.
  - Images already at or under MAX_EDGE are left at their original
    dimensions (never upscaled) and just re-saved to normalize compression.
  - All 32 are re-saved at JPEG quality=80 with optimize=True.

Re-runnable and idempotent: running it again on already-normalized files just
re-encodes them at the same quality/size, which is a no-op in practice.

Only assets/portfolio/cut-*.jpg are touched. logo-mask.png, crown-mask.png,
favicon.png and logo-src.jpg are untouched (see scripts/make-logo.py).

Usage: python3 scripts/resize-portfolio.py
Requires: Pillow (same tooling as scripts/make-logo.py).
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORTFOLIO_DIR = ROOT / "assets/portfolio"
MAX_EDGE = 1000
QUALITY = 80

total_before = 0
total_after = 0

for path in sorted(PORTFOLIO_DIR.glob("cut-*.jpg")):
    size_before = path.stat().st_size
    total_before += size_before

    img = Image.open(path)
    orig_dims = img.size
    img = img.convert("RGB")  # normalize any non-RGB (e.g. CMYK) source

    w, h = img.size
    longer = max(w, h)
    if longer > MAX_EDGE:
        scale = MAX_EDGE / longer
        new_size = (round(w * scale), round(h * scale))
        img = img.resize(new_size, Image.LANCZOS)

    img.save(path, "JPEG", quality=QUALITY, optimize=True)

    size_after = path.stat().st_size
    total_after += size_after
    changed = " (resized)" if img.size != orig_dims else ""
    print(f"{path.name}\t{orig_dims} -> {img.size}{changed}\t"
          f"{size_before/1024:.1f}KB -> {size_after/1024:.1f}KB")

print()
print(f"TOTAL: {total_before/1024/1024:.2f}MB -> {total_after/1024/1024:.2f}MB")
