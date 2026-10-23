import json, glob, os, sys
SRC, DST = sys.argv[1], sys.argv[2]
DROP = {"fall-2021-nanke-water-plant", "fall-2026-nanke-factory", "solar-2024-xiaoerjia-indictment"}
FROM = "2010-12-25"
MASK = json.load(open(os.path.join(SRC, "mask.json"), encoding="utf-8")) if os.path.exists(os.path.join(SRC, "mask.json")) else {}
def mask(text):
    for k, v in MASK.items():
        text = text.replace(k, v)
    return text
KEEP = ("id","name","date","place","plain","facts","fear","sources","helpline","helplineKids","helplineDrug")
os.makedirs(DST, exist_ok=True)
seen, total = set(), 0
for path in sorted(p for p in glob.glob(os.path.join(SRC, "*.json")) if os.path.basename(p) != "mask.json"):
    zone = os.path.basename(path)[:-5]
    out = []
    for r in json.load(open(path, encoding="utf-8")):
        if r["id"] in DROP or r["date"] < FROM or r["id"] in seen:
            continue
        seen.add(r["id"])
        rec = json.loads(mask(json.dumps({k: r[k] for k in KEEP if k in r}, ensure_ascii=False)))
        if "D" in rec["fear"] and zone in ("float", "fall"):
            rec["helpline"] = True
        out.append(rec)
    out.sort(key=lambda r: r["date"], reverse=True)
    json.dump(out, open(os.path.join(DST, zone + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    total += len(out)
    print(f"{zone:8s} {len(out)}")
print("total", total)
