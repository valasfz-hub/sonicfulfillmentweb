"""Build the Sonic Fulfillment logo variants used by the website.

Input:  site/assets/logo.png  (full-color navy + gold logo, transparent background)
Output: site/assets/logo-white.png  (for navy/dark backgrounds)

Per the brand guidelines, the white version turns the navy artwork white but keeps
the gold motion lines gold. Pixels are blended by how "gold" they are, so the
anti-aliased seams between gold and navy stay smooth.

Usage: python tools/build_logo_variants.py
Requires: Pillow
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "site" / "assets" / "logo.png"
OUT_WHITE = ROOT / "site" / "assets" / "logo-white.png"

# Navy #001f3f has r-b = -63; gold #d4af37 has r-b = +157.
NAVY_RB, GOLD_RB = -63, 157


def white_version(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            t = (r - b - NAVY_RB) / (GOLD_RB - NAVY_RB)
            t = max(0.0, min(1.0, t))
            px[x, y] = (
                round(t * r + (1 - t) * 255),
                round(t * g + (1 - t) * 255),
                round(t * b + (1 - t) * 255),
                a,
            )
    return im


def main() -> None:
    white_version(Image.open(SRC)).save(OUT_WHITE, optimize=True)
    print(f"wrote {OUT_WHITE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
