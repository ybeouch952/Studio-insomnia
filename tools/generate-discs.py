"""Usage : python3 tools/generate-discs.py Images
Génère les visuels de certification (Or / Platine / Diamant) en SVG.
Même gabarit pour les trois : disque métallique, sillons, reflets, étiquette centrale."""
import math, sys

OUT = sys.argv[1]
C = 256  # centre

TIERS = {
    "or": dict(
        metal=[("0", "#fff4c4"), ("0.35", "#f2cf6b"), ("0.7", "#c8922e"), ("1", "#6e4a10")],
        rim="#ffe9a3", ring="#f2cf6b", label=["#2a1d07", "#120c02"], glow="#ffd56b", iris=False),
    "platine": dict(
        metal=[("0", "#ffffff"), ("0.35", "#e3e6ee"), ("0.7", "#a9aebb"), ("1", "#4d5262")],
        rim="#ffffff", ring="#dfe3ec", label=["#1c1e26", "#0b0c11"], glow="#e8ecf6", iris=False),
    "diamant": dict(
        metal=[("0", "#ffffff"), ("0.3", "#dff3ff"), ("0.65", "#8ccaf5"), ("1", "#2c5f99")],
        rim="#f2fbff", ring="#bfe6ff", label=["#0c1a2b", "#060c16"], glow="#9fd8ff", iris=True),
}

def sector(r, a0, a1):
    """Secteur angulaire (en degrés) depuis le centre."""
    x0, y0 = C + r * math.cos(math.radians(a0)), C + r * math.sin(math.radians(a0))
    x1, y1 = C + r * math.cos(math.radians(a1)), C + r * math.sin(math.radians(a1))
    return f"M{C} {C}L{x0:.1f} {y0:.1f}A{r} {r} 0 0 1 {x1:.1f} {y1:.1f}Z"

def gem(cx, cy, s, fill, stroke):
    """Petit diamant taillé (vue de face) pour l'étiquette Diamant."""
    top = cy - s * .55
    girdle = cy - s * .12
    bottom = cy + s * .7
    w, wt = s * .9, s * .5
    pts_outline = f"{cx-wt:.1f},{top:.1f} {cx+wt:.1f},{top:.1f} {cx+w:.1f},{girdle:.1f} {cx:.1f},{bottom:.1f} {cx-w:.1f},{girdle:.1f}"
    facets = (f"M{cx-w:.1f} {girdle:.1f}H{cx+w:.1f}"
              f"M{cx-wt:.1f} {top:.1f}L{cx-s*.25:.1f} {girdle:.1f}L{cx:.1f} {bottom:.1f}"
              f"M{cx+wt:.1f} {top:.1f}L{cx+s*.25:.1f} {girdle:.1f}L{cx:.1f} {bottom:.1f}"
              f"M{cx-s*.25:.1f} {girdle:.1f}L{cx:.1f} {top:.1f}L{cx+s*.25:.1f} {girdle:.1f}")
    return (f'<polygon points="{pts_outline}" fill="{fill}" stroke="{stroke}" stroke-width="2.2" stroke-linejoin="round"/>'
            f'<path d="{facets}" fill="none" stroke="{stroke}" stroke-width="1.4" stroke-linejoin="round" opacity=".85"/>')

for name, t in TIERS.items():
    stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in t["metal"])
    grooves = "".join(
        f'<circle cx="{C}" cy="{C}" r="{r}" fill="none" stroke="#000" stroke-opacity="{.10 + .08 * ((r // 4) % 2):.2f}" stroke-width=".9"/>'
        for r in range(100, 234, 4))
    # séparations entre « pistes »
    tracks = "".join(
        f'<circle cx="{C}" cy="{C}" r="{r}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.6"/>'
        for r in (138, 176, 208))
    iris = ""
    if t["iris"]:
        iris = (f'<circle cx="{C}" cy="{C}" r="236" fill="url(#iris-{name})" opacity=".55" style="mix-blend-mode:screen"/>')
    label_mark = (gem(C, C - 4, 36, f"url(#metal-{name})", t["rim"]) if name == "diamant" else
                  f'<circle cx="{C}" cy="{C}" r="34" fill="none" stroke="url(#metal-{name})" stroke-width="3"/>'
                  f'<circle cx="{C}" cy="{C}" r="25" fill="none" stroke="{t["ring"]}" stroke-opacity=".35" stroke-width="1"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Disque {name}">
<defs>
  <radialGradient id="metal-{name}" cx="38%" cy="32%" r="80%">{stops}</radialGradient>
  <linearGradient id="sheen-{name}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="shade-{name}" cx="50%" cy="50%" r="50%">
    <stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/>
  </radialGradient>
  <radialGradient id="label-{name}" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="{t["label"][0]}"/><stop offset="1" stop-color="{t["label"][1]}"/></radialGradient>
  <radialGradient id="glow-{name}" cx="50%" cy="50%" r="50%"><stop offset=".6" stop-color="{t["glow"]}" stop-opacity=".35"/><stop offset="1" stop-color="{t["glow"]}" stop-opacity="0"/></radialGradient>
  <linearGradient id="iris-{name}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ff9bf0" stop-opacity=".0"/><stop offset=".3" stop-color="#ff9bf0" stop-opacity=".45"/>
    <stop offset=".5" stop-color="#9bfff0" stop-opacity=".45"/><stop offset=".7" stop-color="#9bb8ff" stop-opacity=".5"/><stop offset="1" stop-color="#9bb8ff" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="clip-{name}"><circle cx="{C}" cy="{C}" r="238"/></clipPath>
  <filter id="soft-{name}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<circle cx="{C}" cy="{C}" r="256" fill="url(#glow-{name})"/>
<circle cx="{C}" cy="{C}" r="238" fill="url(#metal-{name})"/>
{grooves}
{tracks}
{iris}
<g clip-path="url(#clip-{name})"><g filter="url(#soft-{name})">
<path d="{sector(260, 110, 160)}" fill="#000" opacity=".22"/>
<path d="{sector(260, 290, 340)}" fill="#000" opacity=".16"/>
<path d="{sector(260, 198, 250)}" fill="#fff" opacity=".55"/>
<path d="{sector(260, 18, 70)}" fill="#fff" opacity=".3"/>
</g></g>
<circle cx="{C}" cy="{C}" r="238" fill="url(#shade-{name})"/>
<circle cx="{C}" cy="{C}" r="237" fill="none" stroke="{t["rim"]}" stroke-opacity=".9" stroke-width="2"/>
<circle cx="{C}" cy="{C}" r="90" fill="#000" fill-opacity=".35"/>
<circle cx="{C}" cy="{C}" r="84" fill="url(#label-{name})"/>
<circle cx="{C}" cy="{C}" r="84" fill="none" stroke="url(#metal-{name})" stroke-width="3"/>
<circle cx="{C}" cy="{C}" r="73" fill="none" stroke="{t["ring"]}" stroke-opacity=".3" stroke-width="1"/>
{label_mark}
{"" if name == "diamant" else f'<circle cx="{C}" cy="{C}" r="7" fill="#05050a" stroke="{t["rim"]}" stroke-opacity=".6" stroke-width="1.5"/>'}
</svg>
'''
    open(f"{OUT}/disque-{name}.svg", "w").write(svg)
    print(name, len(svg))
