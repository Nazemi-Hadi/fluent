# Fluent

Personal speaking & listening coach (PWA). 16-week plan, 100+ new words a day, no time cap.

- `course.js` - weeks, everyday chunks (weeks 1-4), tense prompts, shadowing, topics, role-plays, ear phrases, listening sources.
- `extras.js` - 160 extra phrases per week (phrasal verbs, collocations, idioms, spoken British, linking phrases) for weeks 1-4, plus memory and past/present/future speaking prompts.
- `words.js` - GENERATED: the Oxford 5000 B2-C1 additions (2,000 words from American_Oxford_5000.pdf) in study order, with definitions per part of speech (dictionaryapi.dev, Wiktionary fallback), IPA/audio, UK spellings and Persian meanings (Google Translate); plus Persian meanings for every phrase. Rebuild with the scripts in the session scratchpad (`build.py`).
- `app.js` - the app. Daily new words come from one study queue (chunks + extras + Oxford, ~100 per course day); self-paced, so you can learn ahead. Progress in localStorage `fluent.v1`, recordings in IndexedDB `fluent`.
- Keep all files ASCII-only (non-ASCII data is \u-escaped in words.js). Bump `CACHE` in `sw.js` on every change.
