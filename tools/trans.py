import json, os, sys, time, urllib.request, urllib.parse
items = json.load(open("phr.json")); C = "cache_phr.json"
cache = json.load(open(C, encoding="utf-8")) if os.path.exists(C) else {}
def tr(text):
    for a in range(5):
        try:
            u = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=" + urllib.parse.quote(text)
            j = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read().decode("utf-8"))
            return "".join(x[0] for x in j[0] if x[0])
        except Exception:
            time.sleep(3 * (a + 1))
    return ""
n = 0
for it in items:
    k = it["p"].lower()
    if k in cache: continue
    cache[k] = tr(it["m"]); n += 1; time.sleep(0.15)
    if n % 100 == 0: json.dump(cache, open(C, "w", encoding="utf-8")); print(n, flush=True)
json.dump(cache, open(C, "w", encoding="utf-8")); print("done", len(cache))
