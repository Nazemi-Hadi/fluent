import json, re
POS = {"n.": "noun", "v.": "verb", "adj.": "adjective", "adv.": "adverb", "prep.": "preposition",
       "conj.": "conjunction", "pron.": "pronoun", "det.": "determiner", "exclam.": "exclamation",
       "number": "number"}
LV = {"A1", "A2", "B1", "B2", "C1"}
out = []
bad = []
for line in open("raw.txt", encoding="utf-8").read().splitlines():
    line = line.strip().replace("n.B2", "n. B2")
    if not line or "Oxford" in line or line.startswith("3000,"):
        continue
    toks = line.replace(",", " , ").split()
    i = next((k for k, t in enumerate(toks) if t in POS), None)
    if i is None or i == 0:
        bad.append(line); continue
    word = " ".join(toks[:i])
    rest = toks[i:]
    pos, lv, cur = [], [], []
    for t in rest:
        if t in POS: cur.append(POS[t])
        elif t in LV:
            for p in cur:
                pos.append(p); lv.append(t)
            cur = []
    if not pos:
        bad.append(line); continue
    out.append({"w": word, "pos": pos, "lv": lv})
print(len(out), "bad:", bad[:20])
json.dump(out, open("ox.json", "w"), indent=0)
from collections import Counter
print(Counter(min(o["lv"]) for o in out))
print(out[:3], out[-3:])
