# EPUB export

VIA Fabula’s EPUB exporter packages one canonical content item as one offline,
reflowable EPUB 3 publication. An export contains every non-empty published
Markdown version declared by the item’s sections: all available sections,
languages, CEFR levels, native versions, original versions, item metadata, and
a compatible existing cover when one is available.

The exporter reads `content/items/<type>/<item-id>/` directly. It does not use
`content/catalog.json` as its source and does not change canonical content.
Generated files are developer artifacts under `exports/epub/`; they are not
website downloads and are not committed by default.

## Reading model

The start page groups available reading paths by language and level. The EPUB
table of contents uses the same language → level → section hierarchy. Each
chapter has static links to:

- the same section in another language, with a documented fallback when the
  current level is unavailable;
- another available level in the current language;
- the previous and next section in the current language-and-level track;
- the relevant track in the table of contents.

Static links work offline and in readers with limited scripting support. The
EPUB contains no JavaScript and does not reproduce the PWA’s controls. Saved
vocabulary, reminders, spaced review, browser storage, audio, comprehension
questions, and bookmarks are intentionally outside this export format.

Language switches preserve the current level when possible. Otherwise they
prefer Native, then the nearest available CEFR level, then the first available
version, and the link shows the level actually selected. Links preserve context
at section level. Stable paragraph IDs are generated for future work, but the
exporter does not claim sentence or paragraph alignment.

## Commands

Run commands from the repository root:

```text
python tools/build-epub.py --item frankenstein
python tools/build-epub.py --all
python tools/build-epub.py --item frankenstein --force
python tools/build-epub.py --all --force
python tools/build-epub.py --watch
python tools/build-epub.py --watch --item frankenstein
python tools/build-epub.py --list
python tools/build-epub.py --all --check
python tools/build-epub.py --help
```

Normal builds calculate an input fingerprint from the exporter, item and
section metadata, published Markdown, and the selected cover. If both the
fingerprint and existing output are current, the item is skipped. Build state
is stored in `exports/epub/.build-state.json`. `--force` bypasses the skip.

`--check` is validation-only: it verifies that each requested EPUB exists,
matches its current source fingerprint, and passes internal structural
validation. It does not rebuild missing or stale output. New builds are written
to a temporary file and validated before replacing the previous EPUB, so a
failed build does not destroy the last valid artifact.

The dependency-free watcher polls `content/items/`, debounces saves, and
rebuilds only the item that owns a changed file. It detects additions, removals,
and renames, continues after item-specific errors, and stops cleanly with
Ctrl+C. Removed-item artifacts are retained and reported rather than deleted
automatically.

## VS Code tasks

Use **Terminal → Run Task** and select:

- `EPUB: Build one item` (prompts for the item ID)
- `EPUB: Build all items`
- `EPUB: Watch content`
- `EPUB: Force rebuild all`

The tasks call the same Python commands and require no VS Code extension.

## GitHub Actions artifacts

`.github/workflows/build-epubs.yml` runs on manual dispatch and relevant
content/exporter changes. It validates existing content, force-builds all
EPUBs, performs a validation-only pass, and uploads `exports/epub/*.epub` as the
`via-fabula-epubs` workflow artifact. It does not commit binaries or change the
GitHub Pages deployment.

## Optional EPUBCheck

Basic validation uses only Python’s standard library. To additionally run the
official EPUBCheck tool, provide an existing local JAR and Java installation:

```text
python tools/build-epub.py --item frankenstein --epubcheck path/to/epubcheck.jar
```

Or set `EPUBCHECK_JAR` before any normal command:

```text
EPUBCHECK_JAR=path/to/epubcheck.jar python tools/build-epub.py --all
```

The exporter never downloads executables. An EPUBCheck error or unavailable
requested Java/JAR fails the command.

## Example editing workflow

1. Edit a Markdown story file.
2. Save it.
3. Run the watch task once during the editing session.
4. The affected EPUB is rebuilt in `exports/epub/`.
5. Open the EPUB in Calibre, Thorium, Apple Books, or another EPUB 3 reader.

Reader behavior varies, so identical presentation is not promised across every
application.

## Known limitations

- The Markdown converter intentionally supports the repository’s small safe
  subset: headings, paragraphs, unordered lists, blank-line-separated blocks,
  and explicit line breaks. Raw HTML is escaped and is never trusted as EPUB
  markup.
- Context switching is section-based; there is no automatic sentence
  alignment.
- AVIF and WebP covers are detected and fingerprinted but not embedded because
  broad EPUB reader compatibility is uncertain. Existing JPEG and PNG covers
  are embedded without conversion.
- EPUB-specific versions include story text and metadata, not interactive PWA
  features, audio, quizzes, or persistent browser data.
