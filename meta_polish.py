#!/usr/bin/env python3
"""
Clavix - Sessie 2 meta-polish.
Bewerkt 3 Astro-bestanden (specialisme descriptions) en update 1 Sanity pillar-title in één run.

Gebruik:
  SANITY_WRITE_TOKEN=sk... python3 meta_polish.py

De Astro-edits zijn idempotent: als de OLD-tekst er niet meer staat (al uitgevoerd), wordt die overgeslagen.
"""
import os, sys, json, urllib.request, urllib.parse
from pathlib import Path

REPO = Path('/Users/mukesh/clavix-frontend')
PROJECT_ID = "74qey4fk"
DATASET = "production"
API_VERSION = "v2021-10-21"
BASE_API = f"https://{PROJECT_ID}.api.sanity.io/{API_VERSION}"

ASTRO_EDITS = [
    {
        "name": "kort-geding",
        "file": REPO / "src/pages/specialisme/kort-geding.astro",
        "old": "Bijstand bij kort gedingen voor ondernemers, bestuurders en vastgoedinvesteerders. Voorlopige voorzieningen, beslag, executiegeschillen. Wij beoordelen binnen 24 uur of een procedure bij de voorzieningenrechter kansrijk is.",
        "new": "Kort geding voor ondernemers, bestuurders en vastgoedinvesteerders. Voorlopige voorzieningen, beslag, executiegeschillen. Binnen 24 uur kansinschatting.",
    },
    {
        "name": "contractgeschillen",
        "file": REPO / "src/pages/specialisme/contractgeschillen.astro",
        "old": "Bijstand bij contractgeschillen voor ondernemers, DGA's en vastgoedinvesteerders. Wanprestatie, ontbinding, uitleg (Haviltex), dwaling en schadevergoeding. Realistische uitkomstinschatting vooraf.",
        "new": "Contractgeschillen voor ondernemers, DGA's en vastgoedinvesteerders. Wanprestatie, ontbinding, Haviltex, dwaling. Realistische kansinschatting vooraf.",
    },
    {
        "name": "incasso-en-executie",
        "file": REPO / "src/pages/specialisme/incasso-en-executie.astro",
        "old": "Incasso- en executieadvies voor ondernemers, crediteuren en vastgoedinvesteerders. Buitengerechtelijke incasso (WIK), conservatoir beslag (700 Rv), opheffings-kort-geding (705 Rv), executiegeschillen (438 Rv), en verhaalsstrategie v\u00f3\u00f3r dreigende insolventie.",
        "new": "Incasso en executie voor ondernemers en crediteuren. Conservatoir beslag, opheffings-kort-geding, executiegeschillen en verhaalsstrategie v\u00f3\u00f3r insolventie.",
    },
]

PILLAR_SLUG = "burgerlijk-procesrecht"
PILLAR_TITLE_OLD = "Burgerlijk procesrecht advocaat | NOvA-specialist Zuidas"
PILLAR_TITLE_NEW = "Burgerlijk procesrecht advocaat Zuidas"


def edit_astro_files():
    print("=== Astro-bestanden (specialisme descriptions) ===")
    for spec in ASTRO_EDITS:
        path = spec["file"]
        if not path.exists():
            print(f"  ! {spec['name']}: bestand niet gevonden ({path})")
            continue
        content = path.read_text(encoding="utf-8")
        if spec["new"] in content and spec["old"] not in content:
            print(f"  - {spec['name']}: nieuwe tekst al aanwezig, overslaan")
            continue
        count = content.count(spec["old"])
        if count == 0:
            print(f"  ! {spec['name']}: OLD-tekst niet gevonden (mogelijk afwijkende quoting in bron) — overslaan")
            continue
        if count > 1:
            print(f"  ! {spec['name']}: OLD-tekst {count}x gevonden, verwacht 1 — overslaan")
            continue
        path.write_text(content.replace(spec["old"], spec["new"]), encoding="utf-8")
        print(f"  OK {spec['name']}: {len(spec['old'])} -> {len(spec['new'])} tekens")


def fetch_pillar_docs(token):
    q = f'*[_type=="pillarPage" && slug.current=="{PILLAR_SLUG}"]{{_id, "currentMetaTitle": seo.metaTitle}}'
    url = f"{BASE_API}/data/query/{DATASET}?query=" + urllib.parse.quote(q)
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as r:
        return json.load(r)["result"]


def update_pillar_title(token):
    print("=== Sanity pillar-title (burgerlijk-procesrecht) ===")
    docs = fetch_pillar_docs(token)
    if not docs:
        print(f"  ! Geen pillar gevonden voor slug '{PILLAR_SLUG}'")
        return
    mutations = []
    for d in docs:
        kind = "DRAFT" if d["_id"].startswith("drafts.") else "PUBLISHED"
        current = d.get("currentMetaTitle", "")
        if current == PILLAR_TITLE_NEW:
            print(f"  - {kind} {d['_id']}: title is al up-to-date, overslaan")
            continue
        if current != PILLAR_TITLE_OLD:
            print(f"  ! {kind} {d['_id']}: huidige title wijkt af van verwacht")
            print(f"      verwacht: {PILLAR_TITLE_OLD!r}")
            print(f"      gevonden: {current!r}")
            continue
        mutations.append({"patch": {"id": d["_id"], "set": {"seo.metaTitle": PILLAR_TITLE_NEW}}})
        print(f"  OK {kind} {d['_id']}: {len(PILLAR_TITLE_OLD)} -> {len(PILLAR_TITLE_NEW)} tekens voorbereid")
    if not mutations:
        print("  Geen mutaties te versturen.")
        return
    body = json.dumps({"mutations": mutations}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_API}/data/mutate/{DATASET}", data=body, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as r:
        result = json.load(r)
    print(f"  Sanity mutatie verzonden: {len(result.get('results', []))} updates, transactionId {result.get('transactionId')}")


def main():
    edit_astro_files()
    print()
    token = os.environ.get("SANITY_WRITE_TOKEN")
    if not token:
        print("=== Sanity pillar-title ===")
        print("  ! SANITY_WRITE_TOKEN env-var niet gezet, Sanity-update overgeslagen.")
        sys.exit(1)
    update_pillar_title(token)
    print()
    print("Klaar. Volgende stappen:")
    print("  1. git add src/pages/specialisme/ && git commit -m 'fix: trim 3 specialisme meta-descriptions' && git push")
    print("  2. Netlify build hook triggeren om Sanity-wijziging te laten ophalen:")
    print("     curl -X POST -d {} https://api.netlify.com/build_hooks/69fc979fd3ede06e58064063")


if __name__ == "__main__":
    main()
