# VIA Fabula

VIA Fabula is a dependency-free static progressive web app for reading literature, short stories, travel writing, and biography at multiple languages and CEFR levels. It supports Markdown rendering, language and level switching, comprehension questions, audio, bookmarks, reading-position persistence, text sizing, dark mode, and selective offline item downloads.

## Run locally

Serve the repository over HTTP; service workers and fetch requests do not work correctly through `file://`.

```powershell
python -m http.server 8000
```

Open <http://localhost:8000/>.

## Content architecture

All published content is driven at runtime by the generated [`content/catalog.json`](content/catalog.json):

```text
content/
├── catalog.json
└── items/
    ├── literature/
    ├── short-stories/
    ├── travel/
    └── biography/
```

Each item has `item.json`, ordered sections, and explicit language/level paths:

```text
content/items/<type>/<item-id>/
├── item.json
├── source/                    # optional retained source documents
└── sections/
    └── 001-section-slug/
        ├── section.json
        ├── text/en/a2.md
        ├── quizzes/en-a2.json # optional
        └── audio/en-a2.wav    # optional
```

Item type and source origin are independent. For example, Moby-Dick is `literature` sourced from Project Gutenberg, while Morocco is `travel` with an original source origin.

See [`docs/HOW_TO_ADD_A_BOOK.md`](docs/HOW_TO_ADD_A_BOOK.md) for the complete authoring process and rights requirements.

## Validate content

```powershell
python tools/build-catalog.py
python tools/build-catalog.py --check
python tools/validate-content.py
```

The generator scans canonical item and section metadata and writes a deterministic catalog. The validator checks catalog freshness, metadata identity and ordering, JSON syntax, path existence, duplicate destinations, optional assets, allowed types, and empty published Markdown.

## GitHub Pages deployment

The Pages workflow generates the catalog, validates the content, and deploys the resulting static artifact on every push to `main`. In the repository's **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source once. The pull-request workflow checks that the committed catalog is current and validates all content.

## PWA files

- `index.html` contains the static reader.
- `library.html` contains the generated-catalog Library view.
- `manifest.json` defines installation metadata and icons.
- `sw.js` caches the app shell and handles selective offline item downloads.

The complete library is not globally precached. Readers choose which item to download.
