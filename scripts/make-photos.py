#!/usr/bin/env python3
"""Turn the raw Booksy sources into the two photos the About section loads.

Sources come from scripts/fetch-assets.sh (portrait-src.jpg, studio-src.jpg)
and are gitignored; only the derived files below are committed.

  assets/alejandro.jpg  his staff portrait, square, 720px
  assets/studio.jpg     his suite. The source has a stray leg and sneaker in
                        the foreground, so the bottom STUDIO_CUT px are
                        dropped before resizing — everything that matters
                        (chair, backlit mirror, tool station) sits above it.

Sized against how the page renders them: the portrait is a ~360px column on
desktop, the studio photo ~700px, so 2x of each is plenty and anything larger
is bytes the client pays for and never sees.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STUDIO_CUT = 560   # px of foreground to drop off the bottom of the source
PORTRAIT_PX = 720
STUDIO_PX = 1400
QUALITY = 82

portrait = Image.open(ROOT / "assets/portrait-src.jpg").convert("RGB")
side = min(portrait.size)
left = (portrait.size[0] - side) // 2
top = (portrait.size[1] - side) // 2
portrait = portrait.crop((left, top, left + side, top + side))
portrait = portrait.resize((PORTRAIT_PX, PORTRAIT_PX), Image.LANCZOS)
portrait.save(ROOT / "assets/alejandro.jpg", quality=QUALITY, optimize=True)

studio = Image.open(ROOT / "assets/studio-src.jpg").convert("RGB")
studio = studio.crop((0, 0, studio.size[0], studio.size[1] - STUDIO_CUT))
studio.thumbnail((STUDIO_PX, STUDIO_PX), Image.LANCZOS)
studio.save(ROOT / "assets/studio.jpg", quality=QUALITY, optimize=True)

for name in ("alejandro.jpg", "studio.jpg"):
    f = ROOT / "assets" / name
    print(f"{name:16s} {Image.open(f).size}  {f.stat().st_size // 1024}KB")
