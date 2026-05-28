#!/usr/bin/env python3
"""
Clavix - Portable Text marker fix
Zet markdown-stijl markers in Sanity pillarPage section-bodies om naar
echte Portable Text: **bold** -> strong decorator, (anchor -> /url) -> link annotatie.

Gebruik:
  Dry-run (toont alleen wat er zou veranderen, schrijft NIETS):
    python3 fix_markers.py

  Echt toepassen (vereist write-token):
    SANITY_WRITE_TOKEN=sk... python3 fix_markers.py --apply

Optioneel andere slug:
    python3 fix_markers.py --slug ondernemingsrecht
"""
import os, re, sys, json, uuid, urllib.request, urllib.parse

PROJECT_ID  = "74qey4fk"
DATASET     = "production"
API_VERSION = "v2021-10-21"
DEFAULT_SLUG = "burgerlijk-procesrecht"

BASE = f"https://{PROJECT_ID}.api.sanity.io/{API_VERSION}"

LINK_RE = re.compile(r'\(([^()]+?)\s*\u2192\s*(/[^()\s]+)\)')   # (anchor -> /url)
BOLD_RE = re.compile(r'\*\*([^*]+?)\*\*')                       # **bold**


def key():
    return uuid.uuid4().hex[:12]


def transform_text(text):
    """Geeft (children, markDefs, n_bold, n_link) terug, of None als er niets te doen is."""
    matches = []
    for m in LINK_RE.finditer(text):
        matches.append((m.start(), m.end(), 'link', m.group(1).strip(), m.group(2).strip()))
    for m in BOLD_RE.finditer(text):
        matches.append((m.start(), m.end(), 'bold', m.group(1), None))
    if not matches:
        return None
    matches.sort()
    children, markDefs = [], []
    pos = n_bold = n_link = 0
    for start, end, kind, a, b in matches:
        if start < pos:
            continue  # overlap, sla over
        if start > pos:
            children.append({"_type": "span", "_key": key(), "text": text[pos:start], "marks": []})
        if kind == 'bold':
            children.append({"_type": "span", "_key": key(), "text": a, "marks": ["strong"]})
            n_bold += 1
        else:
            mk = key()
            markDefs.append({"_key": mk, "_type": "link", "href": b})
            children.append({"_type": "span", "_key": key(), "text": "(", "marks": []})
            children.append({"_type": "span", "_key": key(), "text": a, "marks": [mk]})
            children.append({"_type": "span", "_key": key(), "text": ")", "marks": []})
            n_link += 1
        pos = end
    if pos < len(text):
        children.append({"_type": "span", "_key": key(), "text": text[pos:], "marks": []})
    return children, markDefs, n_bold, n_link


def fetch_docs(slug, token):
    q = '*[_type=="pillarPage" && slug.current=="%s"]{_id, title, sections}' % slug
    url = f"{BASE}/data/query/{DATASET}?query=" + urllib.parse.quote(q)
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as r:
        return json.load(r)["result"]


def transform_doc(doc):
    """Muteert doc in-place. Geeft (changed_blocks, total_bold, total_link) terug."""
    changed = tb = tl = 0
    for sec in doc.get("sections", []) or []:
        for block in sec.get("body", []) or []:
            if block.get("_type") != "block":
                continue
            full = "".join(c.get("text", "") for c in block.get("children", []) or [])
            res = transform_text(full)
            if res is None:
                continue
            children, markDefs, nb, nl = res
            block["children"] = children
            block["markDefs"] = markDefs
            changed += 1; tb += nb; tl += nl
    return changed, tb, tl


def apply_mutations(docs, token):
    mutations = [{"patch": {"id": d["_id"], "set": {"sections": d["sections"]}}} for d in docs]
    body = json.dumps({"mutations": mutations}).encode("utf-8")
    url = f"{BASE}/data/mutate/{DATASET}"
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def main():
    apply = "--apply" in sys.argv
    slug = DEFAULT_SLUG
    if "--slug" in sys.argv:
        slug = sys.argv[sys.argv.index("--slug") + 1]
    token = os.environ.get("SANITY_WRITE_TOKEN")

    docs = fetch_docs(slug, token)
    if not docs:
        print(f"Geen document gevonden voor slug '{slug}'."); sys.exit(1)

    print(f"Slug: {slug} | {len(docs)} documentversie(s) gevonden:")
    for d in docs:
        kind = "DRAFT" if d["_id"].startswith("drafts.") else "PUBLISHED"
        cb, tb, tl = transform_doc(d)
        print(f"  - {kind:9} {d['_id']}: {cb} blocks aangepast, {tb} bold, {tl} links")

    if not apply:
        print("\n[DRY-RUN] Er is NIETS geschreven. Voorbeeld van eerste 3 aangepaste blocks:")
        shown = 0
        for d in docs:
            for sec in d.get("sections", []):
                for block in sec.get("body", []):
                    if block.get("_type") == "block" and len(block.get("markDefs", [])) >= 0:
                        spans = block.get("children", [])
                        has_mark = any(s.get("marks") for s in spans) or block.get("markDefs")
                        if has_mark and shown < 3:
                            preview = "".join(
                                (f"[B]{s['text']}[/B]" if "strong" in s.get("marks", [])
                                 else (f"[L]{s['text']}[/L]" if s.get("marks") else s["text"]))
                                for s in spans)
                            print("   * " + preview[:200])
                            shown += 1
        print("\nTevreden? Draai opnieuw met:  SANITY_WRITE_TOKEN=sk... python3 fix_markers.py --apply")
        return

    if not token:
        print("\nFOUT: --apply vereist SANITY_WRITE_TOKEN env-var."); sys.exit(1)
    result = apply_mutations(docs, token)
    print("\n[APPLIED] Mutatie verzonden. Resultaat:")
    print(json.dumps(result, indent=2)[:500])
    print("\nTrigger nu een Netlify rebuild en verifieer de pagina.")


if __name__ == "__main__":
    main()
