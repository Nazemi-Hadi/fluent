# Real example sentences from Tatoeba for Oxford words that have no dictionary example.
import json, os, time, urllib.request, urllib.parse
C = "cache_tt.json"
cache = json.load(open(C, encoding="utf-8")) if os.path.exists(C) else {}
s = open("D:/Claude Code/fluent/words.js").read()
ox = json.loads(s[s.index("COURSE.ox = ") + 12:s.index(";\nCOURSE.fa")])
todo = [o["w"] for o in ox if not any(d[2] for d in o["d"]) and o["w"] not in cache]
print("todo", len(todo), flush=True)
for i, w in enumerate(todo):
    u = "https://tatoeba.org/en/api_v0/search?from=eng&query=" + urllib.parse.quote("=" + w) + "&orphans=no&unapproved=no&limit=40"
    for a in range(4):
        try:
            j = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "FluentStudyApp/1.0 (personal learning tool)"}), timeout=25).read())
            sents = [r["text"] for r in j.get("results", [])]
            good = [x for x in sents if 7 <= len(x.split()) <= 18 and not x.lower().startswith(w.lower())]
            good.sort(key=lambda x: abs(len(x.split()) - 11))
            cache[w] = good[:2]
            break
        except Exception:
            time.sleep(10 * (a + 1))
    time.sleep(1.0)
    if i % 50 == 0:
        json.dump(cache, open(C, "w", encoding="utf-8")); print(i, flush=True)
json.dump(cache, open(C, "w", encoding="utf-8"))
print("done", len(cache), "with examples:", sum(1 for v in cache.values() if v), flush=True)
