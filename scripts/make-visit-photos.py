#!/usr/bin/env python3
"""Turn Alejandro's four location photos into the assets the page loads.

He supplied these directly (2026-09-06) as phone screenshots, so the sources
ARE committed and this crop stays reproducible — same arrangement as
assets/portrait-src.png, and unlike the Booksy studio photo that
scripts/fetch-assets.sh downloads.

  assets/studio.jpg     his suite. REPLACES the Booksy photo that was here
                        before: this is the room as it stands now, and it is
                        his own picture rather than the landlord's marketing
                        shot. Cropped 4:5 from the middle of the frame, which
                        keeps the chair, the arch mirror and the wash station
                        and drops only ceiling tile and floor.

  assets/arrive-1.jpg   the 30-30 Northern Blvd lobby, front desk ahead.
  assets/arrive-2.jpg   the Phenix Salon Suites entrance off the corridor.
  assets/arrive-3.jpg   his own door, the ABp crown etched on the glass.

The arrive-* three are a sequence, not decoration. "Suite #131" inside a
building full of identical rented suites is genuinely hard to find, and a
client who is already late is not going to enjoy hunting for it. They render
as a 3-up strip in the Visit section, so they are cropped to a single 3:4
ratio to keep that strip even.

RESOLUTION, and why nothing here is upscaled: the sources are 768px tall
screenshots — a messaging app has already been through them once. That is
below what this site would normally ship (the portfolio is 736px square, the
old studio photo was 1400px wide), so every output below is capped at its
source width and never enlarged. Following scripts/make-photos.py: "staying
there beats inventing pixels." If Alejandro can send the camera originals
rather than screenshots, re-run this — the crops and sizes are already right
and the outputs will simply get sharper.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'

# (source, output, target aspect W/H, cap on output width)
JOBS = [
    ('suite-src.png',          'studio.jpg',    4 / 5, 640),
    ('arrive-1-lobby-src.png', 'arrive-1.jpg',  3 / 4, 480),
    ('arrive-2-phenix-src.png','arrive-2.jpg',  3 / 4, 480),
    ('arrive-3-door-src.png',  'arrive-3.jpg',  3 / 4, 480),
]


def crop_to(im, aspect):
    """Centre-crop to `aspect`, trimming only the longer dimension.

    Centre rather than top (which is what the portrait crop in
    make-photos.py needed): in all four of these the subject — the chair,
    the desk, the doorway — sits in the middle of the frame, and the edges
    are ceiling and floor.
    """
    w, h = im.size
    if w / h > aspect:                 # too wide: trim the sides
        new_w = round(h * aspect)
        left = (w - new_w) // 2
        return im.crop((left, 0, left + new_w, h))
    new_h = round(w / aspect)          # too tall: trim top and bottom
    top = (h - new_h) // 2
    return im.crop((0, top, w, top + new_h))


for src_name, out_name, aspect, cap in JOBS:
    src = Image.open(ASSETS / src_name).convert('RGB')
    im = crop_to(src, aspect)

    # Never upscale — cap is a ceiling, not a target.
    width = min(cap, im.width)
    if width < im.width:
        im = im.resize((width, round(width / aspect)), Image.LANCZOS)

    out = ASSETS / out_name
    im.save(out, 'JPEG', quality=82, optimize=True)
    print(f'{out_name:<14} {src.size[0]}x{src.size[1]} -> {im.size[0]}x{im.size[1]}  '
          f'{out.stat().st_size // 1024}KB')
