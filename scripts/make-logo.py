#!/usr/bin/env python3
"""Convert the ABP logo JPEG into a recolourable alpha mask.

The source is black ink on a soft gray gradient. A soft threshold ramp
between LO and HI turns ink into opaque alpha and paper into transparent,
keeping antialiased edges instead of producing a jagged 1-bit cutout.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LO, HI = 110, 175  # <=LO fully opaque ink, >=HI fully transparent paper

src = Image.open(ROOT / "assets/logo-src.jpg").convert("L")
alpha = src.point(lambda v: 255 if v <= LO else (0 if v >= HI else int(255 * (HI - v) / (HI - LO))))

mask = Image.new("LA", src.size)
mask.putdata([(255, a) for a in alpha.get_flattened_data()])
mask = mask.crop(alpha.getbbox())
mask.save(ROOT / "assets/logo-mask.png")

# Crown only: the mark's top ~30%, for nav and favicon.
w, h = mask.size
crown = mask.crop((0, 0, w, int(h * 0.30)))
crown = crown.crop(crown.split()[-1].getbbox())
crown.save(ROOT / "assets/crown-mask.png")

# Favicon: crown in gold on transparent, square, padded.
GOLD = (200, 164, 92)
side = max(crown.size)
fav = Image.new("RGBA", (side, side), (0, 0, 0, 0))
tint = Image.new("RGBA", crown.size, GOLD + (255,))
fav.paste(tint, ((side - crown.size[0]) // 2, (side - crown.size[1]) // 2), crown.split()[-1])
fav.resize((180, 180), Image.LANCZOS).save(ROOT / "assets/favicon.png")

print("logo-mask", mask.size, "crown-mask", crown.size, "favicon 180x180")
