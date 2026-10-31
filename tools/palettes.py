"""Generate the colour palettes for the switcher: palettes/<name>.css.

Every blue-hued colour in styles.css is moved to the palette's hue. Its lightness
shifts by however much lighter the palette's main colour is than the blue,
fading to no shift for very light tints and very dark inks.
Run after editing styles.css: python3 tools/palettes.py
"""
import colorsys, pathlib, re

BLUE = (0x2A, 0x33, 0xE8)
PALETTES = {'emerald': '#0B8A5F', 'tangerine': '#D9480F', 'pink': '#D6246E', 'violet': '#6A2BE8'}

root = pathlib.Path(__file__).resolve().parent.parent
source = (root / 'styles.css').read_text()

def luminance(rgb):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def lstar(rgb):
    y = luminance(rgb)
    return 116 * y ** (1 / 3) - 16 if y > 0.008856 else 903.3 * y

def move(rgb, hue, shift):
    h, l, s = colorsys.rgb_to_hls(*(c / 255 for c in rgb))
    if s < 0.08 or not (200 <= h * 360 <= 265):
        return rgb
    base = lstar(rgb)
    want = base + shift * max(0.0, 1 - abs(base - lstar(BLUE)) / 55)
    target = ((want + 16) / 116) ** 3
    lo, hi = 0.0, 1.0
    for _ in range(30):
        mid = (lo + hi) / 2
        out = tuple(round(c * 255) for c in colorsys.hls_to_rgb(hue / 360, mid, s))
        lo, hi = (mid, hi) if luminance(out) < target else (lo, mid)
    return tuple(round(c * 255) for c in colorsys.hls_to_rgb(hue / 360, (lo + hi) / 2, s))

def recolor(text, main):
    rgb_main = tuple(int(main[i:i + 2], 16) for i in (1, 3, 5))
    hue = colorsys.rgb_to_hls(*(c / 255 for c in rgb_main))[0] * 360
    shift = lstar(rgb_main) - lstar(BLUE)
    def hexed(m):
        rgb = move(tuple(int(m.group(1)[i:i + 2], 16) for i in (0, 2, 4)), hue, shift)
        return '#%02X%02X%02X' % rgb
    text = re.sub(r'#([0-9A-Fa-f]{6})\b', hexed, text)
    return re.sub(r'\b(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\b',
                  lambda m: '%d, %d, %d' % move(tuple(int(x) for x in m.groups()), hue, shift), text)

(root / 'palettes').mkdir(exist_ok=True)
for name, main in PALETTES.items():
    css = recolor(source, main)
    (root / 'palettes' / f'{name}.css').write_text(css)
    print(name, re.search(r'--ultra: (#\w+)', css).group(1))
