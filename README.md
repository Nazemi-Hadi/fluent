# Fluent

Personal speaking & listening coach (PWA). 16-week plan, 90 minutes a day.

- `course.js` - all course content (weeks, words, tense prompts, shadowing, topics, role-plays, listening sources). Weeks 1-4 have full content; later weeks fall back to generic prompts until added.
- `app.js` - the app. Progress lives in the browser (localStorage `fluent.v1`, recordings in IndexedDB `fluent`).
- Free services used at runtime: dictionaryapi.dev (IPA + audio), Openverse / Wikimedia Commons (pictures), YouGlish widget (real video clips), browser speech synthesis (en-GB) and speech recognition (Chrome).
- Keep all files ASCII-only. Bump `CACHE` in `sw.js` on every change.
