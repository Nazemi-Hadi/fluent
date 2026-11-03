# Dictionary + translation fetch with proper rate-limit handling. Re-does entries whose dictionary lookup failed.
import json, os, sys, time, urllib.request, urllib.parse, urllib.error
items = json.load(open("ox.json")); C = "cache_ox.json"
cache = json.load(open(C, encoding="utf-8")) if os.path.exists(C) else {}
def get(u, tries=12):
    for a in range(tries):
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
            return urllib.request.urlopen(req, timeout=20).read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 404: return "404"
            time.sleep(20 if e.code == 429 else 5)
        except Exception:
            time.sleep(5)
    return None
def clean(w):
    w = w.split(" (")[0]
    while w and w[-1].isdigit(): w = w[:-1]
    return w.strip()
n = 0
for it in items:
    k = it["w"]; rec = cache.get(k) or {}
    need_d = rec.get("d") is None and rec.get("d404") is not True
    need_t = not rec.get("t")
    if not need_d and not need_t: continue
    w = clean(k)
    if need_d:
        d = get("https://api.dictionaryapi.dev/api/v2/entries/en/" + urllib.parse.quote(w))
        if d == "404": rec["d"] = None; rec["d404"] = True
        elif d: rec["d"] = json.loads(d)
        time.sleep(0.6)
    if need_t:
        t = get("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&dt=bd&q=" + urllib.parse.quote(w))
        if t and t != "404": rec["t"] = json.loads(t)
    cache[k] = rec; n += 1
    if n % 50 == 0:
        json.dump(cache, open(C, "w", encoding="utf-8")); print(n, k, flush=True)
json.dump(cache, open(C, "w", encoding="utf-8"))
print("done", len(cache), "missing d:", sum(1 for v in cache.values() if v.get("d") is None and not v.get("d404")), "404:", sum(1 for v in cache.values() if v.get("d404")))
