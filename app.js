// Fluent - speaking & listening coach. ASCII only.
(function () {
  "use strict";
  var C = window.COURSE;
  var KEY = "fluent.v1";
  var DAYS = 112;
  var GOAL_MIN = 90;
  var INT = [0, 1, 2, 4, 7, 15, 30, 60];
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
    s.start = s.start || today();
    s.srs = s.srs || {};
    s.own = s.own || [];
    s.log = s.log || {};
    s.done = s.done || {};
    s.img = s.img || {};
    s.imgUrl = s.imgUrl || {};
    s.voice = s.voice || "";
    s.accent = s.accent || "uk";
    return s;
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  save();

  function courseToday() { return Math.max(0, Math.min(DAYS - 1, diffDays(S.start, today()))); }
  var VIEW = courseToday();
  function dayInfo(i) {
    var week = Math.floor(i / 7) + 1;
    return {i: i, week: week, dow: (i % 7) + 1, W: C.weeks[week - 1]};
  }

  // ---------- words ----------
  function key(p) { return String(p).toLowerCase().trim(); }
  var WORDS = {};
  Object.keys(C.words).forEach(function (wk) {
    C.words[wk].forEach(function (s, i) {
      var p = s.split("|");
      var w = {p: p[0], d: p[1] || "", e: p[2] || "", q: p[3] || p[0], wk: +wk, day: Math.floor(i / 6) + 1};
      w.idx = (w.wk - 1) * 7 + w.day - 1;
      WORDS[key(w.p)] = w;
    });
  });
  function syncOwn() { S.own.forEach(function (o) { o.own = true; WORDS[key(o.p)] = o; }); }
  syncOwn();
  function dayWords(i) {
    var di = dayInfo(i), arr = C.words[di.week];
    if (!arr || di.dow > 6) return [];
    return arr.slice((di.dow - 1) * 6, di.dow * 6).map(function (s) { return WORDS[key(s.split("|")[0])]; });
  }
  function weekWords(wk) {
    return (C.words[wk] || []).map(function (s) { return WORDS[key(s.split("|")[0])]; });
  }

  var STOP = "a an the be to of on in up out for with is it i i'm i'll i've do does you your this that have has get got some someone something my at by and or can't don't what how's it's been (someone) (finance) ...".split(" ");
  function headword(p) {
    var ws = String(p).toLowerCase().replace(/[^a-z' -]/g, " ").split(" ").filter(function (w) { return w && STOP.indexOf(w) < 0; });
    ws.sort(function (a, b) { return b.length - a.length; });
    return ws[0] || String(p).toLowerCase();
  }

  // ---------- SRS ----------
  function addCard(k) {
    if (!S.srs[k]) { S.srs[k] = {b: 0, due: addDays(today(), 1), n: 0, added: today()}; save(); }
  }
  function grade(k, g) {
    var c = S.srs[k] || (S.srs[k] = {b: 0, n: 0, added: today()});
    c.n++;
    if (g === 0) { c.b = 0; c.due = today(); }
    else { c.b = Math.min(INT.length - 1, c.b + g); c.due = addDays(today(), INT[c.b]); }
    save();
  }
  function dueKeys() {
    var t = today();
    return Object.keys(S.srs).filter(function (k) { return WORDS[k] && S.srs[k].due <= t; })
      .sort(function (a, b) { return S.srs[a].due < S.srs[b].due ? -1 : 1; });
  }
  function status(k) {
    var c = S.srs[k];
    if (!c) return "new";
    return c.b >= 4 ? "known" : "learning";
  }

  // ---------- time log ----------
  var active = null;
  function addTime(ms) {
    if (ms <= 0) return;
    var d = today(), L = S.log[d] = S.log[d] || {ms: 0};
    L.ms += Math.min(ms, 3600000);
    save();
  }
  function startBlock(id) { stopBlock(); active = {id: id, t0: Date.now(), paused: document.hidden}; }
  function stopBlock() {
    if (active && !active.paused) addTime(Date.now() - active.t0);
    active = null;
  }
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
    document.getElementById("clock").textContent = Math.floor(todayMs() / 60000) + "/" + GOAL_MIN + " min";
  }, 1000);

  // ---------- small helpers ----------
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

  // ---------- speech out ----------
  var voices = [];
  function loadVoices() { if (window.speechSynthesis) voices = speechSynthesis.getVoices() || []; }
  loadVoices();
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = loadVoices;
  function enVoices() { return voices.filter(function (v) { return /^en/i.test(v.lang || ""); }); }
  function gbVoice() {
    var gb = function (v) { return (v.lang || "").replace("_", "-").toLowerCase() === "en-gb"; };
    if (S.voice) { var f = voices.filter(function (v) { return v.name === S.voice; })[0]; if (f) return f; }
    return voices.filter(function (v) { return gb(v) && /google/i.test(v.name); })[0] ||
      voices.filter(gb)[0] || enVoices()[0] || null;
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

  // ---------- dictionary (dictionaryapi.dev) ----------
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
    return {word: word, ipa: txt, audio: (uk || any || {}).audio || "", uk: !!uk, ex: ex, def: def};
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
        .then(function (j) {
          if (j && j.length) { var res = parseDict(j, cands[i]); dictMem[k] = res; cb(res); }
          else next(i + 1);
        })
        .catch(function () { next(i + 1); });
    })(0);
  }

  // ---------- pictures (Openverse, then Wikimedia Commons) ----------
  var imgMem = {};
  function wikiImages(q, cb) {
    fetch("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" +
      encodeURIComponent("filetype:bitmap " + q) +
      "&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var pages = (j.query && j.query.pages) || {};
        var l = Object.keys(pages).map(function (k) { return pages[k]; })
          .sort(function (a, b) { return a.index - b.index; })
          .map(function (p) { var ii = (p.imageinfo || [])[0] || {}; return {src: ii.thumburl, by: "Wikimedia Commons", link: ii.descriptionurl}; })
          .filter(function (x) { return x.src; });
        cb(l);
      })
      .catch(function () { cb([]); });
  }
  function images(q, cb) {
    if (imgMem[q]) return cb(imgMem[q]);
    fetch("https://api.openverse.org/v1/images/?q=" + encodeURIComponent(q) + "&page_size=12&mature=false")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        var l = (j.results || []).map(function (r) {
          return {src: r.thumbnail || r.url, by: (r.creator ? r.creator + " / " : "") + "Openverse", link: r.foreign_landing_url};
        });
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
      var im = box.querySelector("img");
      im.onerror = function () { S.img[k] = n + 1; if (n + 1 < l.length) fillImage(box); else box.innerHTML = '<div class="none">No picture found</div>'; };
    });
  }
  function fillAll() {
    Array.prototype.forEach.call(main.querySelectorAll("[data-img]"), fillImage);
    Array.prototype.forEach.call(main.querySelectorAll("[data-ipa]"), function (el) {
      var k = el.getAttribute("data-ipa"), w = WORDS[k];
      dict(w ? w.p : k, function (r) {
        if (!r) { el.innerHTML = ""; return; }
        var lbl = key(r.word) === key(w ? w.p : k) ? "" : esc(r.word) + ": ";
        el.innerHTML = (r.ipa ? '<span class="ipa">' + lbl + esc(r.ipa) + "</span> " : "") +
          (r.audio ? '<button class="btn sm" data-a="audio" data-u="' + esc(r.audio) + '">&#128264; ' + (r.uk ? "UK recording" : "Recording") + "</button>" : "");
      });
    });
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
    var id = "ygw" + (++ygN);
    var vh = Math.round(Math.max(280, box.clientWidth || 340) * 0.62);
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

  // ---------- compare speech ----------
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
        if (opts.long && !st.stopped && Date.now() - st.t0 < 300000 && rec === st) { try { run(); return; } catch (e) {} }
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
        var secs = Math.round((Date.now() - t0) / 1000);
        var blob = new Blob(chunks, {type: m.mimeType || "audio/webm"});
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

  // ---------- recordings store (IndexedDB) ----------
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

  // ---------- building blocks of UI ----------
  function bSay(text, rate, label) {
    return '<button class="btn sm" data-a="say" data-r="' + rate + '" data-t="' + esc(text) + '">' + label + "</button>";
  }
  function practice(text, opts) {
    opts = opts || {};
    return '<div class="rx"><div class="btns">' +
      (opts.noplay ? "" : bSay(text, 1, "&#9654; Listen") + bSay(text, 0.7, "Slow")) +
      '<button class="btn sm" data-a="sr" data-t="' + esc(text) + '">&#127908; Say it</button>' +
      '<button class="btn sm" data-a="rec">&#9679; Record</button>' +
      '</div><div class="out"></div></div>';
  }
  function talkBox(save, title) {
    return '<div class="rx"><div class="btns">' +
      '<button class="btn sm p" data-a="srlong">&#127908; Speak (see your words)</button>' +
      '<button class="btn sm" data-a="rec"' + (save ? ' data-save="' + save + '" data-title="' + esc(title || "") + '"' : "") + '>&#9679; Record' + (save ? " & save" : "") + "</button>" +
      '</div><div class="out"></div></div>';
  }
  function wordCard(w, full) {
    var k = key(w.p);
    return '<div class="card">' +
      '<div class="img" data-img="' + esc(k) + '"><div class="none">Loading picture...</div></div>' +
      '<div class="word">' + esc(w.p) + "</div>" +
      '<div data-ipa="' + esc(k) + '" class="small"></div>' +
      "<div>" + esc(w.d) + "</div>" +
      (w.e ? '<div class="ex">' + esc(w.e) + "</div>" : "") +
      practice(w.p) +
      '<div class="btns">' +
      (w.e ? bSay(w.e, 0.95, "&#9654; Example") : "") +
      '<button class="btn sm" data-a="yg" data-q="' + esc(cleanQ(w.p)) + '">&#127916; Real video</button>' +
      (full ? '<button class="btn sm" data-a="imgnext" data-k="' + esc(k) + '">Another picture</button>' : '<a class="btn sm p" href="#w/' + encodeURIComponent(k) + '">Practise &#8594;</a>') +
      "</div>" +
      '<div class="yg"></div>' +
      "</div>";
  }
  function cleanQ(p) { return String(p).replace(/[(][^)]*[)]/g, "").replace("...", "").replace("?", "").trim(); }
  function doneBtn(id) {
    var d = S.done[VIEW + ":" + id];
    return '<div class="card center">' + (d ? '<div class="muted small">Marked as done.</div>' : "") +
      '<button class="btn g" data-a="done" data-id="' + id + '">&#10003; ' + (d ? "Done - back to today" : "Mark as done") + "</button></div>";
  }

  // ---------- blocks ----------
  var BL = {
    review: {n: "Warm-up review", ic: "&#8635;", d: "Recall your due words from the picture and meaning - say them out loud."},
    words: {n: "New words & chunks", ic: "&#9733;", d: "Six new chunks with a picture, UK audio and real video clips."},
    sound: {n: "Sound & shadowing", ic: "&#9835;", d: "This week's sound, then copy native sentences."},
    ear: {n: "Accent ear training", ic: "&#127911;", d: "Real British voices, fast dictation and accents."},
    tense: {n: "Tenses & sentences", ic: "&#9998;", d: "Answer out loud in the right tense, with frames and model answers."},
    talk: {n: "Topic talk & role-play", ic: "&#128172;", d: "Two-minute talk on a topic, then a real-life conversation."},
    real: {n: "Real listening & retell", ic: "&#128251;", d: "Real radio or podcast, then retell it out loud."},
    weekly: {n: "Weekly recording", ic: "&#127908;", d: "A two-minute talk about your week, saved so you can hear your progress."}
  };
  function dayBlocks(dow) {
    return dow === 7 ? [["review", 20], ["ear", 20], ["weekly", 15], ["real", 35]]
      : [["review", 10], ["words", 15], ["sound", 10], ["ear", 15], ["tense", 15], ["talk", 15], ["real", 10]];
  }
  function dayComplete(i) {
    var bl = dayBlocks(dayInfo(i).dow);
    return bl.every(function (b) { return S.done[i + ":" + b[0]]; });
  }

  // ---------- views ----------
  var ACT = {};
  function vToday() {
    var di = dayInfo(VIEW), W = di.W, ct = courseToday();
    setHead("Week " + di.week + " - Day " + di.dow, W.theme);
    var bl = dayBlocks(di.dow), done = bl.filter(function (b) { return S.done[VIEW + ":" + b[0]]; }).length;
    var mins = Math.floor(todayMs() / 60000), ph = C.phases[Math.floor((di.week - 1) / 4)];
    var h = '<div class="card hero">' +
      '<div class="btns" style="justify-content:space-between;align-items:center">' +
      '<button class="btn sm" data-a="prev"' + (VIEW <= 0 ? " disabled" : "") + ">&#8592;</button>" +
      '<div class="center"><b>Day ' + (VIEW + 1) + " of " + DAYS + '</b><div class="small muted">' + niceDate(addDays(S.start, VIEW)) + "</div></div>" +
      '<button class="btn sm" data-a="next"' + (VIEW >= DAYS - 1 ? " disabled" : "") + ">&#8594;</button></div>" +
      (VIEW !== ct ? '<div class="small" style="margin:6px 0">You are looking at another day. <a href="#" data-a="gotoday">Back to today</a></div>' : "") +
      '<h2 style="margin-top:8px">' + esc(W.theme) + "</h2>" +
      '<span class="tag">' + esc(W.grammar) + '</span><span class="tag t2">Sound: ' + esc(W.sound) + "</span>" +
      '<div class="small muted">Phase ' + ph.n + ": " + esc(ph.name) + " - " + esc(ph.goal) + "</div>" +
      '<div style="margin-top:10px" class="small"><b>' + mins + " / " + GOAL_MIN + " min</b> today &middot; " + done + "/" + bl.length + " parts done</div>" +
      '<div class="bar"><i style="width:' + Math.min(100, Math.round(mins * 100 / GOAL_MIN)) + '%"></i></div></div>';
    if (di.dow === 7) h += '<div class="card"><b>Review day.</b> <span class="muted">Go over the whole week, record your weekly talk and do a longer listening.</span></div>';
    bl.forEach(function (b) {
      var B = BL[b[0]], d = S.done[VIEW + ":" + b[0]];
      var extra = b[0] === "review" ? " &middot; " + (di.dow === 7 ? "whole week" : dueKeys().length + " due") : "";
      h += '<a class="card block' + (d ? " done" : "") + '" href="#b/' + b[0] + '"><div class="ic">' + B.ic + '</div><div class="bd"><div class="nm">' + B.n +
        '</div><div class="small muted">' + b[1] + " min" + extra + " &middot; " + B.d + "</div></div>" + (d ? '<div class="ok">&#10003;</div>' : "") + "</a>";
    });
    main.innerHTML = h;
  }
  ACT.prev = function () { if (VIEW > 0) { VIEW--; vToday(); } };
  ACT.next = function () { if (VIEW < DAYS - 1) { VIEW++; vToday(); } };
  ACT.gotoday = function (el, e) { e.preventDefault(); VIEW = courseToday(); vToday(); };

  // Review block
  function vReview() {
    var di = dayInfo(VIEW), queue = dueKeys();
    if (di.dow === 7) {
      weekWords(di.week).concat(S.own.filter(function (o) { return o.added && diffDays(o.added, today()) < 7; }))
        .forEach(function (w) { var k = key(w.p); if (queue.indexOf(k) < 0) queue.push(k); });
    }
    var pos = 0, right = 0;
    function card() {
      if (pos >= queue.length) {
        main.innerHTML = '<div class="card center"><div class="flash">' + (queue.length ? "Review finished" : "Nothing due today") + "</div>" +
          (queue.length ? '<div class="muted">' + right + " of " + queue.length + " remembered first time.</div>" :
            '<div class="muted">New words come into review the day after you learn them.</div>') + "</div>" +
          (di.dow !== 7 && dayWords(VIEW - 1).length ? '<div class="card"><h2>Quick practice</h2><div class="muted small">Say yesterday\'s words in a sentence:</div><div class="chips">' +
            dayWords(VIEW - 1).map(function (w) { return "<span>" + esc(w.p) + "</span>"; }).join("") + "</div>" + talkBox() + "</div>" : "") +
          doneBtn("review");
        return;
      }
      var k = queue[pos], w = WORDS[k];
      main.innerHTML = '<div class="small muted">' + (pos + 1) + " / " + queue.length + "</div>" +
        '<div class="card"><div class="img" data-img="' + esc(k) + '"><div class="none">Loading picture...</div></div>' +
        "<div><b>Meaning:</b> " + esc(w.d) + "</div>" +
        (w.e ? '<div class="ex">' + esc(blank(w.e, w.p)) + "</div>" : "") +
        '<div class="rx"><div class="btns"><button class="btn p" data-a="rsay">&#127908; Say it</button><button class="btn" data-a="rshow">Show answer</button></div><div class="out"></div></div>' +
        '<div id="ans" hidden><div class="line"></div><div class="word">' + esc(w.p) + '</div><div data-ipa="' + esc(k) + '" class="small"></div>' +
        (w.e ? '<div class="ex">' + esc(w.e) + "</div>" : "") +
        '<div class="small muted">How well did you know it?</div><div class="btns">' +
        '<button class="btn" data-a="rg" data-g="0">Again</button><button class="btn p" data-a="rg" data-g="1">Good</button><button class="btn g" data-a="rg" data-g="2">Easy</button></div></div></div>';
      fillAll();
      var first = true;
      ACT.rsay = function (el) {
        srStart(el, el.closest(".rx").querySelector(".out"), {}, function (said, s, out) {
          if (!said) return;
          var c = compare(w.p, said);
          out.innerHTML += "<div>" + c.html + " - " + verdict(c.pct) + "</div>";
          if (c.pct >= 70 && first) right++;
          first = false;
          ACT.rshow();
        });
      };
      ACT.rshow = function () {
        var a = document.getElementById("ans");
        if (a.hidden) { a.hidden = false; first = false; speak(w.p, 0.9); }
      };
      ACT.rg = function (el) { grade(k, +el.getAttribute("data-g")); if (el.getAttribute("data-g") === "0") queue.push(k); pos++; card(); };
    }
    card();
  }
  function blank(ex, p) {
    var hw = headword(p).slice(0, 4), any = false;
    var out = ex.split(" ").map(function (t) { var x = toks(t)[0] || ""; if (hw.length >= 3 && x.indexOf(hw) === 0) { any = true; return "_____"; } return t; }).join(" ");
    return any ? out : ex;
  }

  // New words block
  function vWords() {
    var ws = dayWords(VIEW), di = dayInfo(VIEW);
    ws.forEach(function (w) { addCard(key(w.p)); });
    var h = '<div class="card"><h2>Today\'s chunks</h2><div class="small muted">For each one: look at the picture, listen to the UK recording, say it 3 times, watch a real clip, then tap <b>Practise</b> to build your own sentences in different tenses.</div></div>';
    if (!ws.length) {
      h += '<div class="card"><b>Words for week ' + di.week + ' are being prepared.</b><div class="muted small">Meanwhile, add words and phrases you heard this week in real life - they are the most useful ones.</div><a class="btn p" href="#add">+ Add a word</a></div>';
    }
    ws.forEach(function (w) { h += wordCard(w, false); });
    main.innerHTML = h + doneBtn("words");
    fillAll();
  }

  // Word detail page
  function vWord(k) {
    var w = WORDS[k];
    if (!w) { main.innerHTML = '<div class="card">Word not found.</div>'; return; }
    setHead(w.p, w.own ? "My word" : "Week " + w.wk + " - Day " + w.day, true);
    addCard(k);
    var frames = [
      ["Present", "Say something true about your normal life with \"" + w.p + "\"."],
      ["Past", "Say what happened yesterday or last week, using \"" + w.p + "\"."],
      ["Present perfect", "Say something you have (or haven't) done recently with \"" + w.p + "\"."],
      ["Future", "Say a plan for tomorrow or next week with \"" + w.p + "\"."],
      ["Question", "Ask someone a question using \"" + w.p + "\"."]
    ];
    var claude = "https://claude.ai/new?q=" + encodeURIComponent("I live in the UK and I'm improving my spoken British English. Give me 6 short, natural everyday sentences using \"" + w.p + "\" in different tenses (present, past, present perfect, future, a question and a negative). After each one, add a short note on when people say it. Then give me 3 questions I can answer out loud using it.");
    var h = wordCard(w, true);
    h += '<div class="card"><h2>More examples</h2><div id="dex" class="small muted">Loading...</div></div>';
    h += '<div class="card"><h2>Build your own sentences</h2><div class="small muted">Say each sentence out loud. The app writes down what it heard and checks that you used the word.</div>';
    frames.forEach(function (f, i) {
      h += '<h3>' + f[0] + '</h3><div class="small">' + esc(f[1]) + '</div><div class="rx"><div class="btns"><button class="btn sm" data-a="srw" data-hw="' + esc(headword(w.p)) + '">&#127908; Speak</button></div><div class="out"></div></div>';
    });
    h += "</div>";
    h += '<div class="card"><h2>Look further</h2><div class="btns">' +
      '<a class="btn sm" target="_blank" rel="noopener" href="https://dictionary.cambridge.org/dictionary/english/' + encodeURIComponent(headword(w.p)) + '">Cambridge Dictionary</a>' +
      '<a class="btn sm" target="_blank" rel="noopener" href="' + ygLink(cleanQ(w.p), "uk") + '">YouGlish (UK)</a>' +
      '<a class="btn sm p" target="_blank" rel="noopener" href="' + claude + '">More sentences in Claude</a>' +
      "</div>" +
      '<details style="margin-top:8px"><summary>Use my own picture</summary><input type="text" id="imgurl" placeholder="Paste an image address (https://...)"><button class="btn sm" data-a="imgset" data-k="' + esc(k) + '">Save picture</button></details>' +
      (w.own ? '<button class="btn sm" style="color:var(--bad)" data-a="wdel" data-k="' + esc(k) + '">Delete this word</button>' : "") +
      "</div>";
    main.innerHTML = h;
    fillAll();
    dict(w.p, function (r) {
      var el = document.getElementById("dex");
      if (!el) return;
      var ex = (r && r.ex) || [];
      el.className = "";
      el.innerHTML = ex.length ? ex.map(function (e) { return '<div class="ex">' + esc(e) + " " + bSay(e, 0.95, "&#9654;") + "</div>"; }).join("") :
        '<div class="small muted">No extra examples in the free dictionary. Use YouGlish or Claude below for more.</div>';
    });
  }
  ACT.srw = function (el) {
    var hw = el.getAttribute("data-hw").slice(0, 4);
    srStart(el, el.closest(".rx").querySelector(".out"), {long: true}, function (said, s, out) {
      if (!said) return;
      var used = toks(said).some(function (t) { return t.indexOf(hw) === 0; });
      out.innerHTML += '<div class="small">' + (used ? '<span class="hit">&#10003; You used the word.</span>' : '<span class="miss">The word was not heard - try again.</span>') +
        " " + bSay(said, 0.95, "&#9654; Hear it read back") + "</div>";
    });
  };
  ACT.imgnext = function (el) {
    var k = el.getAttribute("data-k");
    delete S.imgUrl[k];
    S.img[k] = (S.img[k] || 0) + 1; save();
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

  // Sound & shadowing block
  function vSound() {
    var di = dayInfo(VIEW), W = di.W;
    var list = C.shadow[di.week] || C.shadow[((di.week - 1) % 4) + 1];
    var sents = pick(list, 4, (di.dow - 1) * 2);
    var h = '<div class="card"><h2>' + esc(W.sound) + "</h2>" +
      (W.tip ? "<div>" + esc(W.tip) + "</div>" : '<div class="muted small">Detailed notes for this sound are coming. Today, focus on copying rhythm and stress exactly.</div>') +
      '<div class="btns"><a class="btn sm" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=' + encodeURIComponent("british pronunciation " + W.sound) + '">Watch a lesson on this sound</a></div></div>';
    h += '<div class="card"><h2>Shadowing</h2><div class="small muted">1) Listen. 2) Listen again and speak <b>at the same time</b> as the voice, copying the rhythm, stress and linking. 3) Say it alone and check. Do each sentence 3-5 times.</div></div>';
    sents.forEach(function (s) { h += '<div class="card"><div style="font-size:18px">' + esc(s) + "</div>" + practice(s) + "</div>"; });
    main.innerHTML = h + doneBtn("sound");
  }

  // Ear training block
  function vEar() {
    var di = dayInfo(VIEW), phrases = pick(C.ear, 3, VIEW * 3);
    var pool = [];
    for (var wk = 1; wk <= di.week; wk++) {
      (C.shadow[wk] || []).forEach(function (s) { pool.push(s); });
      (C.tense[wk] || []).forEach(function (t) { if (t.m) t.m.split(". ").forEach(function (s) { if (s.split(" ").length >= 6) pool.push(s.replace(/[.]$/, "") + "."); }); });
    }
    var dict3 = pick(pool, 3, VIEW * 5);
    var acc = [["uk", "British"], ["sco", "Scottish"], ["ie", "Irish"], ["us", "American"], ["aus", "Australian"]];
    var h = '<div class="card"><h2>1. Real voices</h2><div class="small muted">Real people saying a common phrase in YouTube clips. Captions are covered. Listen (use the replay and next-clip buttons in the player), then type the phrase you keep hearing.</div>' +
      '<select id="acc">' + acc.map(function (a) { return '<option value="' + a[0] + '"' + (S.accent === a[0] ? " selected" : "") + ">" + a[1] + " accents</option>"; }).join("") + "</select></div>";
    phrases.forEach(function (p, i) {
      h += '<div class="card"><b>Phrase ' + (i + 1) + '</b><div class="btns"><button class="btn sm p" data-a="earplay" data-q="' + esc(p) + '">&#9654; Load clips</button></div><div class="yg"></div>' +
        '<input type="text" placeholder="What phrase did you hear?" class="eargs"><div class="btns"><button class="btn sm" data-a="earchk" data-q="' + esc(p) + '">Check</button></div><div class="out"></div></div>';
    });
    h += '<div class="card"><h2>2. Fast dictation</h2><div class="small muted">A British voice reads at natural speed. Type exactly what you hear, then check. Listen as many times as you need, but try normal speed first.</div></div>';
    dict3.forEach(function (s, i) {
      h += '<div class="card"><div class="btns">' + bSay(s, 1.08, "&#9654; Normal") + bSay(s, 0.75, "Slow") + '</div><textarea placeholder="Type what you heard..."></textarea>' +
        '<div class="btns"><button class="btn sm" data-a="dchk" data-t="' + esc(s) + '">Check</button></div><div class="out"></div></div>';
    });
    var vids = C.listen.filter(function (l) { return l.url.indexOf("youtube") >= 0; });
    var v = vids[VIEW % vids.length];
    h += '<div class="card"><h2>3. Accent of the day</h2><div><b>' + esc(v.name) + '</b></div><div class="small muted">' + esc(v.note) +
      '</div><a class="btn sm" target="_blank" rel="noopener" href="' + esc(v.url) + '">Open</a></div>';
    main.innerHTML = h + doneBtn("ear");
    document.getElementById("acc").onchange = function () { S.accent = this.value; save(); toast("Accent set - reload the clips"); };
  }
  ACT.earplay = function (el) { ygMount(el.closest(".card").querySelector(".yg"), el.getAttribute("data-q"), true); };
  ACT.uncover = function (el) { Array.prototype.forEach.call(el.parentNode.querySelectorAll(".cover"), function (c) { c.remove(); }); };
  ACT.earchk = function (el) {
    var card = el.closest(".card"), q = el.getAttribute("data-q"), g = card.querySelector(".eargs").value;
    var c = compare(q, g);
    card.querySelector(".out").innerHTML = '<div class="model">The phrase: <b>' + esc(q) + "</b> " + bSay(q, 0.9, "&#9654;") + "</div><div>" + verdict(c.pct) + "</div>";
    Array.prototype.forEach.call(card.querySelectorAll(".cover"), function (c) { c.remove(); });
  };
  ACT.dchk = function (el) {
    var card = el.closest(".card"), t = el.getAttribute("data-t"), g = card.querySelector("textarea").value;
    var c = compare(t, g);
    card.querySelector(".out").innerHTML = '<div class="tr">' + c.html + "</div><div>" + verdict(c.pct) + '</div><div class="small muted">Red words are the ones you missed. Listen again on Slow and notice how they sound in fast speech.</div>';
  };

  // Tenses block
  function vTense() {
    var di = dayInfo(VIEW), W = di.W;
    var T = C.tense[di.week] || [
      {q: "Talk for a minute about your week so far.", f: "Grammar of the week: " + W.grammar, m: ""},
      {q: "Talk for a minute about " + W.theme.toLowerCase() + " in your life.", f: "Start with: 'Well, for me...' / 'The thing is...'", m: ""}
    ];
    var ps = pick(T, 2, (di.dow - 1) * 2), ws = dayWords(VIEW).slice(0, 3);
    var h = '<div class="card"><h2>' + esc(W.grammar) + '</h2><div class="small muted">Read the question, look at the frame, then answer out loud for 30-60 seconds. Don\'t stop to fix mistakes - keep going. Then compare with the model and try again.</div></div>';
    ps.forEach(function (p) {
      h += '<div class="card"><div class="say">' + esc(p.q) + " " + bSay(p.q, 1, "&#9654;") + '</div><div class="hint small"><b>Frame:</b> ' + esc(p.f) + "</div>" + talkBox() +
        (p.m ? '<details><summary>Model answer</summary><div class="model">' + esc(p.m) + "</div>" + bSay(p.m, 1, "&#9654; Listen") + bSay(p.m, 0.8, "Slow") + '<div class="small muted">Now answer again - borrow any phrases you liked.</div>' + talkBox() + "</details>" : "") +
        "</div>";
    });
    if (ws.length) {
      var tl = ["the past (yesterday / last week)", "the present perfect (I've ... / I haven't ... yet)", "the future (I'm going to / I'll)"];
      h += '<div class="card"><h2>Today\'s words in different tenses</h2>';
      ws.forEach(function (w, i) {
        h += '<h3>' + esc(w.p) + '</h3><div class="small">Make a sentence in ' + tl[(i + di.dow) % 3] + '.</div><div class="rx"><div class="btns"><button class="btn sm" data-a="srw" data-hw="' + esc(headword(w.p)) + '">&#127908; Speak</button></div><div class="out"></div></div>';
      });
      h += "</div>";
    }
    main.innerHTML = h + doneBtn("tense");
  }

  // Talk & role-play block
  function vTalk() {
    var di = dayInfo(VIEW), W = di.W;
    var tp = (C.topics[di.week] || [])[di.dow - 1] || {t: W.theme, qs: ["What's your own experience of this?", "What's different about it in the UK?", "Tell a short story connected to it."]};
    var ws = dayWords(VIEW);
    var h = '<div class="card"><h2>Topic: ' + esc(tp.t) + '</h2><div class="small muted">Talk for 2 minutes. Answer the questions in order, give examples and reasons. Try to use today\'s chunks.</div>' +
      tp.qs.map(function (q) { return '<div class="say">' + esc(q) + "</div>"; }).join("") +
      (ws.length ? '<div class="chips">' + ws.map(function (w) { return "<span>" + esc(w.p) + "</span>"; }).join("") + "</div>" : "") +
      talkBox("talk", "Topic: " + tp.t) +
      '<div class="small muted">Tip: record once, listen back, then speak again - the second try is where you improve.</div></div>';
    var sc = (C.scen[di.week] || [])[(di.dow - 1) % 2];
    if (sc) {
      h += '<div class="card"><h2>Role-play: ' + esc(sc.t) + '</h2><div class="small muted">' + esc(sc.s) +
        ' Listen to the other person (text hidden at first), reply out loud, then compare with a model answer.</div><div id="rp"></div></div>';
    } else {
      h += '<div class="card muted small">Role-plays for this week are being prepared.</div>';
    }
    main.innerHTML = h + doneBtn("talk");
    if (sc) rolePlay(sc);
  }
  function rolePlay(sc) {
    var i = 0, box = document.getElementById("rp");
    function show() {
      if (i >= sc.lines.length) {
        box.innerHTML = '<div class="model">Conversation finished. Do it once more - this time without reading the hints.</div><button class="btn sm" data-a="rpagain">Start again</button>';
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

  // Real listening block
  function vReal() {
    var di = dayInfo(VIEW), r = C.listen[VIEW % C.listen.length], mins = di.dow === 7 ? 30 : 10;
    var h = '<div class="card"><h2>' + esc(r.name) + '</h2><div class="small muted">' + esc(r.note) + "</div>" +
      '<a class="btn p" target="_blank" rel="noopener" href="' + esc(r.url) + '">&#9654; Open and listen for ' + mins + " min</a>" +
      '<div class="small muted" style="margin-top:6px">Time spent outside the app is not counted automatically. When you come back, log it:</div>' +
      '<div class="btns"><button class="btn sm" data-a="logmin" data-m="10">+10 min</button><button class="btn sm" data-a="logmin" data-m="20">+20 min</button><button class="btn sm" data-a="logmin" data-m="30">+30 min</button></div></div>';
    h += '<div class="card"><h2>Retell it</h2><div class="small muted">In 1-2 minutes, tell someone what you heard: who was talking, what it was about, one detail, and your opinion. Use the past tense.</div>' +
      talkBox("retell", "Retell: " + r.name) + "</div>";
    h += '<div class="card"><h2>New words you heard</h2><div class="small muted">Write down any word or phrase you heard and didn\'t know. It goes into your review cards.</div>' +
      '<input type="text" id="nw" placeholder="e.g. a wee bit"><button class="btn sm p" data-a="quickadd">+ Add</button></div>';
    h += '<div class="card"><details><summary>All listening sources</summary>' + C.listen.map(function (l) {
      return '<div style="margin:6px 0"><a target="_blank" rel="noopener" href="' + esc(l.url) + '">' + esc(l.name) + '</a><div class="small muted">' + esc(l.note) + "</div></div>";
    }).join("") + "</details></div>";
    main.innerHTML = h + doneBtn("real");
  }
  ACT.logmin = function (el) { var m = +el.getAttribute("data-m"); addTime(m * 60000); toast("+" + m + " min logged"); };
  ACT.quickadd = function () {
    var v = document.getElementById("nw").value.trim();
    if (!v) return;
    addOwn(v, "", "", function () { document.getElementById("nw").value = ""; toast("Added: " + v); });
  };

  // Weekly recording
  function vWeekly() {
    var di = dayInfo(VIEW);
    var h = '<div class="card"><h2>Week ' + di.week + ' recording</h2><div class="small muted">Talk for 2 minutes without stopping: what you did this week, something that went wrong or surprised you, and what you are going to do next week. Use this week\'s chunks and grammar (' + esc(di.W.grammar) + ').</div>' +
      talkBox("weekly", "Week " + di.week + " talk") + "</div>" +
      '<div class="card"><h2>Hear your progress</h2><div id="wlist" class="small muted">Loading...</div></div>';
    main.innerHTML = h + doneBtn("weekly");
    recList(document.getElementById("wlist"), function (r) { return r.kind === "weekly"; });
  }

  ACT.srlong = function (el) {
    srStart(el, el.closest(".rx").querySelector(".out"), {long: true}, function (said, secs, out) {
      if (!said) return;
      var n = toks(said).length, wpm = secs > 5 ? Math.round(n * 60 / secs) : 0;
      out.innerHTML += '<div class="small muted">' + n + " words" + (wpm ? " &middot; about " + wpm + " words per minute (natural speech is 120-160)" : "") + "</div>" +
        bSay(said, 0.95, "&#9654; Hear it read back");
    });
  };

  // Recording list
  function recList(el, filter) {
    store("readonly", function (s) { return s.getAll(); }).then(function (all) {
      all = all.filter(filter || function () { return true; }).sort(function (a, b) { return b.id - a.id; });
      if (!all.length) { el.innerHTML = "No recordings yet."; return; }
      el.className = "";
      el.innerHTML = "";
      all.forEach(function (r) {
        var d = document.createElement("div");
        d.style.margin = "8px 0";
        d.innerHTML = "<b>" + esc(r.title) + '</b> <span class="small muted">' + niceDate(r.date) + " &middot; " + (r.secs || 0) + 's</span> <button class="btn sm" data-a="rdel" data-id="' + r.id + '">Delete</button>';
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
  function vWordList() {
    setHead("Words", Object.keys(S.srs).length + " in review");
    var ct = courseToday(), h = '<div class="card"><input type="text" id="q" placeholder="Search words..."><a class="btn p" href="#add">+ Add a word</a></div><div id="wl"></div>';
    main.innerHTML = h;
    function draw() {
      var q = key(document.getElementById("q").value), out = "";
      function row(w) {
        var k = key(w.p), st = status(k);
        return '<a class="w" href="#w/' + encodeURIComponent(k) + '"><span>' + esc(w.p) + '</span><span class="small ' + (st === "known" ? "hit" : "muted") + '">' + st + "</span></a>";
      }
      function match(w) { return !q || key(w.p).indexOf(q) >= 0 || key(w.d).indexOf(q) >= 0; }
      var own = S.own.filter(match);
      if (own.length) out += '<div class="card list"><h2>My words</h2>' + own.slice().reverse().map(row).join("") + "</div>";
      for (var wk = 1; wk <= 16; wk++) {
        var ws = weekWords(wk).filter(function (w) { return w.idx <= ct && match(w); });
        if (ws.length) out += '<div class="card list"><h2>Week ' + wk + ": " + esc(C.weeks[wk - 1].theme) + "</h2>" + ws.map(row).join("") + "</div>";
      }
      document.getElementById("wl").innerHTML = out || '<div class="card muted">No words yet.</div>';
    }
    document.getElementById("q").oninput = draw;
    draw();
  }
  function addOwn(p, d, e, cb) {
    var k = key(p);
    if (WORDS[k]) { addCard(k); return cb && cb(k); }
    var o = {p: p, d: d, e: e, q: p, own: true, added: today()};
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
    addOwn(p, document.getElementById("ad").value.trim(), document.getElementById("ae").value.trim(), function (k) {
      location.hash = "#w/" + encodeURIComponent(k);
    });
  };

  // Plan tab
  function vPlan() {
    setHead("Plan", "16 weeks - 90 minutes a day");
    var ct = courseToday(), cw = dayInfo(ct).week;
    var h = '<div class="card hero"><h2>How it works</h2><div class="small">Six training days a week with seven short parts (90 min), and a seventh review day with a recorded weekly talk. Words come back for review on a spaced schedule until you know them.</div></div>';
    C.phases.forEach(function (ph) {
      h += '<div class="card"><h2>Phase ' + ph.n + ": " + esc(ph.name) + ' <span class="small muted">weeks ' + ph.weeks + '</span></h2><div class="small muted">' + esc(ph.goal) + "</div>";
      C.weeks.filter(function (w) { return Math.floor((w.n - 1) / 4) + 1 === ph.n; }).forEach(function (w) {
        h += '<details' + (w.n === cw ? " open" : "") + ' style="margin-top:8px"><summary>Week ' + w.n + ": " + esc(w.theme) + (w.n === cw ? " &#9664; now" : "") + "</summary>" +
          '<div class="small"><span class="tag">' + esc(w.grammar) + '</span><span class="tag t2">' + esc(w.sound) + "</span>" + (C.words[w.n] ? "" : '<span class="small muted">content coming</span>') + '</div><div class="days">';
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
      '<div class="small muted">Start date (Day 1)</div><input type="date" id="sd" value="' + S.start + '"><button class="btn sm" data-a="setstart">Save start date</button>' +
      '<div class="small muted" style="margin-top:8px">British voice for listening</div><select id="vc"><option value="">Automatic (en-GB)</option>' +
      vs.map(function (v) { return '<option' + (S.voice === v.name ? " selected" : "") + ' value="' + esc(v.name) + '">' + esc(v.name + " (" + v.lang + ")") + "</option>"; }).join("") +
      "</select>" + bSay("Hello! Shall we put the kettle on and have a proper chat?", 1, "&#9654; Test voice") +
      '<div class="line"></div><div class="small muted">Back up your progress (words, reviews and minutes - not recordings)</div>' +
      '<button class="btn sm" data-a="export">Export backup</button><label class="btn sm">Import backup<input type="file" id="imp" accept="application/json" hidden></label></div>';
    main.innerHTML = h;
    document.getElementById("vc").onchange = function () { S.voice = this.value; save(); toast("Voice saved"); };
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
  ACT.setstart = function () {
    var v = document.getElementById("sd").value;
    if (!v) return;
    S.start = v; save(); VIEW = courseToday(); toast("Start date saved"); vPlan();
  };
  ACT["export"] = function () {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], {type: "application/json"}));
    a.download = "fluent-backup-" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
  };

  // Progress tab
  function vProgress() {
    setHead("Progress", "");
    var t = today(), streak = 0, d = t;
    function min(day) { return Math.floor(((S.log[day] || {}).ms || 0) / 60000); }
    if (min(d) < 20) d = addDays(d, -1);
    while (min(d) >= 20) { streak++; d = addDays(d, -1); }
    var week = 0, total = 0;
    Object.keys(S.log).forEach(function (k) { var m = min(k); total += m; if (diffDays(k, t) < 7) week += m; });
    var known = 0, learning = 0;
    Object.keys(S.srs).forEach(function (k) { if (status(k) === "known") known++; else learning++; });
    var daysDone = 0;
    for (var i = 0; i <= courseToday(); i++) if (dayComplete(i)) daysDone++;
    var bars = "", labels = "", mx = GOAL_MIN;
    for (var j = 13; j >= 0; j--) { mx = Math.max(mx, min(addDays(t, -j))); }
    for (j = 13; j >= 0; j--) {
      var day = addDays(t, -j), m = min(day);
      bars += '<div title="' + m + ' min" style="height:' + Math.round(m * 100 / mx) + '%"></div>';
      labels += "<span>" + parseISO(day).getDate() + "</span>";
    }
    var h = '<div class="card hero"><div class="ring"><div style="font-size:40px;font-weight:800">' + streak + '</div><div><b>day streak</b><div class="small muted">days in a row with at least 20 minutes</div></div></div></div>' +
      '<div class="card"><h2>Time</h2><div>Today: <b>' + Math.floor(todayMs() / 60000) + " min</b> &middot; Last 7 days: <b>" + week + " min</b> &middot; Total: <b>" + (total / 60).toFixed(1) + " h</b></div>" +
      '<div class="bars">' + bars + '</div><div class="blabels">' + labels + '</div><div class="small muted">Last 14 days. Goal: ' + GOAL_MIN + " min a day.</div></div>" +
      '<div class="card"><h2>Words</h2><div><b>' + known + "</b> known &middot; <b>" + learning + "</b> learning &middot; <b>" + dueKeys().length + "</b> due today</div></div>" +
      '<div class="card"><h2>Course</h2><div>Day <b>' + (courseToday() + 1) + "</b> of " + DAYS + " &middot; <b>" + daysDone + '</b> days fully completed</div><div class="bar" style="margin-top:6px"><i style="width:' + Math.round((courseToday() + 1) * 100 / DAYS) + '%"></i></div></div>' +
      '<div class="card"><h2>Your recordings</h2><div class="small muted">Listen to an early recording and a recent one - the difference is your progress.</div><div id="rl" class="small muted">Loading...</div></div>';
    main.innerHTML = h;
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
  ACT.done = function (el) {
    var id = el.getAttribute("data-id");
    S.done[VIEW + ":" + id] = 1; save();
    location.hash = "#today";
  };
  main.addEventListener("click", function (e) {
    var el = e.target.closest("[data-a]");
    if (!el) return;
    var f = ACT[el.getAttribute("data-a")];
    if (f) { if (el.tagName === "A") e.preventDefault(); f(el, e); }
  });

  // ---------- router ----------
  function route() {
    stopBlock(); stopMedia();
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
      ({review: vReview, words: vWords, sound: vSound, ear: vEar, tense: vTense, talk: vTalk, real: vReal, weekly: vWeekly})[id]();
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

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
