#!/usr/bin/env python3
"""Generate the scan-to-book QR code, and prove it decodes.

Output:
  assets/qr.svg   vector, for print at any size. This is the one to send a
                  print shop — a QR is pure geometry and rasterising it just
                  throws away edge definition.
  assets/qr.png   1200px raster, for anywhere that will not take an SVG
                  (Instagram, a Word document, most sign-printing web forms).

Both encode the homepage rather than /#book. A scan is often the very first
thing a new client sees of him, and the homepage carries the portfolio,
prices, reviews and hours with Book one tap away in the nav; dropping a
stranger straight onto a service picker skips the part that sells the cut.

DESIGN CHOICES, and why they are not decoration:

  Error correction Q (~25% recoverable). M would encode in a smaller grid,
  but this code is going onto a glass door and a printed card — things that
  get scuffed, smudged and photographed at an angle. Q buys real-world
  tolerance for a few extra modules. H is denser again for tolerance no
  paper sign needs.

  Pure black on pure white, and no logo in the middle. Brand colours and a
  centred crown both eat scan margin, and the palette is already carried by
  the sign around it (print/scan-to-book.html). The code itself is the one
  element on the page whose only job is to work at arm's length in bad light.

  border=4 is the quiet zone the QR spec requires. Cropping it is the single
  most common way a printed code stops scanning.

Requires segno (pure Python) and, for the self-check, opencv-python-headless:
  pip install --user segno opencv-python-headless
"""
import sys
from pathlib import Path

import segno

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
URL = 'https://alejandrobarberpro.com'

qr = segno.make(URL, error='q')
print(f'encoding {URL!r}  version={qr.version}  ecc={qr.error}')

svg = ASSETS / 'qr.svg'
qr.save(svg, scale=10, border=4, dark='#000000', light='#ffffff')

png = ASSETS / 'qr.png'
qr.save(png, scale=40, border=4, dark='#000000', light='#ffffff')

for f in (svg, png):
    print(f'  {f.name:<8} {f.stat().st_size // 1024}KB')

# ---- Self-check -------------------------------------------------------
# An unverified QR code is a guess. Decode the PNG we just wrote and refuse
# to pass unless the bytes that come back are the URL that went in.
try:
    import cv2
except ImportError:
    print('\nWARNING: opencv not installed — code NOT verified', file=sys.stderr)
    sys.exit(0)

img = cv2.imread(str(png))
decoded, points, _ = cv2.QRCodeDetector().detectAndDecode(img)
if decoded != URL:
    print(f'\nFAIL: decoded {decoded!r}, expected {URL!r}', file=sys.stderr)
    sys.exit(1)
print(f'\nverified: decodes to {decoded}')
