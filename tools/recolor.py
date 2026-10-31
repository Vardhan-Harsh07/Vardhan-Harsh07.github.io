"""Build a recoloured copy of the site: every blue-hued colour is rotated to the target hue.

Usage: python3 tools/recolor.py red 353 "#F6ECEF=#F3EFEA"
Optional OLD=NEW pairs patch individual colours after the rotation.
Writes <name>/index.html and <name>/styles.css; script.js and assets are shared from the root.
"""
import colorsys, pathlib, re, sys

name, target = sys.argv[1], float(sys.argv[2])
root = pathlib.Path(__file__).resolve().parent.parent
out = root / name
out.mkdir(exist_ok=True)

def rotate(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if s < 0.08 or not (200 <= h * 360 <= 265):
        return r, g, b
    h = ((h * 360 - 237 + target) % 360) / 360
    return tuple(round(c * 255) for c in colorsys.hls_to_rgb(h, l, s))

def hex_sub(m):
    v = m.group(1)
    if len(v) == 3:
        v = ''.join(c * 2 for c in v)
    r, g, b = rotate(*(int(v[i:i + 2], 16) for i in (0, 2, 4)))
    return '#%02X%02X%02X' % (r, g, b)

def triple_sub(m):
    r, g, b = rotate(*(int(x) for x in m.groups()))
    return f'{r}, {g}, {b}'

def recolor(text):
    text = re.sub(r'#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b', hex_sub, text)
    text = re.sub(r'%23([0-9A-Fa-f]{6})\b', lambda m: '%23' + hex_sub(m)[1:], text)
    text = re.sub(r'\b(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\b', triple_sub, text)
    for pair in sys.argv[3:]:
        old, new = pair.split('=')
        text = text.replace(old, new)
    return text

(out / 'styles.css').write_text(recolor((root / 'styles.css').read_text()))

html = recolor((root / 'index.html').read_text())
html = html.replace('src="script.js"', 'src="../script.js"')
html = html.replace('href="Harsh-Vardhan-Chauhan-Resume.pdf"', 'href="../Harsh-Vardhan-Chauhan-Resume.pdf"')
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta name="robots" content="noindex">', 1)
(out / 'index.html').write_text(html)
print('wrote', out)
