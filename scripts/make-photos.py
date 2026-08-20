#!/usr/bin/env python3
"""Turn the raw Booksy sources into the two photos the About section loads.

The studio source comes from scripts/fetch-assets.sh and is gitignored. The
portrait source (assets/portrait-src.png) was supplied directly and IS
committed, so this crop stays reproducible.

  assets/alejandro.jpg  his portrait, cropped 4:5 from the top of the frame.
                        The source is a full-length street shot, so a
                        centred square crop lands on his waist — the crop is
                        anchored to the top instead. Never upscaled: the
                        source is 604px wide and staying there beats
                        inventing pixels.
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
STUDIO_CUT = 560     # px of foreground to drop off the bottom of the source
PORTRAIT_RATIO = 5 / 4   # height / width — a standing editorial portrait
STUDIO_PX = 1400
QUALITY = 82

portrait = Image.open(ROOT / "assets/portrait-src.png").convert("RGB")
pw, ph = portrait.size
crop_h = min(ph, round(pw * PORTRAIT_RATIO))
portrait = portrait.crop((0, 0, pw, crop_h))
portrait.save(ROOT / "assets/alejandro.jpg", quality=QUALITY, optimize=True)

studio = Image.open(ROOT / "assets/studio-src.jpg").convert("RGB")
studio = studio.crop((0, 0, studio.size[0], studio.size[1] - STUDIO_CUT))
studio.thumbnail((STUDIO_PX, STUDIO_PX), Image.LANCZOS)
studio.save(ROOT / "assets/studio.jpg", quality=QUALITY, optimize=True)

for name in ("alejandro.jpg", "studio.jpg"):
    f = ROOT / "assets" / name
    print(f"{name:16s} {Image.open(f).size}  {f.stat().st_size // 1024}KB")
