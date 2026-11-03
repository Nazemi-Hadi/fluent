# Wiktionary definitions (fallback source) for every Oxford word.
import json, os, re, time, urllib.request, urllib.parse, urllib.error, html
from concurrent.futures import ThreadPoolExecutor
import threading
items = json.load(open("ox.json")); C = "cache_wk.json"
cache = json.load(open(C, encoding="utf-8")) if os.path.exists(C) else {}
lock = threading.Lock()
TAG = re.compile("<[^>]+>")
def strip(s): return html.unescape(TAG.sub("", s or "")).strip()
def get(u):
    for a in range(6):
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "FluentStudyApp/1.0 (personal learning tool)"})
            return json.loads(urllib.request.urlopen(req, timeout=20).read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404: return {}
            time.sleep(5 * (a + 1))
        except Exception:
            time.sleep(5 * (a + 1))
    return None
def clean(w):
    w = w.split(" (")[0]
    while w and w[-1].isdigit(): w = w[:-1]
    return w.strip()
BAD = ("obsolete", "archaic", "dated", "rare", "dialect", "nonstandard", "slang", "vulgar", "historical")
def work(it):
    k = it["w"]
    j = get("https://en.wiktionary.org/api/rest_v1/page/definition/" + urllib.parse.quote(clean(k)) + "?redirect=true")
    if j is None: return
    out = []
    for e in j.get("en", []):
        defs = []
        for d in e.get("definitions", []):
            t = strip(d.get("definition"))
            if not t or any(b in t.lower()[:40] for b in BAD): continue
            ex = [strip(x) for x in d.get("examples", []) or []]
            defs.append([t, ex[0] if ex else ""])
        if defs: out.append([e.get("partOfSpeech", "").lower(), defs[:3]])
    with lock:
        cache[k] = out
n = 0
todo = [it for it in items if it["w"] not in cache]
with ThreadPoolExecutor(4) as ex:
    for i, _ in enumerate(ex.map(work, todo)):
        if i % 200 == 0:
            with lock: json.dump(cache, open(C, "w", encoding="utf-8"))
            print(i, flush=True)
json.dump(cache, open(C, "w", encoding="utf-8"))
print("done", len(cache), "empty:", sum(1 for v in cache.values() if not v))
