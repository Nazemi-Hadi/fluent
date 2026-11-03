import json, os, time, urllib.request, urllib.parse
items = json.load(open("ox.json")); C = "cache_tr.json"
cache = json.load(open(C, encoding="utf-8")) if os.path.exists(C) else {}
old = json.load(open("cache_ox.json", encoding="utf-8")) if os.path.exists("cache_ox.json") else {}
def clean(w):
    w = w.split(" (")[0]
    while w and w[-1].isdigit(): w = w[:-1]
    return w.strip()
n = 0
for it in items:
    k = it["w"]
    if k in cache or (old.get(k) or {}).get("t"): continue
    for a in range(5):
        try:
            u = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&dt=bd&q=" + urllib.parse.quote(clean(k))
            cache[k] = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read().decode("utf-8"))
            break
        except Exception:
            time.sleep(4 * (a + 1))
    n += 1; time.sleep(0.12)
    if n % 200 == 0: json.dump(cache, open(C, "w", encoding="utf-8")); print(n, flush=True)
json.dump(cache, open(C, "w", encoding="utf-8")); print("done", len(cache))
