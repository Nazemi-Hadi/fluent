# One gentle, resumable pass over all Oxford words: Wiktionary + dictionaryapi + Persian, respecting rate limits.
import json, os, re, time, html, urllib.request, urllib.parse, urllib.error
items = json.load(open("ox.json"))
def load(f): return json.load(open(f, encoding="utf-8")) if os.path.exists(f) else {}
ox, wk, tr = load("cache_ox.json"), load("cache_wk.json"), load("cache_tr.json")
TAG = re.compile("<[^>]+>")
BAD = ("obsolete", "archaic", "dated", "rare", "dialect", "nonstandard", "slang", "vulgar", "historical")
pause = {"dict": 0, "tr": 0}
def get(u, ua="Mozilla/5.0"):
    try:
        return 200, urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": ua}), timeout=20).read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception:
        return 0, None
def js(b):
    try: return json.loads(b)
    except Exception: return None
def clean(w):
    w = w.split(" (")[0]
    while w and w[-1].isdigit(): w = w[:-1]
    return w.strip()
def strip(s): return html.unescape(TAG.sub("", s or "")).strip()
def save():
    for f, d in (("cache_ox.json", ox), ("cache_wk.json", wk), ("cache_tr.json", tr)):
        json.dump(d, open(f, "w", encoding="utf-8"))
n = 0
for rnd in range(8):
    for it in items:
        k, w = it["w"], clean(it["w"])
        q = urllib.parse.quote(w)
        rec = ox.get(k) or {}
        if rec.get("d") is None and not rec.get("d404") and time.time() > pause["dict"]:
            c, b = get("https://api.dictionaryapi.dev/api/v2/entries/en/" + q)
            if c == 200 and js(b) is not None: rec["d"] = js(b)
            elif c == 404: rec["d404"] = True
            elif c == 429: pause["dict"] = time.time() + 120
            ox[k] = rec
            time.sleep(1.0)
        if k not in wk and rec.get("d404"):
            c, b = get("https://en.wiktionary.org/api/rest_v1/page/definition/" + q + "?redirect=true", "FluentStudyApp/1.0 (personal learning tool)")
            if c in (200, 404):
                out = []
                for e in ((js(b) or {}).get("en", []) if b else []):
                    defs = []
                    for d in e.get("definitions", []):
                        t = strip(d.get("definition"))
                        if not t or any(x in t.lower()[:40] for x in BAD): continue
                        ex = [strip(x) for x in d.get("examples", []) or []]
                        defs.append([t, ex[0] if ex else ""])
                    if defs: out.append([e.get("partOfSpeech", "").lower(), defs[:3]])
                wk[k] = out
            time.sleep(0.3)
        if not rec.get("t") and k not in tr and time.time() > pause["tr"]:
            c, b = get("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&dt=bd&q=" + q)
            if c == 200 and js(b) is not None: tr[k] = js(b)
            elif c == 429: pause["tr"] = time.time() + 600
            time.sleep(1.5)
        n += 1
        if n % 25 == 0: save()
        if n % 200 == 0: print("round", rnd, "n", n, "wk", len(wk), "dict ok", sum(1 for v in ox.values() if v.get("d")), "fa", len(tr) + sum(1 for v in ox.values() if v.get("t")), flush=True)
    save()
    missing = [it for it in items if (it["w"] not in wk and (ox.get(it["w"]) or {}).get("d404")) or ((ox.get(it["w"]) or {}).get("d") is None and not (ox.get(it["w"]) or {}).get("d404")) or not ((ox.get(it["w"]) or {}).get("t") or it["w"] in tr)]
    print("end of round", rnd, "still missing something:", len(missing), flush=True)
    if not missing: break
    time.sleep(300)
print("done", flush=True)
