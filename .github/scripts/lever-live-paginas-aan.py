"""
De live pagina's van clavix.nl aanleveren aan de SEO-dienst van het Clavix-systeem (ADR-284).

De dienst draait bij Scaleway en bereikt Netlify niet; GitHub wel. Dit script leest de sitemap, haalt elke pagina
op en stuurt de ruwe HTML in delen van hooguit 50 pagina's naar de dienst. In het laatste deel staan alle adressen
uit de sitemap: wat daar niet in staat, is geen live pagina meer. Alleen de standaardbibliotheek.

Omgeving: SEO_URL (het adres van de dienst) en SEO_AANLEVERTOKEN (een geheim van deze repo).
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

SITE = "https://clavix.nl"
AGENT = "ClavixWebsiteAanlevering/1.0 (+https://clavix.nl)"
PER_DEEL = 50
MAX_SITEMAPS = 10
MAX_PAGINAS = 1000


def haal(url: str) -> tuple[int, str, str]:
    """Status, content-type en tekst; een netwerkfout is status 0."""
    verzoek = urllib.request.Request(url, headers={"user-agent": AGENT})
    for poging in range(3):
        try:
            with urllib.request.urlopen(verzoek, timeout=30) as a:
                return a.status, a.headers.get("content-type", ""), a.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("content-type", ""), ""
        except (urllib.error.URLError, TimeoutError):
            time.sleep(2 * (poging + 1))
    return 0, "", ""


def adressen_uit_sitemap() -> list[str]:
    adressen: list[str] = []
    te_lezen = [f"{SITE}/sitemap-index.xml"]
    n = 0
    while n < len(te_lezen) and n < MAX_SITEMAPS:
        status, _, xml = haal(te_lezen[n])
        n += 1
        if status != 200:
            sys.exit(f"De sitemap {te_lezen[n - 1]} gaf HTTP {status}")
        locs = [l.strip() for l in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", xml)]
        if "<sitemapindex" in xml:
            te_lezen.extend(l for l in locs if l.startswith(SITE + "/"))
        else:
            adressen.extend(l for l in locs if l.startswith(SITE + "/"))
    uniek = list(dict.fromkeys(adressen))[:MAX_PAGINAS]
    if not uniek:
        sys.exit("De sitemap noemt geen pagina's")
    return uniek


def lever_aan(dienst: str, token: str, deel: dict) -> dict:
    verzoek = urllib.request.Request(
        f"{dienst.rstrip('/')}/v1/paginas/aanlevering",
        data=json.dumps(deel).encode("utf-8"),
        method="POST",
        headers={"authorization": f"Bearer {token}", "content-type": "application/json", "user-agent": AGENT},
    )
    try:
        with urllib.request.urlopen(verzoek, timeout=120) as a:
            return json.loads(a.read())
    except urllib.error.HTTPError as e:
        # Alleen de status en de korte melding van de dienst; nooit het token.
        sys.exit(f"De SEO-dienst weigerde een deel: HTTP {e.code} {e.read()[:200].decode('utf-8', 'replace')}")


def main() -> None:
    dienst = os.environ.get("SEO_URL", "").strip()
    token = os.environ.get("SEO_AANLEVERTOKEN", "").strip()
    if not dienst or not token:
        sys.exit("SEO_URL of SEO_AANLEVERTOKEN ontbreekt")
    adressen = adressen_uit_sitemap()
    print(f"{len(adressen)} pagina's in de sitemap")
    goed = 0
    for i in range(0, len(adressen), PER_DEEL):
        paginas = []
        for adres in adressen[i : i + PER_DEEL]:
            status, soort, html = haal(adres)
            is_html = status == 200 and "text/html" in soort
            goed += 1 if is_html else 0
            paginas.append({"adres": adres, "status": status, "html": html if is_html else None})
        deel = {"paginas": paginas}
        if i + PER_DEEL >= len(adressen):
            deel["adressen"] = adressen
        uit = lever_aan(dienst, token, deel)
        print(f"deel {i // PER_DEEL + 1}: {uit.get('bewaard')} bewaard, {uit.get('verwijderd')} verwijderd")
    print(f"{goed} van {len(adressen)} pagina's leesbaar aangeleverd")
    if goed == 0:
        sys.exit("Geen enkele pagina was op te halen")


if __name__ == "__main__":
    main()
