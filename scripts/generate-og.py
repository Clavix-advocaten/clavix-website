#!/usr/bin/env python3
"""
Genereert per-pagina OG-afbeeldingen (1200x630) in public/og/.

Gebruik:  python3 scripts/generate-og.py [pad-naar-Montserrat-variabel.ttf]
Haalt titels live uit de publieke Sanity-API (dataset is public).
Draai dit opnieuw na elke nieuwe clusterronde; alleen ontbrekende of
gewijzigde afbeeldingen worden opnieuw geschreven.
"""
import json
import sys
import urllib.request
import urllib.parse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "public" / "og"
UIT.mkdir(exist_ok=True)

FONT_PAD = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "scripts" / "Montserrat-var.ttf")

ROYAL = (42, 44, 112)       # #2A2C70
ROYAL_DONKER = (32, 34, 88)
SAND = (227, 213, 185)      # #E3D5B9
WIT = (255, 255, 255)

B, H = 1200, 630


def font(gewicht: int, grootte: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(FONT_PAD, grootte)
    f.set_variation_by_axes([gewicht])
    return f


def wrap(tekst: str, f: ImageFont.FreeTypeFont, maxbreedte: int, tekenaar: ImageDraw.ImageDraw):
    woorden = tekst.split()
    regels, huidig = [], ""
    for w in woorden:
        proef = (huidig + " " + w).strip()
        if tekenaar.textlength(proef, font=f) <= maxbreedte:
            huidig = proef
        else:
            if huidig:
                regels.append(huidig)
            huidig = w
    if huidig:
        regels.append(huidig)
    return regels


def maak(bestand: str, titel: str, eyebrow: str):
    img = Image.new("RGB", (B, H), ROYAL)
    d = ImageDraw.Draw(img)

    # subtiel donker vlak rechtsonder voor diepte
    d.polygon([(B, H), (B, H - 340), (B - 480, H)], fill=ROYAL_DONKER)

    # wordmark
    d.text((80, 64), "CLAVIX", font=font(800, 44), fill=SAND)
    d.text((80, 114), "A D V O C A T E N", font=font(500, 20), fill=(180, 172, 150))

    # eyebrow
    d.text((80, 210), eyebrow.upper(), font=font(600, 26), fill=SAND)

    # titel: schaal het lettertype terug tot hij in maximaal 3 regels past
    for grootte in (64, 56, 48, 42):
        f = font(700, grootte)
        regels = wrap(titel, f, B - 160, d)
        if len(regels) <= 3:
            break
    regels = regels[:3]
    y = 262
    for regel in regels:
        d.text((80, y), regel, font=f, fill=WIT)
        y += int(grootte * 1.22)

    # accentlijn + site
    d.rectangle([(80, H - 96), (200, H - 90)], fill=SAND)
    d.text((80, H - 72), "clavix.nl", font=font(600, 26), fill=SAND)
    d.text((B - 80 - d.textlength("Amsterdam Zuidas", font=font(500, 26)), H - 72),
           "Amsterdam Zuidas", font=font(500, 26), fill=(180, 172, 150))

    img.save(UIT / bestand, "PNG", optimize=True)


def sanity(query: str):
    url = ("https://74qey4fk.api.sanity.io/v2024-12-01/data/query/production?query="
           + urllib.parse.quote(query))
    with urllib.request.urlopen(url) as r:
        return json.load(r)["result"]


def main():
    paginas = []

    clusters = sanity('*[_type=="clusterPage" && !(_id in path("drafts.**"))]{title, "slug": slug.current, "pillar": parentPillar->shortTitle}')
    for c in clusters:
        paginas.append((f"clusters-{c['slug']}.png", c["title"], c.get("pillar") or "Kennisbank"))

    pillars = sanity('*[_type=="pillarPage" && !(_id in path("drafts.**"))]{title, shortTitle, "slug": slug.current}')
    for p in pillars:
        paginas.append((f"praktijkgebieden-{p['slug']}.png", p.get("shortTitle") or p["title"], "Praktijkgebied"))

    sectoren = sanity('*[_type=="sectorPage" && !(_id in path("drafts.**"))]{title, "slug": slug.current}')
    for s in sectoren:
        paginas.append((f"sectoren-{s['slug']}.png", s["title"], "Sector"))

    notities = sanity('*[_type=="blogPost" && !(_id in path("drafts.**"))]{title, "slug": slug.current}')
    for n in notities:
        paginas.append((f"notities-{n['slug']}.png", n["title"], "Notitie"))

    specialismes = {
        "aandeelhoudersgeschillen": "Advocaat aandeelhoudersgeschillen",
        "bedrijfsoverdracht-met-vastgoed": "Bedrijfsoverdracht met vastgoed",
        "bestuurdersaansprakelijkheid": "Advocaat bestuurdersaansprakelijkheid",
        "bouwgeschillen": "Advocaat bouwgeschillen",
        "contractgeschillen": "Advocaat contractgeschillen",
        "incasso-en-executie": "Advocaat incasso en executie",
        "kort-geding": "Advocaat kort geding",
    }
    for slug, titel in specialismes.items():
        paginas.append((f"specialisme-{slug}.png", titel, "Specialisme"))

    statisch = {
        "kennisbank": ("Kennisbank: juridische artikelen voor ondernemers", "Kennisbank"),
        "kosten": ("Wat kost een advocaat?", "Tarieven"),
        "woordenlijst": ("Juridische woordenlijst", "Kennisbank"),
        "veelgestelde-vragen": ("Veelgestelde vragen", "Kennisbank"),
        "kumar": ("mr. Mukesh Kumar", "Advocaat in Amsterdam Zuidas"),
        "advocaat-zuidas": ("Advocatenkantoor op de Zuidas", "Amsterdam"),
        "werkwijze": ("Onze werkwijze", "Het kantoor"),
        "contact": ("Plan een eerste gesprek", "Contact"),
        "modelbrieven": ("Gratis juridische modelbrieven", "Zelf regelen"),
        "juridisch-abonnement": ("Het juridisch abonnement", "Het kantoor"),
        "wettelijke-rente-berekenen": ("Wettelijke rente berekenen", "Rekentool"),
        "incassokosten-berekenen": ("Incassokosten berekenen", "Rekentool"),
        "proceskosten-berekenen": ("Proceskosten berekenen", "Rekentool"),
    }
    for slug, (titel, eyebrow) in statisch.items():
        paginas.append((f"page-{slug}.png", titel, eyebrow))

    engels = {
        "index": ("Dutch business law firm in Amsterdam", "English"),
        "corporate-law": ("Corporate lawyer in Amsterdam", "English"),
        "real-estate": ("Real estate lawyer in Amsterdam", "English"),
        "insolvency-restructuring": ("Insolvency & restructuring lawyer", "English"),
        "litigation": ("Litigation lawyer in Amsterdam", "English"),
        "fees": ("Fees and engagement", "English"),
        "contact": ("Contact us", "English"),
        "about": ("Mukesh Kumar, Dutch lawyer", "English"),
        "knowledge-commercial-lease-regimes": ("Dutch commercial lease: the 7:290 and 7:230a regimes", "Knowledge"),
        "knowledge-rent-review-dutch-law": ("Rent review under Dutch law: article 7:303", "Knowledge"),
        "knowledge-hidden-defects-commercial-property": ("Hidden defects when buying Dutch commercial property", "Knowledge"),
        "knowledge-rent-arrears-eviction-netherlands": ("Rent arrears and eviction in the Netherlands", "Knowledge"),
        "knowledge-amsterdam-leasehold-erfpacht": ("Amsterdam leasehold (erfpacht) and ground rent revisions", "Knowledge"),
    }
    for slug, (titel, eyebrow) in engels.items():
        paginas.append((f"en-{slug}.png", titel, eyebrow))

    for bestand, titel, eyebrow in paginas:
        maak(bestand, titel, eyebrow)
    print(f"{len(paginas)} OG-afbeeldingen geschreven naar {UIT}")


if __name__ == "__main__":
    main()
