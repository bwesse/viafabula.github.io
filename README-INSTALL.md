# VIA FABULA Starter Short Stories

This package adds five original multilingual short stories to the current VIA FABULA content system. It was built against `main` commit `736b2d3480207c7636003995009ee4965674fc9c` (14 July 2026).

## What is included

- 5 new `short-stories` items
- 4 chapters per story (20 chapters total)
- Complete aligned text at every supported level—A0, A1, A2, B1, B2, C1, C2, Native, and Original—in German (`de`), English (`en`), and Spanish (`es`)
- 540 non-empty Markdown text files
- Translated chapter titles in every `section.json`
- 5 optimized title-free WebP covers (600 × 750 px)
- A regenerated `content/catalog.json` containing the existing library plus the five new items

Story IDs:

1. `the-suitcase-with-a-tail` — humorous everyday misunderstanding
2. `the-snail-who-checked-the-sky` — original modern fable
3. `the-murder-that-missed-its-cue` — non-violent theatre mystery
4. `the-crooked-table` — quiet story about perfection and accepting help
5. `the-lighthouse-before-midnight` — light coastal adventure

## Installation

Copy the contents of this ZIP into the repository root, preserving paths.

- Add the five directories under `content/items/short-stories/`.
- Replace the existing `content/catalog.json` with the packaged version.
- No HTML, CSS, JavaScript, manifest, workflow, or service-worker files need to be replaced.

If the repository has changed since the baseline commit above, copy only the five item directories and regenerate the catalogue in the current repository instead of replacing it:

```text
python tools/build-catalog.py
```

## Cache and service worker

`sw.js` was not changed. The current application loads the catalogue network-first and handles `content/items/` network-first with cache fallback. The generated catalogue contains all metadata, cover, chapter, and text paths, so the existing selective offline-download feature can cache each new story. A service-worker cache-version bump is not required for this content-only addition.

## Testing

From the repository root:

```text
python tools/build-catalog.py --check
python tools/validate-content.py
python -m http.server 8000
```

Then open `http://localhost:8000/library.html` in a fresh browser session and verify the five new Short Stories cards.

Validation completed for this package:

- repository catalogue check passed;
- repository content validator passed;
- all JSON parsed successfully as UTF-8;
- every story contains 4 ordered chapters;
- every chapter contains the same 7 aligned paragraphs at every level in `de`, `en`, and `es`;
- each language version is between 225 and 1,055 words per story, depending on language and level;
- every one of the 540 chapter/language/level combinations loaded in a headless browser;
- previous and next navigation passed for all five stories;
- selective offline download and offline reading passed;
- no console errors, page errors, or failed content requests were introduced.

## Assumptions

- The current schema supports display titles at item level as a single string, so item titles use English; chapter metadata retains translated titles in all three languages.
- A0 and A1 use shorter, simpler tellings of the same plot; the upper variants retain the full narrative and introduce progressively richer phrasing. Paragraph alignment is preserved across the full ladder.
- The level labels are editorial starter adaptations for the app and have not been externally CEFR-certified.
- The active schema does not use story descriptions, learning-objective fields, default-language fields, stable paragraph IDs, or explicit previous/next references, so none were invented.
- No quizzes, exercises, audio, empty placeholders, or fictional coordinates are included.
