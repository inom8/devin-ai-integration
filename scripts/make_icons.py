#!/usr/bin/env python3
"""Generate the extension icons from a single source design.

Renders a rounded-square gradient with a stylised checkmark inside.
"""

from PIL import Image, ImageDraw

SIZES = [16, 48, 128]

# Colors picked to match css --accent / accent companion
GRADIENT_TOP = (91, 141, 239)   # #5B8DEF
GRADIENT_BOTTOM = (72, 169, 166)  # #48A9A6
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def render(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(size):
        t = y / max(size - 1, 1)
        draw.line([(0, y), (size, y)], fill=lerp(GRADIENT_TOP, GRADIENT_BOTTOM, t))

    # Round the corners by masking
    radius = max(2, size // 5)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    img.putalpha(mask)

    # Checkmark
    cw = max(2, size // 12)
    margin = size * 0.22
    p1 = (margin, size * 0.55)
    p2 = (size * 0.42, size * 0.74)
    p3 = (size * 0.78, size * 0.30)
    draw.line([p1, p2], fill=WHITE, width=cw)
    draw.line([p2, p3], fill=WHITE, width=cw)

    return img


def main():
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.normpath(os.path.join(here, "..", "icons"))
    os.makedirs(out_dir, exist_ok=True)
    for s in SIZES:
        img = render(s)
        img.save(os.path.join(out_dir, f"icon{s}.png"))
        print(f"wrote icons/icon{s}.png")


if __name__ == "__main__":
    main()
