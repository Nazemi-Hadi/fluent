// Fluent - speaking & listening coach. ASCII only.
(function () {
  "use strict";
  var C = window.COURSE;
  C.ox = C.ox || []; C.fa = C.fa || {}; C.extra = C.extra || {};
  var KEY = "fluent.v1";
  var DAYS = 112;
  var INT = [0, 1, 3, 7, 14, 30, 60, 120];
  var main = document.getElementById("main");
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ---------- dates ----------
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); }
  function diffDays(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
  function today() { return iso(new Date()); }
  function niceDate(s) { return parseISO(s).toLocaleDateString("en-GB", {weekday: "short", day: "numeric", month: "short"}); }

  // ---------- state ----------
  var S = (function () {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
    s = s || {};
    var def = {start: today(), srs: {}, own: [], log: {}, done: {}, img: {}, imgUrl: {}, voice: "", accent: "uk",
      goal: 150, target: 100, fa: true, auto: true};
    Object.keys(def).forEach(function (k) { if (s[k] === undefined) s[k] = def[k]; });
    return s;
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Storage is full - export a backup"); } }
  save();

  function courseToday() { return Math.max(0, Math.min(DAYS - 1, diffDays(S.start, today()))); }
  var VIEW = courseToday();
  function dayInfo(i) {
    var week = Math.floor(i / 7) + 1;
    return {i: i, week: week, dow: (i % 7) + 1, W: C.weeks[week - 1]};
  }

  // ---------- words & study queue ----------
  function key(p) { return String(p).toLowerCase().trim(); }
  var WORDS = {}, QUEUE = [];
  function catOf(i) {
    var c = (C.extraCats || []).filter(function (x) { return i >= x[0] && i < x[1]; })[0];
    return c ? c[2] : "Phrase";
  }
  function put(w) {
    var k = key(w.p);
    if (WORDS[k]) return false;
    w.fa = w.fa || C.fa[k] || "";
    WORDS[k] = w;
    return true;
  }
  (function buildQueue() {
    var oxi = 0;
    for (var i = 0; i < DAYS; i++) {
      var di = dayInfo(i), day = [];
      var ch = C.words[di.week];
      if (ch && di.dow <= 6) ch.slice((di.dow - 1) * 6, di.dow * 6).forEach(function (s) {
        var p = s.split("|");
        day.push({p: p[0], d: p[1] || "", e: p[2] || "", q: p[3] || p[0], wk: di.week, plan: i, type: "chunk", cat: "Everyday chunk"});
      });
      (C.extra[di.week] || []).forEach(function (s, j) {
        if (j % 7 !== di.dow - 1) return;
        var p = s.split("|");
        day.push({p: p[0], d: p[1] || "", e: p[2] || "", q: p[0], wk: di.week, plan: i, type: "extra", cat: catOf(j)});
      });
      while (day.length < S.target && oxi < C.ox.length) {
        var o = C.ox[oxi++], d0 = (o.d && o.d[0]) || [];
        day.push({p: o.w, d: d0[1] || "", e: d0[2] || "", q: o.w, defs: o.d || [], pos: o.p, lv: o.l, ipa: o.i, au: o.a,
          fa: o.f, uk: o.uk, h: o.h, wk: di.week, plan: i, type: "ox", cat: "Oxford 5000"});
      }
      day.forEach(function (w) { if (put(w)) QUEUE.push(key(w.p)); });
    }
  })();
  function syncOwn() { S.own.forEach(function (o) { o.own = true; o.type = "own"; o.cat = "My word"; WORDS[key(o.p)] = o; }); }
  syncOwn();

  var STOP = "a an the be to of on in up out for with is it i i'm i'll i've do does you your this that have has get got some someone something my at by and or can't don't what how's it's been (someone) (finance) ...".split(" ");
  function headword(p) {
    var ws = String(p).toLowerCase().replace(/[^a-z' -]/g, " ").split(" ").filter(function (w) { return w && STOP.indexOf(w) < 0; });
    ws.sort(function (a, b) { return b.length - a.length; });
    return ws[0] || String(p).toLowerCase();
  }
  function stem(p) { var h = headword(p); return h.slice(0, Math.max(4, h.length - 2)); }

  // ---------- SRS ----------
  // b: 0-1 learning, 2-4 getting there, 5+ known. Triage: new -> b0, rarely used -> b1, known -> b6.
  function triage(k, kind) {
    var b = kind === "known" ? 6 : kind === "rare" ? 1 : 0;
    S.srs[k] = {b: b, due: addDays(today(), kind === "known" ? INT[6] : 1), n: 0, added: today(), t: kind};
    save();
  }
  function addCard(k) {
    if (!S.srs[k]) { S.srs[k] = {b: 0, due: addDays(today(), 1), n: 0, added: today(), t: "new"}; save(); }
  }
  function grade(k, g) {
    var c = S.srs[k] || (S.srs[k] = {b: 0, n: 0, added: today(), t: "new"});
    c.n++;
    // g: 0 again, 1 hard, 2 good, 3 easy
    if (g === 0) { c.b = 0; c.due = today(); }
    else {
      c.b = g === 1 ? Math.max(1, c.b) : Math.min(INT.length - 1, c.b + g - 1);
      c.due = addDays(today(), g === 1 ? Math.max(1, Math.floor(INT[c.b] / 2)) : INT[c.b]);
    }
    c.last = today();
    save();
  }
  function dueKeys() {
    var t = today();
    return Object.keys(S.srs).filter(function (k) { return WORDS[k] && S.srs[k].due <= t; })
      .sort(function (a, b) { return S.srs[a].b - S.srs[b].b || (S.srs[a].due < S.srs[b].due ? -1 : 1); });
  }
  function status(k) {
    var c = S.srs[k];
    if (!c) return "not seen";
    return c.b >= 5 ? "known" : c.b >= 2 ? "getting there" : "learning";
  }
  function newToday() { var t = today(); return Object.keys(S.srs).filter(function (k) { return S.srs[k].added === t; }); }
  function learnToday() {
    var t = today();
    return Object.keys(S.srs).filter(function (k) { return WORDS[k] && S.srs[k].added === t && S.srs[k].t !== "known"; });
  }
  function nextUnseen() { for (var i = 0; i < QUEUE.length; i++) if (!S.srs[QUEUE[i]]) return QUEUE[i]; return null; }
  function seenCount() { return QUEUE.filter(function (k) { return S.srs[k]; }).length; }

  // ---------- time log ----------
  var active = null;
  function addTime(ms) {
    if (ms <= 0) return;
    var d = today(), L = S.log[d] = S.log[d] || {ms: 0};
    L.ms += Math.min(ms, 3600000);
    save();
  }
  function startBlock(id) { stopBlock(); active = {id: id, t0: Date.now(), paused: document.hidden}; }
  function stopBlock() { if (active && !active.paused) addTime(Date.now() - active.t0); active = null; }
  document.addEventListener("visibilitychange", function () {
    if (!active) return;
    if (document.hidden) { if (!active.paused) addTime(Date.now() - active.t0); active.paused = true; }
    else { active.t0 = Date.now(); active.paused = false; }
  });
  function todayMs() {
    var ms = (S.log[today()] || {}).ms || 0;
    if (active && !active.paused) ms += Date.now() - active.t0;
    return ms;
  }
  setInterval(function () {
    document.getElementById("clock").textContent = Math.floor(todayMs() / 60000) + " min";
  }, 1000);

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var toastT;
  function toast(m) {
    var t = document.getElementById("toast");
    t.textContent = m; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2600);
  }
  function setHead(title, sub, back) {
    document.getElementById("ttl").textContent = title;
    document.getElementById("sub").textContent = sub || "";
    document.getElementById("back").hidden = !back;
    document.title = title === "Fluent" ? "Fluent" : title + " - Fluent";
  }
  document.getElementById("back").onclick = function () {
    if (history.length > 1) history.back(); else location.hash = "#today";
  };
  function pick(arr, n, seed) {
    var out = [];
    if (!arr || !arr.length) return out;
    for (var j = 0; j < n && j < arr.length; j++) out.push(arr[(seed + j) % arr.length]);
    return out;
  }
  function claudeLink(task, said) {
    return "https://claude.ai/new?q=" + encodeURIComponent(
      "I live in the UK and I'm practising spoken British English. Below is a transcript of me speaking (it comes from speech recognition, so ignore punctuation and capital letters). " +
      "The task was: " + task + "\n\nPlease: 1) list my grammar, tense and word-choice mistakes with corrections and a one-line reason; " +
      "2) rewrite my answer the way a fluent British speaker would say it, keeping my ideas; 3) give me 6 more advanced words or phrases I could have used, with an example each; " +
      "4) score my fluency, accuracy and range out of 10.\n\nTranscript: \"" + said + "\"");
  }

  // ---------- speech out ----------
  var voices = [];
  function loadVoices() { if (window.speechSynthesis) voices = speechSynthesis.getVoices() || []; }
  loadVoices();
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = loadVoices;
  function enVoices() { return voices.filter(function (v) { return /^en/i.test(v.lang || ""); }); }
  function gbVoice() {
    var gb = function (v) { return (v.lang || "").replace("_", "-").toLowerCase() === "en-gb"; };
    if (S.voice) { var f = voices.filter(function (v) { return v.name === S.voice; })[0]; if (f) return f; }
    return voices.filter(function (v) { return gb(v) && /google/i.test(v.name); })[0] || voices.filter(gb)[0] || enVoices()[0] || null;
  }
  function speak(text, rate, onend) {
    if (!window.speechSynthesis) { toast("No speech voice on this device"); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text), v = gbVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
    u.rate = rate || 1;
    if (onend) u.onend = onend;
    speechSynthesis.speak(u);
  }
  function playUrl(u) { var a = new Audio(u); a.play().catch(function () { toast("Could not play audio"); }); }
  function accentOf(u) {
    if (!u) return "";
    if (u.indexOf("-uk") >= 0) return "UK";
    if (u.indexOf("-us") >= 0) return "US";
    if (u.indexOf("-au") >= 0) return "AU";
    return "";
  }

  // ---------- dictionary (for phrases and own words) ----------
  var dictMem = {};
  function parseDict(j, word) {
    var ph = [], ex = [], def = "";
    j.forEach(function (e) {
      (e.phonetics || []).forEach(function (p) { ph.push(p); });
      (e.meanings || []).forEach(function (m) {
        (m.definitions || []).forEach(function (d) {
          if (!def) def = d.definition;
          if (d.example && ex.length < 4) ex.push(d.example);
        });
      });
    });
    var uk = ph.filter(function (p) { return p.audio && p.audio.indexOf("-uk") >= 0; })[0];
    var any = ph.filter(function (p) { return p.audio; })[0];
    var txt = (uk && uk.text) || (ph.filter(function (p) { return p.text; })[0] || {}).text || j[0].phonetic || "";
    return {word: word, ipa: txt, audio: (uk || any || {}).audio || "", ex: ex, def: def};
  }
  function dict(phrase, cb) {
    var k = key(phrase);
    if (dictMem[k] !== undefined) return cb(dictMem[k]);
    var cands = [k.replace(/[^a-z' -]/g, " ").trim()], hw = headword(phrase);
    if (cands.indexOf(hw) < 0) cands.push(hw);
    (function next(i) {
      if (i >= cands.length) { dictMem[k] = null; return cb(null); }
      fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(cands[i]))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j.length) { var res = parseDict(j, cands[i]); dictMem[k] = res; cb(res); } else next(i + 1); })
        .catch(function () { next(i + 1); });
    })(0);
  }

  // ---------- pictures ----------
  var imgMem = {};
  function wikiImages(q, cb) {
    fetch("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent("filetype:bitmap " + q) +
      "&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var pages = (j.query && j.query.pages) || {};
        cb(Object.keys(pages).map(function (k) { return pages[k]; }).sort(function (a, b) { return a.index - b.index; })
          .map(function (p) { var ii = (p.imageinfo || [])[0] || {}; return {src: ii.thumburl, by: "Wikimedia Commons", link: ii.descriptionurl}; })
          .filter(function (x) { return x.src; }));
      })
      .catch(function () { cb([]); });
  }
  function images(q, cb) {
    if (imgMem[q]) return cb(imgMem[q]);
    fetch("https://api.openverse.org/v1/images/?q=" + encodeURIComponent(q) + "&page_size=12&mature=false")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        var l = (j.results || []).map(function (r) { return {src: r.thumbnail || r.url, by: (r.creator ? r.creator + " / " : "") + "Openverse", link: r.foreign_landing_url}; });
        if (!l.length) throw 0;
        imgMem[q] = l; cb(l);
      })
      .catch(function () { wikiImages(q, function (l) { imgMem[q] = l; cb(l); }); });
  }
  function fillImage(box) {
    var k = box.getAttribute("data-img"), w = WORDS[k];
    if (!w) return;
    if (S.imgUrl[k]) { box.innerHTML = '<img alt="" src="' + esc(S.imgUrl[k]) + '">'; return; }
    images(w.q || w.p, function (l) {
      if (!l.length) { box.innerHTML = '<div class="none">No picture found</div>'; return; }
      var n = (S.img[k] || 0) % l.length, it = l[n];
      box.innerHTML = '<img alt="" loading="lazy" src="' + esc(it.src) + '"><a class="cap" target="_blank" rel="noopener" href="' + esc(it.link || "#") + '">' + esc(it.by) + "</a>";
      box.querySelector("img").onerror = function () { S.img[k] = n + 1; if (n + 1 < l.length) fillImage(box); else box.innerHTML = '<div class="none">No picture found</div>'; };
    });
  }
  function fillAll() {
    Array.prototype.forEach.call(main.querySelectorAll(".mean[data-k]"), function (el) { liveFill(WORDS[el.getAttribute("data-k")], el); });
    Array.prototype.forEach.call(main.querySelectorAll("[data-img]"), fillImage);
    Array.prototype.forEach.call(main.querySelectorAll("[data-ipa]"), function (el) {
      var k = el.getAttribute("data-ipa"), w = WORDS[k];
      if (w && w.type === "ox") { el.innerHTML = pron(w); return; }
      dict(w ? w.p : k, function (r) {
        if (!r) { el.innerHTML = ""; return; }
        var same = key(r.word) === key(w ? w.p : k);
        el.innerHTML = (r.ipa && same ? '<span class="ipa">' + esc(r.ipa) + "</span> " : "") +
          (r.audio && same ? '<button class="btn sm" data-a="audio" data-u="' + esc(r.audio) + '">&#128264; ' + accentOf(r.audio) + " recording</button>" : "");
      });
    });
  }
  function pron(w) {
    return (w.ipa ? '<span class="ipa">' + esc(w.ipa) + "</span> " : "") +
      (w.au ? '<button class="btn sm" data-a="audio" data-u="' + esc(w.au) + '">&#128264; ' + accentOf(w.au) + " recording</button>" : "");
  }

  // ---------- YouGlish ----------
  var yg = {ready: false, q: []}, ygN = 0;
  window.onYouglishAPIReady = function () { yg.ready = true; var q = yg.q; yg.q = []; q.forEach(function (f) { f(); }); };
  function withYG(f) {
    if (yg.ready) return f();
    yg.q.push(f);
    if (!document.getElementById("ygjs")) {
      var s = document.createElement("script");
      s.id = "ygjs"; s.async = true; s.src = "https://youglish.com/public/emb/widget.js";
      s.onerror = function () { toast("Could not load YouGlish"); };
      document.head.appendChild(s);
    }
  }
  function ygLink(q, accent) { return "https://youglish.com/pronounce/" + encodeURIComponent(q) + "/english/" + (accent || "uk"); }
  function ygMount(box, q, cover) {
    var id = "ygw" + (++ygN), vh = Math.round(Math.max(280, box.clientWidth || 340) * 0.62);
    box.innerHTML = '<div id="' + id + '"></div>' + (cover ? '<div class="cover" data-a="uncover" style="top:0;height:' + vh + 'px;bottom:auto">Audio only - listen with the buttons below</div>' +
      '<div class="cover" data-a="uncover" style="top:' + (vh + 46) + 'px;height:auto">Captions hidden - tap to show</div>' : "");
    withYG(function () {
      try {
        var w = new window.YG.Widget(id, {width: Math.max(280, box.clientWidth || 340), components: 72, events: {}});
        w.fetch(q, "english", S.accent || "uk");
      } catch (e) {
        box.innerHTML = '<a class="btn" target="_blank" rel="noopener" href="' + ygLink(q, S.accent) + '">Open on YouGlish</a>';
      }
    });
  }

  // ---------- compare & analyse speech ----------
  var NUM = {zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
    eleven: "11", twelve: "12", twenty: "20", thirty: "30", forty: "40", fifty: "50", hundred: "100"};
  function toks(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/'/g, "").split(" ")
      .filter(function (w) { return w; }).map(function (w) { return NUM[w] || w; });
  }
  function compare(target, said) {
    var pool = {}, hits = 0, total = 0;
    toks(said).forEach(function (w) { pool[w] = (pool[w] || 0) + 1; });
    var html = String(target).split(" ").map(function (tok) {
      var w = toks(tok)[0];
      if (!w) return esc(tok);
      total++;
      if (pool[w]) { pool[w]--; hits++; return '<span class="hit">' + esc(tok) + "</span>"; }
      return '<span class="miss">' + esc(tok) + "</span>";
    }).join(" ");
    return {html: html, pct: total ? Math.round(hits * 100 / total) : 0};
  }
  function verdict(p) {
    if (p >= 90) return '<span class="score" style="color:var(--good)">' + p + "% - excellent</span>";
    if (p >= 70) return '<span class="score" style="color:var(--good)">' + p + "% - good, check the red words</span>";
    if (p >= 45) return '<span class="score" style="color:var(--warn)">' + p + "% - getting there, listen again</span>";
    return '<span class="score" style="color:var(--bad)">' + p + "% - listen slowly and try again</span>";
  }
  var PAST = {}, PP = {};
  ("be:was,were:been|become:became:become|begin:began:begun|break:broke:broken|bring:brought:brought|build:built:built|buy:bought:bought|" +
   "catch:caught:caught|choose:chose:chosen|come:came:come|cost:cost:cost|cut:cut:cut|do:did:done|draw:drew:drawn|drink:drank:drunk|" +
   "drive:drove:driven|eat:ate:eaten|fall:fell:fallen|feel:felt:felt|fight:fought:fought|find:found:found|fly:flew:flown|forget:forgot:forgotten|" +
   "get:got:got,gotten|give:gave:given|go:went:gone|grow:grew:grown|have:had:had|hear:heard:heard|hold:held:held|keep:kept:kept|know:knew:known|" +
   "leave:left:left|lend:lent:lent|lose:lost:lost|make:made:made|mean:meant:meant|meet:met:met|pay:paid:paid|ride:rode:ridden|ring:rang:rung|" +
   "rise:rose:risen|run:ran:run|say:said:said|see:saw:seen|sell:sold:sold|send:sent:sent|sing:sang:sung|sit:sat:sat|sleep:slept:slept|" +
   "speak:spoke:spoken|spend:spent:spent|stand:stood:stood|steal:stole:stolen|swim:swam:swum|take:took:taken|teach:taught:taught|tell:told:told|" +
   "think:thought:thought|throw:threw:thrown|understand:understood:understood|wake:woke:woken|wear:wore:worn|win:won:won|write:wrote:written|" +
   "lead:led:led|light:lit:lit|lie:lay:lain|shoot:shot:shot|forgive:forgave:forgiven|hide:hid:hidden|bite:bit:bitten|beat:beat:beaten|" +
   "put::put|let::let|set::set|hit::hit|read::read|shut::shut|quit::quit|hurt::hurt|spread::spread").split("|").forEach(function (v) {
    var p = v.split(":");
    (p[1] || "").split(",").forEach(function (x) { if (x) PAST[x] = 1; });
    p[2].split(",").forEach(function (x) { PP[x] = 1; });
  });
  var AUX = {am: 1, is: 1, are: 1, was: 1, were: 1, will: 1, would: 1, can: 1, could: 1, should: 1, must: 1, might: 1, may: 1, have: 1, has: 1, had: 1,
    did: 1, do: 1, does: 1, "don't": 1, "doesn't": 1, "didn't": 1, "can't": 1, "won't": 1};
  var SKIP = {not: 1, just: 1, already: 1, never: 1, ever: 1, really: 1, always: 1, also: 1, recently: 1, finally: 1, actually: 1, probably: 1};
  function tenses(said) {
    var t = String(said).toLowerCase().replace(/[^a-z' ]+/g, " ").split(" ").filter(function (w) { return w; }), f = {};
    function pp(w) { return !!w && (!!PP[w] || (w.length > 4 && w.slice(-2) === "ed")); }
    function ing(w) { return !!w && w.length > 4 && w.slice(-3) === "ing"; }
    function nxt(i) { var j = i + 1; while (j < t.length && SKIP[t[j]]) j++; return t[j]; }
    for (var i = 0; i < t.length; i++) {
      var w = t[i], n = nxt(i), a = w.replace("n't", ""), prev = t[i - 1] || "";
      if ((a === "was" || a === "were") && ing(n)) f.pastCont = 1;
      else if (a === "was" || a === "were" || a === "did" || (PAST[w] && w !== "had")) f.past = 1;
      if (w === "had" && !pp(n) && n !== "been" && n !== "to") f.past = 1;
      if (w.length > 4 && w.slice(-2) === "ed" && !AUX[prev] && !/'(ve|d|s)$/.test(prev) && prev !== "been" && prev !== "get" && prev !== "got") f.past = 1;
      if ((a === "have" || a === "has" || /'ve$/.test(w)) && (pp(n) || n === "been")) f.perfect = 1;
      if ((w === "had" || /'d$/.test(w)) && (pp(n) || n === "been")) f.pastPerf = 1;
      if ((a === "am" || a === "is" || a === "are" || /'(m|re|s)$/.test(w)) && ing(n) && n !== "going") f.presCont = 1;
      if (a === "will" || /'ll$/.test(w) || w === "won't" || w === "gonna" || (w === "going" && t[i + 1] === "to")) f.future = 1;
      if (a === "would" || w === "if") f.cond = 1;
      if (w === "used" && t[i + 1] === "to") f.usedTo = 1;
      if (/^(i|you|we|they|people|he|she|it)$/.test(w) && n && !AUX[n] && !PAST[n] && n.slice(-2) !== "ed" && !/'/.test(n)) f.present = 1;
      if (/^(do|does|don't|doesn't)$/.test(w)) f.present = 1;
    }
    return f;
  }
  var TENSES = [["present", "Present simple"], ["presCont", "Present continuous"], ["past", "Past simple"], ["pastCont", "Past continuous"],
    ["perfect", "Present perfect"], ["pastPerf", "Past perfect"], ["usedTo", "Used to"], ["future", "Future (will / going to)"], ["cond", "Would / if"]];
  function analyse(said, opts) {
    opts = opts || {};
    var f = tenses(said), low = " " + String(said).toLowerCase().replace(/[^a-z' ]+/g, " ") + " ", ts = toks(said);
    var h = '<div class="ana"><div class="small muted">Tenses I heard:</div><div class="chips">' + TENSES.filter(function (x) {
      return !opts.want || opts.want.indexOf(x[0]) >= 0 || f[x[0]];
    }).map(function (x) {
      return '<span class="' + (f[x[0]] ? "yes" : "no") + '">' + (f[x[0]] ? "&#10003; " : "&#10007; ") + x[1] + "</span>";
    }).join("") + "</div>";
    if (opts.words && opts.words.length) {
      var used = opts.words.filter(function (k) { var s = stem(WORDS[k] ? WORDS[k].p : k); return ts.some(function (x) { return x.indexOf(s.replace(/'/g, "")) === 0; }); });
      h += '<div class="small muted">Today\'s words used: <b>' + used.length + "</b> of " + opts.words.length + '</div><div class="chips">' +
        opts.words.map(function (k) { return '<span class="' + (used.indexOf(k) >= 0 ? "yes" : "") + '">' + esc(WORDS[k] ? WORDS[k].p : k) + "</span>"; }).join("") + "</div>";
    }
    if (opts.links && opts.links.length) {
      var lu = opts.links.filter(function (p) { return low.indexOf(" " + key(p).replace("...", "").replace(/[^a-z' ]/g, " ").replace(/ +/g, " ").trim() + " ") >= 0; });
      h += '<div class="small muted">Linking phrases used: <b>' + lu.length + "</b>" + (lu.length ? " - " + esc(lu.join(", ")) : "") + "</div>";
    }
    return h + "</div>";
  }

  // ---------- speech in (recognition) ----------
  var rec = null;
  function srStart(btn, out, opts, done) {
    if (!SR) { out.innerHTML = '<div class="tr muted">Speech recognition needs Chrome (Android or desktop).</div>'; return; }
    if (rec) { rec.stopped = true; try { rec.r.stop(); } catch (e) {} return; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    var st = {text: "", sess: "", stopped: false, t0: Date.now()};
    rec = st;
    var tr = document.createElement("div");
    tr.className = "tr"; tr.textContent = "Listening... speak now";
    out.innerHTML = ""; out.appendChild(tr);
    var label = btn.innerHTML;
    btn.classList.add("rec"); btn.innerHTML = "&#9632; Stop";
    function run() {
      var r = new SR();
      st.r = r; r.lang = "en-GB"; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
      r.onresult = function (e) {
        var fin = "", tmp = "";
        for (var i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) fin += e.results[i][0].transcript + " ";
          else tmp += e.results[i][0].transcript + " ";
        }
        st.sess = fin;
        tr.textContent = (st.text + " " + fin + tmp).trim();
      };
      r.onerror = function (e) {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") { st.stopped = true; toast("Microphone permission is blocked"); }
        else if (e.error !== "no-speech" && e.error !== "aborted") toast("Speech: " + e.error);
      };
      r.onend = function () {
        st.text = (st.text + " " + st.sess).trim(); st.sess = "";
        if (opts.long && !st.stopped && Date.now() - st.t0 < 600000 && rec === st) { try { run(); return; } catch (e) {} }
        finish();
      };
      r.start();
    }
    function finish() {
      if (rec === st) rec = null;
      btn.classList.remove("rec"); btn.innerHTML = label;
      if (!st.text) tr.textContent = "(Nothing heard - try again, a bit closer to the mic.)";
      if (done) done(st.text, (Date.now() - st.t0) / 1000, out);
    }
    run();
  }

  // ---------- audio recording ----------
  var mrec = null;
  function recToggle(btn, out, onBlob) {
    if (mrec) { mrec.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast("Recording is not supported here"); return; }
    navigator.mediaDevices.getUserMedia({audio: true}).then(function (stream) {
      var chunks = [], m = new MediaRecorder(stream), label = btn.innerHTML, t0 = Date.now();
      mrec = m;
      btn.classList.add("rec"); btn.innerHTML = "&#9632; Stop recording";
      m.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      m.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        mrec = null; btn.classList.remove("rec"); btn.innerHTML = label;
        var secs = Math.round((Date.now() - t0) / 1000), blob = new Blob(chunks, {type: m.mimeType || "audio/webm"});
        var d = document.createElement("div");
        d.className = "small muted"; d.textContent = "Your recording (" + secs + "s):";
        var a = document.createElement("audio");
        a.controls = true; a.src = URL.createObjectURL(blob); a.style.width = "100%";
        out.appendChild(d); out.appendChild(a);
        if (onBlob) onBlob(blob, secs);
      };
      m.start();
    }).catch(function () { toast("Microphone permission is blocked"); });
  }
  function stopMedia() {
    if (rec) { rec.stopped = true; try { rec.r.abort(); } catch (e) {} rec = null; }
    if (mrec) { try { mrec.stop(); } catch (e) {} }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  // ---------- recordings store ----------
  var dbp = null;
  function db() {
    if (!dbp) dbp = new Promise(function (res, rej) {
      var r = indexedDB.open("fluent", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("rec", {keyPath: "id", autoIncrement: true}); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function store(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var q = fn(d.transaction("rec", mode).objectStore("rec"));
        q.onsuccess = function () { res(q.result); };
        q.onerror = function () { rej(q.error); };
      });
    });
  }
  function recSave(kind, title, blob, secs) {
    store("readwrite", function (s) { return s.add({kind: kind, title: title, date: today(), week: dayInfo(VIEW).week, secs: secs, blob: blob}); })
      .then(function () { toast("Saved to Progress"); })
      .catch(function () { toast("Could not save the recording"); });
  }

  // ---------- UI pieces ----------
  function bSay(text, rate, label) {
    return '<button class="btn sm" data-a="say" data-r="' + rate + '" data-t="' + esc(text) + '">' + label + "</button>";
  }
  function practice(text) {
    return '<div class="rx"><div class="btns">' + bSay(text, 1, "&#9654; Listen") + bSay(text, 0.7, "Slow") +
      '<button class="btn sm" data-a="sr" data-t="' + esc(text) + '">&#127908; Say it</button>' +
      '<button class="btn sm" data-a="rec">&#9679; Record</button></div><div class="out"></div></div>';
  }
  // A speaking box. opts: save (kind), title, task (for Claude), ana ("story"/"tense"), want (tense ids), words, links
  var BOX = {}, boxN = 0;
  function talkBox(opts) {
    opts = opts || {};
    var id = "bx" + (++boxN);
    BOX[id] = opts;
    return '<div class="rx" data-box="' + id + '"><div class="btns">' +
      '<button class="btn sm p" data-a="srlong">&#127908; Speak (see your words)</button>' +
      '<button class="btn sm" data-a="rec"' + (opts.save ? ' data-save="' + opts.save + '" data-title="' + esc(opts.title || "") + '"' : "") + ">&#9679; Record" + (opts.save ? " & save" : "") + "</button>" +
      '</div><div class="out"></div></div>';
  }
  function badges(w) {
    var h = "";
    if (w.lv) w.lv.split(",").filter(function (x, i, a) { return a.indexOf(x) === i; }).forEach(function (l) { h += '<span class="lv ' + l + '">' + l + "</span>"; });
    if (w.pos) h += w.pos.split(",").map(function (p) { return '<span class="pos">' + esc(p) + "</span>"; }).join("");
    h += '<span class="pos cat">' + esc(w.cat || "") + "</span>";
    return h;
  }
  function meaning(w, showFa) {
    var h = "";
    if (w.defs && w.defs.length) {
      w.defs.forEach(function (d) {
        h += '<div class="def"><span class="dp">' + esc(d[0]) + "</span> " + esc(d[1]) + "</div>" +
          (d[2] ? '<div class="ex">' + esc(d[2]) + " " + bSay(d[2], 0.95, "&#9654;") + "</div>" : "");
      });
    } else if (w.d) {
      h += '<div class="def">' + esc(w.d) + "</div>" + (w.e ? '<div class="ex">' + esc(w.e) + " " + bSay(w.e, 0.95, "&#9654;") + "</div>" : "");
    } else h += '<div class="def muted">No definition found - tap Practise for more.</div>';
    if (w.h) h += '<div class="small muted">Sense: ' + esc(w.h) + "</div>";
    if (w.uk) h += '<div class="small"><span class="tag t2">UK spelling: ' + esc(w.uk) + "</span></div>";
    if (w.fa && showFa) h += '<div class="fa" dir="rtl">' + esc(w.fa) + "</div>";
    else if (showFa) h += '<div class="small"><a target="_blank" rel="noopener" href="https://translate.google.com/?sl=en&tl=fa&op=translate&text=' + encodeURIComponent(cleanQ(w.p)) + '">Persian meaning (Google Translate)</a></div>';
    return h;
  }
  // Fill a missing meaning from the online dictionary (data not bundled for this word).
  function liveFill(w, el) {
    if ((w.defs && w.defs.length) || w.d || !el) return;
    dict(w.p, function (r) {
      if (!r || !r.def) return;
      w.d = r.def; w.e = w.e || r.ex[0] || "";
      if (!w.ipa && key(r.word) === key(w.p)) { w.ipa = r.ipa; w.au = r.audio; }
      if (document.body.contains(el)) el.innerHTML = meaning(w, S.fa);
    });
  }
  function wordCard(w) {
    var k = key(w.p);
    return '<div class="card">' +
      '<div class="img" data-img="' + esc(k) + '"><div class="none">Loading picture...</div></div>' +
      '<div class="badges">' + badges(w) + "</div>" +
      '<div class="word">' + esc(w.p) + "</div>" +
      '<div data-ipa="' + esc(k) + '" class="small"></div>' +
      '<div class="mean" data-k="' + esc(k) + '">' + meaning(w, S.fa) + "</div>" + practice(w.p) +
      '<div class="btns"><button class="btn sm" data-a="yg" data-q="' + esc(cleanQ(w.p)) + '">&#127916; Real video</button>' +
      '<button class="btn sm" data-a="imgnext" data-k="' + esc(k) + '">Another picture</button></div><div class="yg"></div></div>';
  }
  function cleanQ(p) { return String(p).replace(/[(][^)]*[)]/g, "").replace("...", "").replace("?", "").trim(); }
  function doneBtn(id) {
    var d = S.done[VIEW + ":" + id];
    return '<div class="card center">' + (d ? '<div class="muted small">Marked as done.</div>' : "") +
      '<button class="btn g" data-a="done" data-id="' + id + '">&#10003; ' + (d ? "Done - back to today" : "Mark as done") + "</button></div>";
  }
  function ring(p, label, sub) {
    var r = 36, c = 2 * Math.PI * r, v = Math.max(0.001, Math.min(1, p));
    return '<div class="ringw"><svg width="92" height="92" viewBox="0 0 92 92"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs>' +
      '<circle cx="46" cy="46" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="9"/>' +
      '<circle cx="46" cy="46" r="' + r + '" fill="none" stroke="url(#rg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (c * v).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 46 46)"/></svg>' +
      '<div class="ringt"><b>' + label + "</b><span>" + sub + "</span></div></div>";
  }
  function linkPool(week) {
    var out = [];
    for (var wk = 1; wk <= Math.min(week, 4); wk++) (C.extra[wk] || []).slice(130, 160).forEach(function (s) { out.push(s.split("|")[0]); });
    return out;
  }
  function dayChips(n) {
    var l = learnToday();
    if (!l.length) l = QUEUE.filter(function (k) { return WORDS[k].plan === VIEW; });
    return l.slice(0, n || 12);
  }

  // ---------- blocks ----------
  var BL = {
    review: {n: "Review", ic: "&#8635;", d: "From Persian and meaning back to the English word - say it out loud."},
    words: {n: "New words", ic: "&#9733;", d: "Sort the day's words fast, then learn the new ones deeply."},
    sound: {n: "Sound & shadowing", ic: "&#9835;", d: "This week's sound, then copy native sentences."},
    ear: {n: "Accent ear training", ic: "&#127911;", d: "Real British and Scottish voices, fast dictation."},
    story: {n: "Stories & analysis", ic: "&#128214;", d: "Tell a memory, then analyse past, present and future."},
    tense: {n: "Tenses & sentences", ic: "&#9998;", d: "Answer in the right tense with frames and model answers."},
    talk: {n: "Topic talk & role-play", ic: "&#128172;", d: "Two-minute talk on a topic, then a real-life conversation."},
    real: {n: "Real listening & retell", ic: "&#128251;", d: "Real radio or podcast, then retell it out loud."},
    weekly: {n: "Weekly recording", ic: "&#127908;", d: "A two-minute talk about your week, saved to hear your progress."}
  };
  function dayBlocks(dow) {
    return dow === 7 ? [["review", 30], ["words", 45], ["story", 20], ["weekly", 15], ["ear", 15], ["real", 30]]
      : [["review", 20], ["words", 45], ["sound", 10], ["ear", 15], ["story", 20], ["tense", 15], ["talk", 15], ["real", 15]];
  }
  function dayComplete(i) { return dayBlocks(dayInfo(i).dow).every(function (b) { return S.done[i + ":" + b[0]]; }); }

  // ---------- views ----------
  var ACT = {};
  function vToday() {
    var di = dayInfo(VIEW), W = di.W, ct = courseToday();
    setHead("Fluent", "Week " + di.week + " - Day " + di.dow + " - " + W.theme);
    var bl = dayBlocks(di.dow), done = bl.filter(function (b) { return S.done[VIEW + ":" + b[0]]; }).length;
    var mins = Math.floor(todayMs() / 60000), ph = C.phases[Math.floor((di.week - 1) / 4)];
    var nt = newToday().length, due = dueKeys().length, seen = seenCount();
    var next = bl.filter(function (b) { return !S.done[VIEW + ":" + b[0]]; })[0];
    var h = (installEvt ? '<div class="card install"><div><b>Install Fluent as an app</b><div class="small muted">Opens in its own window, works offline, icon on your home screen or desktop.</div></div><button class="btn p" data-a="install">Install</button></div>' : "") +
      '<div class="card hero"><div class="dnav">' +
      '<button class="btn sm ghost" data-a="prev"' + (VIEW <= 0 ? " disabled" : "") + ">&#8592;</button>" +
      '<div class="center"><b>Day ' + (VIEW + 1) + " of " + DAYS + '</b><div class="small muted">' + niceDate(addDays(S.start, VIEW)) + "</div></div>" +
      '<button class="btn sm ghost" data-a="next"' + (VIEW >= DAYS - 1 ? " disabled" : "") + ">&#8594;</button></div>" +
      (VIEW !== ct ? '<div class="small center" style="margin:4px 0">You are looking at another day. <a href="#" data-a="gotoday">Back to today</a></div>' : "") +
      '<div class="herorow">' + ring(mins / S.goal, mins + "", "of " + S.goal + " min") +
      '<div class="tiles"><div class="tile"><b>' + nt + '</b><span>new words<br>of ' + S.target + "</span></div>" +
      '<div class="tile"><b>' + due + '</b><span>reviews due</span></div><div class="tile"><b>' + streak() + '</b><span>day streak</span></div></div></div>' +
      '<div class="bar thin"><i style="width:' + Math.round(seen * 100 / Math.max(1, QUEUE.length)) + '%"></i></div><div class="small muted">' + seen + " of " + QUEUE.length + " course words sorted &middot; " + done + "/" + bl.length + " parts done today</div>" +
      (next ? '<a class="btn p wide" href="#b/' + next[0] + '">Continue: ' + BL[next[0]].n + " &#8594;</a>" : '<div class="center small" style="margin-top:8px">&#127881; All parts done - keep going with more words or a longer talk if you like.</div>') +
      "</div>";
    h += '<div class="card"><div class="small muted">Phase ' + ph.n + ": " + esc(ph.name) + '</div><h2 style="margin:2px 0 6px">' + esc(W.theme) + "</h2>" +
      '<span class="tag">' + esc(W.grammar) + '</span><span class="tag t2">Sound: ' + esc(W.sound) + "</span></div>";
    bl.forEach(function (b) {
      var B = BL[b[0]], d = S.done[VIEW + ":" + b[0]], extra = "";
      if (b[0] === "review") extra = due + " due";
      if (b[0] === "words") extra = nt + "/" + S.target + " today";
      h += '<a class="card block' + (d ? " done" : "") + '" href="#b/' + b[0] + '"><div class="ic">' + B.ic + '</div><div class="bd"><div class="nm">' + B.n +
        (extra ? ' <span class="pill">' + extra + "</span>" : "") + '</div><div class="small muted">~' + b[1] + " min &middot; " + B.d + "</div></div>" +
        (d ? '<div class="ok">&#10003;</div>' : '<div class="chev">&#8250;</div>') + "</a>";
    });
    main.innerHTML = h;
  }
  ACT.prev = function () { if (VIEW > 0) { VIEW--; vToday(); } };
  ACT.next = function () { if (VIEW < DAYS - 1) { VIEW++; vToday(); } };
  ACT.gotoday = function () { VIEW = courseToday(); vToday(); };

  // Review
  function vReview() {
    var queue = dueKeys(), pos = 0, right = 0, total = queue.length;
    function card() {
      if (pos >= queue.length) {
        main.innerHTML = '<div class="card center"><div class="flash">' + (total ? "Review finished" : "Nothing due right now") + "</div>" +
          (total ? '<div class="muted">' + right + " of " + total + " remembered first time.</div>" : '<div class="muted">Words you sort as new come back here the next day.</div>') + "</div>" + doneBtn("review");
        return;
      }
      var k = queue[pos], w = WORDS[k], first = true;
      var ex = (w.defs && w.defs[0] && w.defs[0][2]) || w.e;
      main.innerHTML = '<div class="prog"><span>' + (pos + 1) + " / " + queue.length + '</span><div class="bar thin"><i style="width:' + Math.round(pos * 100 / queue.length) + '%"></i></div></div>' +
        '<div class="card"><div class="small muted">Which word or phrase is this?</div><div class="badges">' + badges(w) + "</div>" +
        (w.fa && S.fa ? '<div class="fa big" dir="rtl">' + esc(w.fa) + "</div>" : "") +
        '<div class="def">' + esc((w.defs && w.defs[0] && w.defs[0][1]) || w.d) + "</div>" +
        (ex ? '<div class="ex">' + esc(blank(ex, w.p)) + "</div>" : "") +
        '<div class="rx"><div class="btns"><button class="btn p" data-a="rsay">&#127908; Say it</button><button class="btn" data-a="rshow">Show answer</button></div><div class="out"></div></div>' +
        '<div id="ans" hidden><div class="line"></div><div class="word">' + esc(w.p) + '</div><div data-ipa="' + esc(k) + '" class="small"></div>' +
        (ex ? '<div class="ex">' + esc(ex) + "</div>" : "") +
        '<div class="small muted">How well did you know it?</div><div class="grade">' +
        '<button class="btn" data-a="rg" data-g="0">Again</button><button class="btn" data-a="rg" data-g="1">Hard</button><button class="btn p" data-a="rg" data-g="2">Good</button><button class="btn g" data-a="rg" data-g="3">Easy</button></div>' +
        '<div class="small center"><a href="#w/' + encodeURIComponent(k) + '">Open word page</a></div></div></div>';
      ACT.rsay = function (el) {
        srStart(el, el.closest(".rx").querySelector(".out"), {}, function (said, s, out) {
          if (!said) return;
          var c = compare(w.p, said);
          out.innerHTML += "<div>" + c.html + " - " + verdict(c.pct) + "</div>";
          if (c.pct >= 70 && first) right++;
          first = false; ACT.rshow();
        });
      };
      ACT.rshow = function () {
        var a = document.getElementById("ans");
        if (a.hidden) { a.hidden = false; first = false; fillAll(); speak(w.p, 0.9); }
      };
      ACT.rg = function (el) {
        var g = +el.getAttribute("data-g");
        grade(k, g);
        if (g === 0) queue.push(k);
        pos++; card(); window.scrollTo(0, 0);
      };
    }
    card();
  }
  function blank(ex, p) {
    var s = stem(p), any = false;
    var out = String(ex).split(" ").map(function (t) { var x = toks(t)[0] || ""; if (s.length >= 3 && x.indexOf(s.replace(/'/g, "")) === 0) { any = true; return "_____"; } return t; }).join(" ");
    return any ? out : ex;
  }

  // New words: sort (triage) then learn
  var undo = [];
  function vWords(mode) {
    if (mode === "learn") return vLearn();
    var k = nextUnseen(), nt = newToday().length, lt = learnToday().length;
    var head = '<div class="seg"><a class="on" href="#b/words">1. Sort (' + nt + "/" + S.target + ')</a><a href="#b/words/learn">2. Learn (' + lt + ")</a></div>";
    if (!k) { main.innerHTML = head + '<div class="card"><b>You have sorted every word in the course so far.</b><div class="small muted">New word packs are added before you need them. Meanwhile add words from real life.</div><a class="btn p" href="#add">+ Add a word</a></div>' + doneBtn("words"); return; }
    var w = WORDS[k];
    var goalMsg = nt >= S.target ? '<div class="card ok2 small">&#127881; Daily goal reached. Carry on if you have energy - the next words are tomorrow\'s, so you get ahead.</div>' : "";
    main.innerHTML = head + '<div class="prog"><span>' + nt + " / " + S.target + '</span><div class="bar thin"><i style="width:' + Math.min(100, Math.round(nt * 100 / S.target)) + '%"></i></div></div>' + goalMsg +
      '<div class="card tcard"><div class="badges">' + badges(w) + '</div><div class="word xl">' + esc(w.p) + "</div>" +
      '<div class="btns">' + bSay(w.p, 0.9, "&#128264; UK voice") + (w.type === "ox" ? pron(w) : '<span data-ipa="' + esc(k) + '" class="small"></span>') + "</div>" +
      '<div id="mean">' + meaning(w, S.fa) + "</div>" +
      '<div class="small muted" style="margin-top:6px">Be honest: <b>know & use</b> means you could use it in conversation today.</div></div>' +
      '<div class="actions"><button class="btn new" data-a="tri" data-t="new">New for me</button><button class="btn rare" data-a="tri" data-t="rare">Know it, don\'t use it</button><button class="btn known" data-a="tri" data-t="known">Know & use</button></div>' +
      '<div class="btns center" style="justify-content:center">' + (undo.length ? '<button class="btn sm ghost" data-a="undo">&#8630; Undo</button>' : "") +
      (lt ? '<a class="btn sm" href="#b/words/learn">Learn the ' + lt + " new ones &#8594;</a>" : "") + "</div>" +
      (nt >= S.target ? doneBtn("words") : "");
    if (w.type !== "ox") fillAll();
    liveFill(w, document.getElementById("mean"));
    if (S.auto) speak(w.p, 0.9);
    ACT.tri = function (el) { undo.push(k); triage(k, el.getAttribute("data-t")); vWords(); window.scrollTo(0, 0); };
  }
  ACT.undo = function () { var k = undo.pop(); if (k) { delete S.srs[k]; save(); vWords(); } };

  function vLearn() {
    var list = learnToday(), i = Math.min(LEARN_I, Math.max(0, list.length - 1));
    var head = '<div class="seg"><a href="#b/words">1. Sort (' + newToday().length + "/" + S.target + ')</a><a class="on" href="#b/words/learn">2. Learn (' + list.length + ")</a></div>";
    if (!list.length) { main.innerHTML = head + '<div class="card muted">Nothing to learn yet - sort some words first. Words you mark as new or not used go here.</div>'; return; }
    var w = WORDS[list[i]];
    main.innerHTML = head + '<div class="prog"><span>' + (i + 1) + " / " + list.length + '</span><div class="bar thin"><i style="width:' + Math.round((i + 1) * 100 / list.length) + '%"></i></div></div>' +
      wordCard(w) +
      '<div class="card"><h2>Use it</h2><div class="small muted">Say two sentences of your own with <b>' + esc(w.p) + '</b>: one about your past, one about your future.</div>' +
      '<div class="rx"><div class="btns"><button class="btn sm p" data-a="srw" data-hw="' + esc(stem(w.p)) + '">&#127908; Speak</button></div><div class="out"></div></div></div>' +
      '<div class="actions two"><button class="btn" data-a="lprev"' + (i === 0 ? " disabled" : "") + '>&#8592; Previous</button><button class="btn p" data-a="lnext">' + (i + 1 < list.length ? "Next word &#8594;" : "Finish") + "</button></div>" +
      '<div class="center small"><a href="#w/' + encodeURIComponent(list[i]) + '">Open full word page (sentences in every tense)</a></div>';
    fillAll();
    if (S.auto) speak(w.p, 0.9);
    ACT.lprev = function () { LEARN_I = Math.max(0, i - 1); vLearn(); window.scrollTo(0, 0); };
    ACT.lnext = function () {
      if (i + 1 < list.length) { LEARN_I = i + 1; vLearn(); window.scrollTo(0, 0); }
      else { LEARN_I = 0; toast("All new words done - they come back in Review tomorrow"); location.hash = "#today"; }
    };
  }
  var LEARN_I = 0;

  // Word page
  function vWord(k) {
    var w = WORDS[k];
    if (!w) { main.innerHTML = '<div class="card">Word not found.</div>'; return; }
    setHead(w.p, w.cat + (w.wk ? " - week " + w.wk : ""), true);
    var frames = [
      ["Present", "Say something true about your life now with \"" + w.p + "\"."],
      ["Past", "Tell me something that happened (yesterday, last year...) using \"" + w.p + "\"."],
      ["Present perfect", "Say something you have or haven't done with \"" + w.p + "\"."],
      ["Future", "Say a plan or a prediction with \"" + w.p + "\"."],
      ["Opinion", "Give your opinion about something, using \"" + w.p + "\"."]
    ];
    var claude = "https://claude.ai/new?q=" + encodeURIComponent("I live in the UK and I'm improving my spoken British English. For \"" + w.p + "\"" + (w.pos ? " (" + w.pos + ")" : "") +
      ": explain the meaning simply, give the most common collocations, then 6 short natural spoken sentences in different tenses (present, past, present perfect, future, a question and a negative). Then give me 3 questions I can answer out loud using it.");
    var h = wordCard(w);
    h += '<div class="card"><h2>Say it in every tense</h2><div class="small muted">Speak each sentence. The app writes down what it heard and checks you used the word.</div>';
    frames.forEach(function (f) {
      h += "<h3>" + f[0] + '</h3><div class="small">' + esc(f[1]) + '</div><div class="rx"><div class="btns"><button class="btn sm" data-a="srw" data-hw="' + esc(stem(w.p)) + '">&#127908; Speak</button></div><div class="out"></div></div>';
    });
    h += "</div>";
    var st = S.srs[k];
    h += '<div class="card"><h2>Status: ' + status(k) + "</h2>" + (st ? '<div class="small muted">Added ' + niceDate(st.added) + " &middot; next review " + niceDate(st.due) + "</div>" : "") +
      '<div class="btns"><button class="btn sm" data-a="mark" data-k="' + esc(k) + '" data-t="new">Mark as new</button><button class="btn sm" data-a="mark" data-k="' + esc(k) + '" data-t="known">Mark as known</button></div></div>';
    h += '<div class="card"><h2>Look further</h2><div class="btns">' +
      '<a class="btn sm" target="_blank" rel="noopener" href="https://www.oxfordlearnersdictionaries.com/search/english/?q=' + encodeURIComponent(cleanQ(w.p)) + '">Oxford Learner\'s</a>' +
      '<a class="btn sm" target="_blank" rel="noopener" href="https://dictionary.cambridge.org/dictionary/english/' + encodeURIComponent(headword(w.p)) + '">Cambridge</a>' +
      '<a class="btn sm" target="_blank" rel="noopener" href="' + ygLink(cleanQ(w.p), "uk") + '">YouGlish (UK)</a>' +
      '<a class="btn sm p" target="_blank" rel="noopener" href="' + claude + '">More in Claude</a></div>' +
      '<details style="margin-top:8px"><summary>Use my own picture</summary><input type="text" id="imgurl" placeholder="Paste an image address (https://...)"><button class="btn sm" data-a="imgset" data-k="' + esc(k) + '">Save picture</button></details>' +
      (w.own ? '<button class="btn sm danger" data-a="wdel" data-k="' + esc(k) + '">Delete this word</button>' : "") + "</div>";
    main.innerHTML = h;
    fillAll();
  }
  ACT.mark = function (el) { triage(el.getAttribute("data-k"), el.getAttribute("data-t")); toast("Saved"); vWord(el.getAttribute("data-k")); };
  ACT.srw = function (el) {
    var hw = el.getAttribute("data-hw").replace(/'/g, "");
    srStart(el, el.closest(".rx").querySelector(".out"), {long: true}, function (said, s, out) {
      if (!said) return;
      var used = toks(said).some(function (t) { return t.indexOf(hw) === 0; });
      out.innerHTML += '<div class="small">' + (used ? '<span class="hit">&#10003; You used the word.</span>' : '<span class="miss">The word was not heard - try again.</span>') +
        " " + bSay(said, 0.95, "&#9654; Hear it back") + ' <a class="btn sm" target="_blank" rel="noopener" href="' + claudeLink("make a sentence with the given word", said) + '">Check in Claude</a></div>';
    });
  };
  ACT.imgnext = function (el) {
    var k = el.getAttribute("data-k");
    delete S.imgUrl[k]; S.img[k] = (S.img[k] || 0) + 1; save();
    fillImage(main.querySelector('[data-img="' + k + '"]'));
  };
  ACT.imgset = function (el) {
    var k = el.getAttribute("data-k"), u = document.getElementById("imgurl").value.trim();
    if (u.indexOf("http") !== 0) return toast("Paste a full https:// address");
    S.imgUrl[k] = u; save(); fillImage(main.querySelector('[data-img="' + k + '"]')); toast("Picture saved");
  };
  ACT.wdel = function (el) {
    var k = el.getAttribute("data-k");
    if (!confirm("Delete this word?")) return;
    S.own = S.own.filter(function (o) { return key(o.p) !== k; });
    delete S.srs[k]; delete WORDS[k]; save();
    location.hash = "#words";
  };

  // Sound & shadowing
  function vSound() {
    var di = dayInfo(VIEW), W = di.W;
    var sents = pick(C.shadow[di.week] || C.shadow[((di.week - 1) % 4) + 1], 4, (di.dow - 1) * 2);
    var h = '<div class="card"><h2>' + esc(W.sound) + "</h2>" +
      (W.tip ? "<div>" + esc(W.tip) + "</div>" : '<div class="muted small">Notes for this sound are coming. Today, copy rhythm and stress exactly.</div>') +
      '<div class="btns"><a class="btn sm" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=' + encodeURIComponent("british pronunciation " + W.sound) + '">Watch a lesson on this sound</a></div></div>' +
      '<div class="card"><h2>Shadowing</h2><div class="small muted">1) Listen. 2) Speak <b>at the same time</b> as the voice, copying rhythm, stress and linking. 3) Say it alone and check. 3-5 times each.</div></div>';
    sents.forEach(function (s) { h += '<div class="card"><div class="say big">' + esc(s) + "</div>" + practice(s) + "</div>"; });
    main.innerHTML = h + doneBtn("sound");
  }

  // Ear training
  function vEar() {
    var di = dayInfo(VIEW), phrases = pick(C.ear, 3, VIEW * 3), pool = [];
    for (var wk = 1; wk <= Math.min(di.week, 4); wk++) {
      (C.shadow[wk] || []).forEach(function (s) { pool.push(s); });
      (C.extra[wk] || []).forEach(function (s) { var e = s.split("|")[2]; if (e && e.split(" ").length >= 7) pool.push(e); });
    }
    var dict3 = pick(pool, 4, VIEW * 7);
    var acc = [["uk", "British"], ["sco", "Scottish"], ["ie", "Irish"], ["us", "American"], ["aus", "Australian"]];
    var h = '<div class="card"><h2>1. Real voices</h2><div class="small muted">Real people saying a common phrase. Video and captions are covered. Listen to several clips (use the player buttons), then type the phrase you keep hearing.</div>' +
      '<select id="acc">' + acc.map(function (a) { return '<option value="' + a[0] + '"' + (S.accent === a[0] ? " selected" : "") + ">" + a[1] + " accents</option>"; }).join("") + "</select></div>";
    phrases.forEach(function (p, i) {
      h += '<div class="card"><b>Phrase ' + (i + 1) + '</b><div class="btns"><button class="btn sm p" data-a="earplay" data-q="' + esc(p) + '">&#9654; Load clips</button></div><div class="yg"></div>' +
        '<input type="text" placeholder="What phrase did you hear?" class="eargs"><div class="btns"><button class="btn sm" data-a="earchk" data-q="' + esc(p) + '">Check</button></div><div class="out"></div></div>';
    });
    h += '<div class="card"><h2>2. Fast dictation</h2><div class="small muted">A British voice at natural speed. Type exactly what you hear, then check.</div></div>';
    dict3.forEach(function (s) {
      h += '<div class="card"><div class="btns">' + bSay(s, 1.1, "&#9654; Normal") + bSay(s, 0.75, "Slow") + '</div><textarea placeholder="Type what you heard..."></textarea>' +
        '<div class="btns"><button class="btn sm" data-a="dchk" data-t="' + esc(s) + '">Check</button></div><div class="out"></div></div>';
    });
    var vids = C.listen.filter(function (l) { return l.url.indexOf("youtube") >= 0; }), v = vids[VIEW % vids.length];
    h += '<div class="card"><h2>3. Accent of the day</h2><div><b>' + esc(v.name) + '</b></div><div class="small muted">' + esc(v.note) +
      '</div><a class="btn sm" target="_blank" rel="noopener" href="' + esc(v.url) + '">Open</a></div>';
    main.innerHTML = h + doneBtn("ear");
    document.getElementById("acc").onchange = function () { S.accent = this.value; save(); toast("Accent set - load the clips again"); };
  }
  ACT.earplay = function (el) { ygMount(el.closest(".card").querySelector(".yg"), el.getAttribute("data-q"), true); };
  ACT.uncover = function (el) { Array.prototype.forEach.call(el.parentNode.querySelectorAll(".cover"), function (c) { c.remove(); }); };
  ACT.earchk = function (el) {
    var card = el.closest(".card"), q = el.getAttribute("data-q"), c = compare(q, card.querySelector(".eargs").value);
    card.querySelector(".out").innerHTML = '<div class="model">The phrase: <b>' + esc(q) + "</b> " + bSay(q, 0.9, "&#9654;") + "</div><div>" + verdict(c.pct) + "</div>";
    Array.prototype.forEach.call(card.querySelectorAll(".cover"), function (x) { x.remove(); });
  };
  ACT.dchk = function (el) {
    var card = el.closest(".card"), t = el.getAttribute("data-t"), c = compare(t, card.querySelector("textarea").value);
    card.querySelector(".out").innerHTML = '<div class="tr">' + c.html + "</div><div>" + verdict(c.pct) + '</div><div class="small muted">Red words are the ones you missed. Listen again on Slow and notice how they sound in fast speech.</div>';
  };

  // Stories & analysis
  function vStory() {
    var di = dayInfo(VIEW), mem = C.memory[VIEW % C.memory.length], an = C.analysis[(VIEW * 3) % C.analysis.length];
    var words = dayChips(12), links = pick(linkPool(di.week), 8, VIEW * 5);
    function frames(list) { return '<details class="frm"><summary>How to build it (' + list.length + ' steps)</summary><div class="steps">' + list.map(function (f, i) { return '<div><b>' + (i + 1) + ". " + esc(f[0]) + '</b><span class="small muted">' + esc(f[1]) + "</span></div>"; }).join("") + "</div></details>"; }
    function chips() {
      return (words.length ? '<div class="small muted">Use at least 5 of today\'s words:</div><div class="chips">' + words.map(function (k) { return "<span>" + esc(WORDS[k].p) + "</span>"; }).join("") + "</div>" : "") +
        (links.length ? '<div class="small muted">Linking phrases to try:</div><div class="chips">' + links.map(function (p) { return '<span class="lk">' + esc(p) + "</span>"; }).join("") + "</div>" : "");
    }
    var h = '<div class="card"><div class="small muted">Talk for 2-3 minutes each. Don\'t stop to correct yourself. After speaking you\'ll see which tenses and words you used, and you can send it to Claude for corrections.</div></div>' +
      '<div class="card"><span class="tag">Memory</span><h2>' + esc(mem) + "</h2>" + frames(C.storyFrames.memory) + chips() +
      talkBox({save: "story", title: "Memory: " + mem, task: mem, want: ["past", "pastCont", "pastPerf", "perfect"], words: words, links: links}) + "</div>" +
      '<div class="card"><span class="tag t2">Past - present - future</span><h2>' + esc(an) + "</h2>" + frames(C.storyFrames.analysis) + chips() +
      talkBox({save: "story", title: "Analysis: " + an, task: an, want: ["past", "usedTo", "perfect", "present", "presCont", "future"], words: words, links: links}) + "</div>";
    main.innerHTML = h + doneBtn("story");
  }

  // Tenses
  function vTense() {
    var di = dayInfo(VIEW), W = di.W;
    var T = C.tense[di.week] || [
      {q: "Talk for a minute about your week so far.", f: "Grammar of the week: " + W.grammar, m: ""},
      {q: "Talk for a minute about " + W.theme.toLowerCase() + " in your life.", f: "Start with: 'Well, for me...' / 'The thing is...'", m: ""}];
    var ps = pick(T, 2, (di.dow - 1) * 2), ws = dayChips(3);
    var h = '<div class="card"><h2>' + esc(W.grammar) + '</h2><div class="small muted">Answer out loud for 30-60 seconds using the frame. Keep going even with mistakes. Then read the model and answer again.</div></div>';
    ps.forEach(function (p) {
      h += '<div class="card"><div class="say">' + esc(p.q) + " " + bSay(p.q, 1, "&#9654;") + '</div><div class="hint small"><b>Frame:</b> ' + esc(p.f) + "</div>" + talkBox({task: p.q, words: ws}) +
        (p.m ? '<details><summary>Model answer</summary><div class="model">' + esc(p.m) + "</div>" + bSay(p.m, 1, "&#9654; Listen") + bSay(p.m, 0.8, "Slow") +
          '<div class="small muted">Now answer again - borrow any phrases you liked.</div>' + talkBox({task: p.q}) + "</details>" : "") + "</div>";
    });
    if (ws.length) {
      var tl = ["the past (yesterday / last year)", "the present perfect (I've ... / I haven't ... yet)", "the future (I'm going to / I'll)"];
      h += '<div class="card"><h2>Today\'s words in different tenses</h2>';
      ws.forEach(function (k, i) {
        var w = WORDS[k];
        h += "<h3>" + esc(w.p) + '</h3><div class="small">Make a sentence in ' + tl[(i + di.dow) % 3] + '.</div><div class="rx"><div class="btns"><button class="btn sm" data-a="srw" data-hw="' + esc(stem(w.p)) + '">&#127908; Speak</button></div><div class="out"></div></div>';
      });
      h += "</div>";
    }
    main.innerHTML = h + doneBtn("tense");
  }

  // Talk & role-play
  function vTalk() {
    var di = dayInfo(VIEW), W = di.W;
    var tp = (C.topics[di.week] || [])[di.dow - 1] || {t: W.theme, qs: ["What's your own experience of this?", "What's different about it in the UK?", "Tell a short story connected to it."]};
    var ws = dayChips(10);
    var h = '<div class="card"><h2>Topic: ' + esc(tp.t) + '</h2><div class="small muted">Talk for 2 minutes. Answer the questions in order, give examples and reasons, and use today\'s words.</div>' +
      tp.qs.map(function (q) { return '<div class="say">' + esc(q) + "</div>"; }).join("") +
      (ws.length ? '<div class="chips">' + ws.map(function (k) { return "<span>" + esc(WORDS[k].p) + "</span>"; }).join("") + "</div>" : "") +
      talkBox({save: "talk", title: "Topic: " + tp.t, task: "talk about '" + tp.t + "': " + tp.qs.join(" "), words: ws}) +
      '<div class="small muted">Tip: record once, listen back, then speak again - the second try is where you improve.</div></div>';
    var sc = (C.scen[di.week] || [])[(di.dow - 1) % 2];
    h += sc ? '<div class="card"><h2>Role-play: ' + esc(sc.t) + '</h2><div class="small muted">' + esc(sc.s) + ' Listen first (text hidden), reply out loud, then compare with a model answer.</div><div id="rp"></div></div>'
      : '<div class="card muted small">Role-plays for this week are being prepared.</div>';
    main.innerHTML = h + doneBtn("talk");
    if (sc) rolePlay(sc);
  }
  function rolePlay(sc) {
    var i = 0, box = document.getElementById("rp");
    function show() {
      if (i >= sc.lines.length) {
        box.innerHTML = '<div class="model">Conversation finished. Do it once more without reading the hints.</div><button class="btn sm" data-a="rpagain">Start again</button>';
        ACT.rpagain = function () { i = 0; show(); };
        return;
      }
      var L = sc.lines[i];
      box.innerHTML = '<div class="small muted">Line ' + (i + 1) + " of " + sc.lines.length + "</div>" +
        '<div class="say"><b>They say:</b> <span id="rpt" style="filter:blur(5px)">' + esc(L[0]) + "</span></div>" +
        '<div class="btns">' + bSay(L[0], 1, "&#9654; Hear them") + '<button class="btn sm" data-a="rptext">Show text</button></div>' +
        '<div class="hint small"><b>You:</b> ' + esc(L[1]) + "</div>" +
        '<div class="rx"><div class="btns"><button class="btn sm p" data-a="srlong">&#127908; Reply</button></div><div class="out"></div></div>' +
        '<details><summary>Model answer</summary><div class="model">' + esc(L[2]) + "</div>" + bSay(L[2], 1, "&#9654; Listen") + "</details>" +
        '<div class="btns"><button class="btn sm g" data-a="rpnext">Next line &#8594;</button></div>';
      speak(L[0], 1);
    }
    ACT.rptext = function () { var t = document.getElementById("rpt"); if (t) t.style.filter = "none"; };
    ACT.rpnext = function () { i++; show(); };
    show();
  }

  // Real listening
  function vReal() {
    var di = dayInfo(VIEW), r = C.listen[VIEW % C.listen.length], mins = di.dow === 7 ? 30 : 15;
    var h = '<div class="card"><h2>' + esc(r.name) + '</h2><div class="small muted">' + esc(r.note) + "</div>" +
      '<a class="btn p" target="_blank" rel="noopener" href="' + esc(r.url) + '">&#9654; Open and listen for ' + mins + "+ min</a>" +
      '<div class="small muted" style="margin-top:6px">Time outside the app is not counted automatically. Log it when you come back:</div>' +
      '<div class="btns"><button class="btn sm" data-a="logmin" data-m="10">+10 min</button><button class="btn sm" data-a="logmin" data-m="20">+20 min</button><button class="btn sm" data-a="logmin" data-m="30">+30 min</button><button class="btn sm" data-a="logmin" data-m="60">+60 min</button></div></div>' +
      '<div class="card"><h2>Retell it</h2><div class="small muted">In 1-2 minutes: who was talking, what it was about, one detail, and your opinion. Use the past tense.</div>' +
      talkBox({save: "retell", title: "Retell: " + r.name, task: "retell what I heard on " + r.name, want: ["past", "pastCont", "present"]}) + "</div>" +
      '<div class="card"><h2>New words you heard</h2><div class="small muted">Write any word or phrase you didn\'t know. It goes into your reviews.</div>' +
      '<input type="text" id="nw" placeholder="e.g. a wee bit"><button class="btn sm p" data-a="quickadd">+ Add</button></div>' +
      '<div class="card"><details><summary>All listening sources</summary>' + C.listen.map(function (l) {
        return '<div style="margin:6px 0"><a target="_blank" rel="noopener" href="' + esc(l.url) + '">' + esc(l.name) + '</a><div class="small muted">' + esc(l.note) + "</div></div>";
      }).join("") + "</details></div>";
    main.innerHTML = h + doneBtn("real");
  }
  ACT.logmin = function (el) { var m = +el.getAttribute("data-m"); addTime(m * 60000); toast("+" + m + " min logged"); };
  ACT.quickadd = function () {
    var v = document.getElementById("nw").value.trim();
    if (v) addOwn(v, "", "", function () { document.getElementById("nw").value = ""; toast("Added: " + v); });
  };

  // Weekly
  function vWeekly() {
    var di = dayInfo(VIEW);
    main.innerHTML = '<div class="card"><h2>Week ' + di.week + ' recording</h2><div class="small muted">Talk for 2 minutes without stopping: what you did this week, something that went wrong or surprised you, and what you\'re going to do next week. Use this week\'s grammar (' + esc(di.W.grammar) + ").</div>" +
      talkBox({save: "weekly", title: "Week " + di.week + " talk", task: "a 2-minute talk about my week", want: ["past", "perfect", "present", "future"]}) + "</div>" +
      '<div class="card"><h2>Hear your progress</h2><div id="wlist" class="small muted">Loading...</div></div>' + doneBtn("weekly");
    recList(document.getElementById("wlist"), function (r) { return r.kind === "weekly"; });
  }

  ACT.srlong = function (el) {
    var bx = el.closest("[data-box]"), o = (bx && BOX[bx.getAttribute("data-box")]) || {};
    srStart(el, el.closest(".rx").querySelector(".out"), {long: true}, function (said, secs, out) {
      if (!said) return;
      var n = toks(said).length, wpm = secs > 5 ? Math.round(n * 60 / secs) : 0;
      out.innerHTML += '<div class="small muted">' + n + " words" + (wpm ? " &middot; about " + wpm + " words per minute (relaxed native speech: 120-160)" : "") + "</div>" +
        (o.task ? analyse(said, o) : "") +
        '<div class="btns">' + bSay(said, 0.95, "&#9654; Hear it back") +
        '<a class="btn sm p" target="_blank" rel="noopener" href="' + claudeLink(o.task || "speak freely", said) + '">&#10024; Corrections in Claude</a></div>';
    });
  };

  function recList(el, filter) {
    store("readonly", function (s) { return s.getAll(); }).then(function (all) {
      all = all.filter(filter || function () { return true; }).sort(function (a, b) { return b.id - a.id; });
      if (!all.length) { el.innerHTML = "No recordings yet."; return; }
      el.className = ""; el.innerHTML = "";
      all.forEach(function (r) {
        var d = document.createElement("div");
        d.className = "recrow";
        d.innerHTML = "<b>" + esc(r.title) + '</b> <span class="small muted">' + niceDate(r.date) + " &middot; " + (r.secs || 0) + 's</span> <button class="btn sm ghost" data-a="rdel" data-id="' + r.id + '">Delete</button>';
        var a = document.createElement("audio");
        a.controls = true; a.style.width = "100%"; a.src = URL.createObjectURL(r.blob);
        d.appendChild(a); el.appendChild(d);
      });
    }).catch(function () { el.textContent = "Recordings are not available in this browser."; });
  }
  ACT.rdel = function (el) {
    if (!confirm("Delete this recording?")) return;
    store("readwrite", function (s) { return s["delete"](+el.getAttribute("data-id")); }).then(function () { el.parentNode.remove(); });
  };

  // Words tab
  var WF = {q: "", f: "learning", n: 100};
  function vWordList() {
    var cnt = {learning: 0, there: 0, known: 0, unseen: 0};
    Object.keys(WORDS).forEach(function (k) { var s = status(k); cnt[s === "learning" ? "learning" : s === "getting there" ? "there" : s === "known" ? "known" : "unseen"]++; });
    setHead("Words", Object.keys(WORDS).length + " words and phrases");
    var tabs = [["learning", "Learning", cnt.learning], ["there", "Getting there", cnt.there], ["known", "Known", cnt.known], ["unseen", "Not seen", cnt.unseen], ["mine", "Mine", S.own.length]];
    main.innerHTML = '<div class="card"><input type="text" id="q" placeholder="Search all words..." value="' + esc(WF.q) + '"><div class="seg wrap">' +
      tabs.map(function (t) { return '<a href="#" data-a="wf" data-f="' + t[0] + '" class="' + (WF.f === t[0] ? "on" : "") + '">' + t[1] + " <small>" + t[2] + "</small></a>"; }).join("") +
      '</div><a class="btn sm p" href="#add">+ Add a word</a></div><div id="wl"></div>';
    function draw() {
      WF.q = key(document.getElementById("q").value);
      var list = (WF.f === "mine" ? S.own.map(function (o) { return key(o.p); }) : QUEUE.concat(S.own.map(function (o) { return key(o.p); })));
      list = list.filter(function (k, i, a) {
        if (a.indexOf(k) !== i && WF.f !== "mine") return false;
        var w = WORDS[k]; if (!w) return false;
        if (WF.q) return key(w.p).indexOf(WF.q) >= 0 || key(w.d || "").indexOf(WF.q) >= 0 || (w.fa || "").indexOf(WF.q) >= 0;
        if (WF.f === "mine") return true;
        var s = status(k);
        return (WF.f === "learning" && s === "learning") || (WF.f === "there" && s === "getting there") || (WF.f === "known" && s === "known") || (WF.f === "unseen" && s === "not seen");
      });
      var show = list.slice(0, WF.n);
      document.getElementById("wl").innerHTML = '<div class="card list">' + (show.length ? show.map(function (k) {
        var w = WORDS[k];
        return '<a class="w" href="#w/' + encodeURIComponent(k) + '"><span><b>' + esc(w.p) + '</b><br><span class="small muted">' + esc((w.d || "").slice(0, 70)) + '</span></span><span class="small">' + (w.lv ? '<span class="lv ' + w.lv.split(",")[0] + '">' + w.lv.split(",")[0] + "</span>" : "") + "</span></a>";
      }).join("") : '<div class="muted">Nothing here yet.</div>') + "</div>" +
        (list.length > WF.n ? '<div class="center"><button class="btn sm" data-a="wmore">Show more (' + (list.length - WF.n) + ")</button></div>" : "");
    }
    document.getElementById("q").oninput = function () { WF.n = 100; draw(); };
    ACT.wf = function (el) { WF.f = el.getAttribute("data-f"); WF.n = 100; document.getElementById("q").value = ""; vWordList(); };
    ACT.wmore = function () { WF.n += 200; draw(); };
    draw();
  }
  function addOwn(p, d, e, cb) {
    var k = key(p);
    if (WORDS[k]) { addCard(k); return cb && cb(k); }
    var o = {p: p, d: d, e: e, q: p, own: true, type: "own", cat: "My word", added: today()};
    S.own.push(o); WORDS[k] = o; addCard(k); save();
    if (!d) dict(p, function (r) { if (r && r.def && !o.d) { o.d = r.def; if (!o.e && r.ex[0]) o.e = r.ex[0]; save(); } });
    if (cb) cb(k);
  }
  function vAdd() {
    setHead("Add a word", "", true);
    main.innerHTML = '<div class="card"><h2>New word or phrase</h2><div class="small muted">Something you heard at work, on the radio, in a shop... Only the word is required - the meaning is filled in from the dictionary if you leave it empty.</div>' +
      '<input type="text" id="ap" placeholder="Word or phrase"><button class="btn sm" data-a="alook">Look up</button>' +
      '<input type="text" id="ad" placeholder="Meaning (optional)"><textarea id="ae" placeholder="Example sentence (optional)"></textarea>' +
      '<button class="btn p" data-a="asave">Save</button></div>';
  }
  ACT.alook = function () {
    var p = document.getElementById("ap").value.trim();
    if (!p) return;
    dict(p, function (r) {
      if (!r) return toast("Not in the free dictionary - type the meaning yourself");
      if (!document.getElementById("ad").value) document.getElementById("ad").value = r.def || "";
      if (!document.getElementById("ae").value) document.getElementById("ae").value = r.ex[0] || "";
    });
  };
  ACT.asave = function () {
    var p = document.getElementById("ap").value.trim();
    if (!p) return toast("Type a word first");
    addOwn(p, document.getElementById("ad").value.trim(), document.getElementById("ae").value.trim(), function (k) { location.hash = "#w/" + encodeURIComponent(k); });
  };

  // Plan
  function vPlan() {
    setHead("Plan", "16 weeks - 100+ new words a day");
    var ct = courseToday(), cw = dayInfo(ct).week;
    var nOx = QUEUE.filter(function (k) { return WORDS[k].type === "ox"; }).length, nEx = QUEUE.length - nOx;
    var oxDone = QUEUE.filter(function (k) { return WORDS[k].type === "ox" && S.srs[k]; }).length;
    var h = '<div class="card hero"><h2>How it works</h2><div class="small">Every day: <b>' + S.target + '+ new words</b> (Oxford 5000 B2-C1 words mixed with phrasal verbs, collocations, idioms, spoken British phrases and linking phrases), reviews on a spaced schedule, and speaking every day - memories, past/present/future analysis, topics and role-plays. There is no upper time limit: the parts are suggestions, so go further whenever you can.</div>' +
      '<div class="small" style="margin-top:8px"><b>Oxford 5000 (B2-C1):</b> ' + oxDone + " / " + nOx + '</div><div class="bar thin"><i style="width:' + Math.round(oxDone * 100 / Math.max(1, nOx)) + '%"></i></div>' +
      '<div class="small muted">Course total: ' + QUEUE.length + " (" + nOx + " Oxford words + " + nEx + " phrases). The Oxford list is finished in about 4 weeks; after that, word packs on new themes are added before you need them.</div></div>";
    C.phases.forEach(function (ph) {
      h += '<div class="card"><h2>Phase ' + ph.n + ": " + esc(ph.name) + ' <span class="small muted">weeks ' + ph.weeks + '</span></h2><div class="small muted">' + esc(ph.goal) + "</div>";
      C.weeks.filter(function (w) { return Math.floor((w.n - 1) / 4) + 1 === ph.n; }).forEach(function (w) {
        h += "<details" + (w.n === cw ? " open" : "") + ' style="margin-top:8px"><summary>Week ' + w.n + ": " + esc(w.theme) + (w.n === cw ? ' <span class="pill">now</span>' : "") + "</summary>" +
          '<div class="small"><span class="tag">' + esc(w.grammar) + '</span><span class="tag t2">' + esc(w.sound) + "</span>" + (C.extra[w.n] ? "" : '<span class="small muted">themed words coming</span>') + '</div><div class="days">';
        for (var d = 0; d < 7; d++) {
          var i = (w.n - 1) * 7 + d;
          h += '<a href="#day/' + i + '" class="' + (i === ct ? "cur " : "") + (dayComplete(i) ? "dn" : "") + '">' + (d === 6 ? "R" : d + 1) + "</a>";
        }
        h += "</div></details>";
      });
      h += "</div>";
    });
    var vs = enVoices();
    h += '<div class="card"><h2>Settings</h2>' +
      '<label class="row"><span>New words per day</span><input type="number" id="tg" min="20" max="300" step="10" value="' + S.target + '"></label>' +
      '<label class="row"><span>Daily time goal (min)</span><input type="number" id="gl" min="30" max="480" step="10" value="' + S.goal + '"></label>' +
      '<label class="row"><span>Show Persian meanings</span><input type="checkbox" id="fa"' + (S.fa ? " checked" : "") + "></label>" +
      '<label class="row"><span>Say each new word automatically</span><input type="checkbox" id="au"' + (S.auto ? " checked" : "") + "></label>" +
      '<div class="small muted" style="margin-top:8px">Start date (Day 1)</div><input type="date" id="sd" value="' + S.start + '">' +
      '<div class="small muted" style="margin-top:8px">British voice</div><select id="vc"><option value="">Automatic (en-GB)</option>' +
      vs.map(function (v) { return "<option" + (S.voice === v.name ? " selected" : "") + ' value="' + esc(v.name) + '">' + esc(v.name + " (" + v.lang + ")") + "</option>"; }).join("") +
      "</select>" + bSay("Hello! Shall we put the kettle on and have a proper chat?", 1, "&#9654; Test voice") +
      '<div class="btns"><button class="btn sm p" data-a="setsave">Save settings</button></div>' +
      '<div class="line"></div><div class="small muted">Back up your progress (not recordings)</div>' +
      '<button class="btn sm" data-a="export">Export backup</button><label class="btn sm">Import backup<input type="file" id="imp" accept="application/json" hidden></label></div>';
    main.innerHTML = h;
    document.getElementById("imp").onchange = function () {
      var f = this.files[0];
      if (!f) return;
      f.text().then(function (t) {
        var o = JSON.parse(t);
        if (!o || !o.start) throw 0;
        if (!confirm("Replace your progress on this device with the backup?")) return;
        localStorage.setItem(KEY, JSON.stringify(o)); location.reload();
      }).catch(function () { toast("That file is not a Fluent backup"); });
    };
  }
  ACT.setsave = function () {
    var tg = +document.getElementById("tg").value, gl = +document.getElementById("gl").value, sd = document.getElementById("sd").value;
    var reload = tg !== S.target;
    if (tg >= 20) S.target = tg;
    if (gl >= 10) S.goal = gl;
    if (sd) S.start = sd;
    S.fa = document.getElementById("fa").checked; S.auto = document.getElementById("au").checked;
    S.voice = document.getElementById("vc").value;
    save(); VIEW = courseToday();
    if (reload) { location.reload(); return; }
    toast("Settings saved"); vPlan();
  };
  ACT["export"] = function () {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], {type: "application/json"}));
    a.download = "fluent-backup-" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
  };

  // Progress
  function minsOn(day) { return Math.floor(((S.log[day] || {}).ms || 0) / 60000); }
  function streak() {
    var d = today(), n = 0;
    if (minsOn(d) < 20) d = addDays(d, -1);
    while (minsOn(d) >= 20) { n++; d = addDays(d, -1); }
    return n;
  }
  function vProgress() {
    setHead("Progress", "");
    var t = today(), week = 0, total = 0;
    Object.keys(S.log).forEach(function (k) { var m = minsOn(k); total += m; if (diffDays(k, t) < 7) week += m; });
    var c = {learning: 0, there: 0, known: 0};
    Object.keys(S.srs).forEach(function (k) { var s = status(k); if (s === "known") c.known++; else if (s === "getting there") c.there++; else c.learning++; });
    var daysDone = 0;
    for (var i = 0; i <= courseToday(); i++) if (dayComplete(i)) daysDone++;
    var bars = "", labels = "", wbars = "", mx = S.goal, wmx = S.target;
    var nw = {};
    Object.keys(S.srs).forEach(function (k) { var a = S.srs[k].added; nw[a] = (nw[a] || 0) + 1; });
    for (var j = 13; j >= 0; j--) { mx = Math.max(mx, minsOn(addDays(t, -j))); wmx = Math.max(wmx, nw[addDays(t, -j)] || 0); }
    for (j = 13; j >= 0; j--) {
      var day = addDays(t, -j), m = minsOn(day), n = nw[day] || 0;
      bars += '<div title="' + m + ' min" style="height:' + Math.round(m * 100 / mx) + '%"></div>';
      wbars += '<div title="' + n + ' words" style="height:' + Math.round(n * 100 / wmx) + '%"></div>';
      labels += "<span>" + parseISO(day).getDate() + "</span>";
    }
    var tot = Object.keys(S.srs).length;
    main.innerHTML = '<div class="card hero"><div class="herorow">' + ring(c.known / Math.max(1, QUEUE.length), c.known + "", "words known") +
      '<div class="tiles"><div class="tile"><b>' + streak() + '</b><span>day streak</span></div><div class="tile"><b>' + (total / 60).toFixed(1) + '</b><span>hours total</span></div><div class="tile"><b>' + tot + '</b><span>words sorted</span></div></div></div></div>' +
      '<div class="card"><h2>Words</h2><div class="stack"><i class="s1" style="flex:' + c.learning + '"></i><i class="s2" style="flex:' + c.there + '"></i><i class="s3" style="flex:' + c.known + '"></i></div>' +
      '<div class="small"><span class="dot s1"></span> learning ' + c.learning + ' &nbsp; <span class="dot s2"></span> getting there ' + c.there + ' &nbsp; <span class="dot s3"></span> known ' + c.known + " &middot; " + dueKeys().length + " due</div>" +
      '<h3>New words per day</h3><div class="bars">' + wbars + '</div><div class="blabels">' + labels + "</div></div>" +
      '<div class="card"><h2>Time</h2><div>Today <b>' + Math.floor(todayMs() / 60000) + " min</b> &middot; last 7 days <b>" + week + " min</b></div>" +
      '<div class="bars">' + bars + '</div><div class="blabels">' + labels + '</div><div class="small muted">Goal: ' + S.goal + " min a day.</div></div>" +
      '<div class="card"><h2>Course</h2><div>Day <b>' + (courseToday() + 1) + "</b> of " + DAYS + " &middot; <b>" + daysDone + '</b> days fully completed</div><div class="bar thin"><i style="width:' + Math.round((courseToday() + 1) * 100 / DAYS) + '%"></i></div></div>' +
      '<div class="card"><h2>Your recordings</h2><div class="small muted">Listen to an early recording and a recent one - the difference is your progress.</div><div id="rl" class="small muted">Loading...</div></div>';
    recList(document.getElementById("rl"));
  }

  // ---------- generic actions ----------
  ACT.say = function (el) { speak(el.getAttribute("data-t"), +el.getAttribute("data-r") || 1); };
  ACT.audio = function (el) { playUrl(el.getAttribute("data-u")); };
  ACT.yg = function (el) { ygMount(el.closest(".card").querySelector(".yg"), el.getAttribute("data-q"), false); };
  ACT.sr = function (el) {
    var t = el.getAttribute("data-t");
    srStart(el, el.closest(".rx").querySelector(".out"), {}, function (said, s, out) {
      if (!said) return;
      var c = compare(t, said);
      out.innerHTML += "<div>" + c.html + "</div><div>" + verdict(c.pct) + "</div>";
    });
  };
  ACT.rec = function (el) {
    var kind = el.getAttribute("data-save"), title = el.getAttribute("data-title");
    recToggle(el, el.closest(".rx").querySelector(".out"), kind ? function (blob, secs) { recSave(kind, title, blob, secs); } : null);
  };
  ACT.done = function (el) { S.done[VIEW + ":" + el.getAttribute("data-id")] = 1; save(); location.hash = "#today"; };
  main.addEventListener("click", function (e) {
    var el = e.target.closest("[data-a]");
    if (!el) return;
    var f = ACT[el.getAttribute("data-a")];
    if (f) { if (el.tagName === "A") e.preventDefault(); f(el, e); }
  });

  // ---------- install as an app ----------
  var installEvt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); installEvt = e;
    if ((location.hash || "#today").indexOf("#today") === 0) vToday();
  });
  window.addEventListener("appinstalled", function () { installEvt = null; toast("Fluent is installed"); if ((location.hash || "#today").indexOf("#today") === 0) vToday(); });
  ACT.install = function () {
    if (!installEvt) return;
    installEvt.prompt();
    installEvt.userChoice.then(function () { installEvt = null; vToday(); });
  };

  // ---------- router ----------
  function route() {
    stopBlock(); stopMedia(); BOX = {};
    var h = decodeURIComponent(location.hash.slice(1)) || "today", parts = h.split("/"), r = parts[0];
    var tab = {today: "today", b: "today", day: "today", words: "words", w: "words", add: "words", plan: "plan", progress: "progress"}[r] || "today";
    Array.prototype.forEach.call(document.querySelectorAll("nav a"), function (a) { a.classList.toggle("on", a.getAttribute("data-t") === tab); });
    window.scrollTo(0, 0);
    if (r === "day") { VIEW = Math.max(0, Math.min(DAYS - 1, +parts[1] || 0)); location.replace("#today"); return; }
    if (r === "b") {
      var id = parts[1], B = BL[id];
      if (!B) { location.replace("#today"); return; }
      var di = dayInfo(VIEW);
      setHead(B.n, "Week " + di.week + " - Day " + di.dow, true);
      startBlock(id);
      ({review: vReview, words: vWords, sound: vSound, ear: vEar, story: vStory, tense: vTense, talk: vTalk, real: vReal, weekly: vWeekly})[id](parts[2]);
      return;
    }
    if (r === "w") return vWord(parts.slice(1).join("/"));
    if (r === "add") return vAdd();
    if (r === "words") return vWordList();
    if (r === "plan") return vPlan();
    if (r === "progress") return vProgress();
    vToday();
  }
  window.addEventListener("hashchange", route);
  route();
  window.__fluent = {tenses: tenses, words: WORDS, queue: QUEUE, S: S};

  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
})();
