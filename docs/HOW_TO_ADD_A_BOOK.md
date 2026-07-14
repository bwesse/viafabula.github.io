# How to add a content item

The filename is retained for existing links, but this guide applies to every item type—not only books.

## 1. Choose the type and ID

Use one of these category folders:

- `literature`
- `short-stories`
- `travel`
- `biography`

Choose a stable lowercase kebab-case item ID. Type describes the content form; it does not describe where the text came from. Record provenance separately in `source.origin`.

Create:

```text
content/items/<type>/<item-id>/item.json
```

Do not derive application identity from a display title.

## 2. Add item metadata

Use schema version 1:

```json
{
  "schemaVersion": 1,
  "id": "example-item",
  "legacyIds": [],
  "type": "literature",
  "catalogOrder": 0,
  "subtype": "novel",
  "title": "Example Item",
  "author": "Established Author Name",
  "sectionLabel": {
    "singular": "Chapter",
    "plural": "Chapters"
  },
  "source": {
    "origin": "project-gutenberg",
    "rights": "public-domain",
    "originalLanguage": "en"
  },
  "languages": ["en"],
  "levels": ["original"],
  "sections": [
    { "id": "section-001", "slug": "opening", "order": 1 }
  ]
}
```

`catalogOrder` controls stable ordering within a type and must be unique there. Only state an author, licence, rights status, publication fact, or source when evidence supports it. Otherwise use conservative metadata such as:

```json
{
  "origin": "unknown",
  "rights": "review-required"
}
```

Do not publish copyrighted material merely because it can be stored in this structure. Confirm the right to distribute original prose, adaptations, translations, questions, audio, and images.

## 3. Add ordered sections

Use three-digit ordering and kebab-case:

```text
sections/000-introduction/
sections/001-opening/
sections/002-the-journey/
```

Each section requires `section.json`:

```json
{
  "schemaVersion": 1,
  "id": "section-001",
  "slug": "opening",
  "order": 1,
  "title": {
    "en": "Opening"
  },
  "legacyIds": []
}
```

Add translated titles only when known. Do not invent translations.

## 4. Add language and level text

Use BCP 47 or ISO-style language codes such as `en`, `es`, `de`, or `fr`:

```text
sections/001-opening/text/en/a0.md
sections/001-opening/text/en/b1.md
sections/001-opening/text/en/native.md
sections/001-opening/text/en/original.md
```

Supported conventional level filenames are `a0.md`, `a1.md`, `a2.md`, `b1.md`, `b2.md`, `c1.md`, `c2.md`, `native.md`, and `original.md`. Add only non-empty files containing meaningful text. Metadata belongs in JSON, so Markdown does not require front matter.

## 5. Add optional quizzes

Create `quizzes/` only when a quiz exists. Include language and level in the filename:

```text
sections/001-opening/quizzes/en-a2.json
sections/001-opening/quizzes/es-b1.json
```

Keep the established quiz schema. The catalogue must point explicitly to each quiz; the reader does not guess its path.

## 6. Add optional audio

Create `audio/` only when audio exists:

```text
sections/001-opening/audio/en-a2.wav
sections/001-opening/audio/es-native.mp3
```

Preserve the source format. Do not overwrite a distinct recording or infer audio paths at runtime.

## 7. Add covers and media

Place an existing cover at the item root as `cover.<supported-extension>` (`avif`, `jpg`, `jpeg`, `png`, or `webp`). The catalog generator detects and references it. Put section-specific illustrations or other assets under that section's `media/` directory. Do not create empty asset directories, resize images automatically, or omit rights review for visual assets.

Retained full-source documents may be stored in an item-level `source/` folder and listed in `item.json.sourceFiles`. These files are archival unless explicitly exposed by the catalogue.

## 8. Generate the catalogue

Do not edit `content/catalog.json` manually. Generate it from the canonical metadata and published files:

```powershell
python tools/build-catalog.py
```

The browser still receives an explicit catalog—GitHub Pages never scans folders at runtime. The generator validates item/type identity, section declarations and ordering, non-empty Markdown, optional quizzes/audio/covers, archived variants, and conflicting paths. It fails with the metadata or file that needs correction.

## 9. Validate and smoke-test

Run:

```powershell
python tools/build-catalog.py --check
python tools/validate-content.py
python -m http.server 8000
```

Open <http://localhost:8000/library.html>, confirm the item card, then test several levels in the reader along with quiz, audio, navigation, bookmarks, and selective offline download behaviour. Check the browser console for missing paths. On deployment, the Pages workflow regenerates the catalog automatically, so a correctly structured item appears after it is pushed.
