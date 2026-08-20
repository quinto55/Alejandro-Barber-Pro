#!/usr/bin/env python3
"""Convert the ABP logo render into recolourable alpha masks.

The source (assets/logo-src.png) is dark ink photographed on a lit concrete
wall, so it carries a vignette: the corners are darker than the middle of the
wall. A single global threshold reads those corners as ink. Dividing by a
heavily blurred copy of itself flattens that gradient first, so "ink vs wall"
is judged locally, and only then is the threshold applied.

Outputs, all white-on-transparent so CSS can tint them to any colour:
  logo-mask.png   crown + ABp monogram. The wordmark baked into the source is
                  deliberately dropped: it renders at 40-56px on the page,
                  where it is illegible, and the markup already prints
                  "Alejandro Barber Pro" as live text beside the mark.
  crown-mask.png  crown only, for the favicon and tight spots.
  favicon.png     crown tinted with --glow, 180x180.
"""
from PIL import Image, ImageFilter
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Threshold ramp, applied to the flattened image: <=LO fully opaque ink,
# >=HI fully transparent wall, linear between so edges stay antialiased.
LO, HI = 170, 215
NOISE_FLOOR = 0.10   # below this alpha it is wall texture, not ink
BLUR = 40            # radius used to model the lighting gradient
GLOW = (200, 184, 169)  # --glow, sampled from the backlight in the source

src = Image.open(ROOT / "assets/logo-src.png").convert("L")
a = np.asarray(src, dtype=np.float32)
bg = np.asarray(src.filter(ImageFilter.GaussianBlur(BLUR)), dtype=np.float32)
flat = np.clip(a / np.maximum(bg, 1) * 255.0, 0, 255)

alpha = np.clip((HI - flat) / (HI - LO), 0, 1)
alpha[alpha < NOISE_FLOOR] = 0.0


def bands(rows, frac=0.02, min_h=4):
    """Contiguous runs of rows carrying ink — crown, monogram, wordmark."""
    on, out, start = rows > rows.max() * frac, [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_h:
                out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(rows)))
    return out


def crop(y0, y1):
    """Tight crop of the alpha over a row range, as an LA image."""
    sub = alpha[y0:y1]
    cols = np.nonzero(sub.sum(axis=0) > 0)[0]
    rows = np.nonzero(sub.sum(axis=1) > 0)[0]
    sub = sub[rows.min():rows.max() + 1, cols.min():cols.max() + 1]
    a8 = (sub * 255).astype(np.uint8)
    return Image.merge("LA", [
        Image.new("L", (a8.shape[1], a8.shape[0]), 255),
        Image.fromarray(a8),
    ])


b = bands(alpha.sum(axis=1))
if len(b) < 3:
    raise SystemExit(f"expected crown/monogram/wordmark bands, found {b}")
crown_top = b[0][0]
# Bands, in order: crown finial, crown body, monogram, wordmark. The mark we
# want is everything from the finial through the monogram.
mark_bottom = b[-2][1] if len(b) >= 4 else b[-1][1]
crown_bottom = b[1][1] if len(b) >= 4 else b[0][1]

logo = crop(crown_top, mark_bottom)
logo.save(ROOT / "assets/logo-mask.png")

crown = crop(crown_top, crown_bottom)
crown.save(ROOT / "assets/crown-mask.png")

side = max(crown.size)
fav = Image.new("RGBA", (side, side), (0, 0, 0, 0))
tint = Image.new("RGBA", crown.size, GLOW + (255,))
fav.paste(tint, ((side - crown.size[0]) // 2, (side - crown.size[1]) // 2), crown.split()[-1])
fav.resize((180, 180), Image.LANCZOS).save(ROOT / "assets/favicon.png")

print("bands", b)
print("logo-mask", logo.size, "crown-mask", crown.size, "favicon 180x180")
