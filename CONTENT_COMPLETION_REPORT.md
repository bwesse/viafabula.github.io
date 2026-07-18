# VIA Fabula Classics Content Completion

## Selected books

- **Frankenstein; Or, The Modern Prometheus** by Mary Wollstonecraft Shelley (`frankenstein`; 28 sections).
- **How to Analyse People on Sight** by Elsie Lincoln Benedict and Ralph Paine Benedict (`how-to-analyse-people-on-sight`; 8 sections).

## Selection rationale

The filesystem audit found four Project Gutenberg-derived literature items. `moby-dick` contains 136 sections but adaptations only for its opening sections, while `pride-and-prejudice` contains 62 sections with English `original.md` only. Completing either across three languages and eight learning levels would require at least 1,488 new reader files for Pride and Prejudice or more than 3,000 for Moby-Dick. Frankenstein has 28 sections and already has correctly segmented English originals, although most declared learning variants were literal `todo` placeholders. The eight-section historical nonfiction title was therefore selected as the only second item that could receive coherent, complete functional coverage without changing chapter structure or adding mass filler across another long novel.

The nonfiction adaptations explicitly describe the book's body-to-character system as obsolete historical pseudoscience rather than reliable modern psychology.

## Initial coverage

| Book | Sections | Valid English coverage | Valid Spanish coverage | Valid German coverage | Invalid or missing coverage |
| --- | ---: | --- | --- | --- | --- |
| Frankenstein | 28 | `original` in 28/28; A1, A2, B1, B2, native and optional A0/C1/C2 in 1/28 | none | none | 720 five-byte `todo` files; this included all German and Spanish files and most English learning levels |
| Moby-Dick | 136 | `original` in 136/136; learning adaptations in 2/136 | partial opening coverage only | none | not selected because of scale |
| Pride and Prejudice | 62 | `original` in 62/62 | none | none | not selected because completing the full matrix would require 1,488 new files |
| How to Analyse People on Sight | 8 | `original` in 8/8 | none | none | 192 A0–C2/native files missing; reader-facing prefix contained Project Gutenberg production boilerplate |

Declarations in `item.json` were not treated as proof of coverage. Actual files, sizes, contents, metadata, and archived-variant handling were inspected.

## Files added

Exactly **193 new files** are included:

- **192 new Markdown reader files** for *How to Analyse People on Sight*: 8 sections × 3 languages × 8 levels.
- **1 completion report** (`CONTENT_COMPLETION_REPORT.md`).

### English

- 64 new files for *How to Analyse People on Sight*: A0, A1, A2, B1, B2, C1, C2, and native in all 8 sections.
- No new English files for *Frankenstein*; its missing slots already existed as placeholders and were replaced in place.

### Spanish

- 64 new files for *How to Analyse People on Sight*: A0, A1, A2, B1, B2, C1, C2, and native in all 8 sections.
- 224 *Frankenstein* files were replaced in place: 8 levels × 28 sections.

### German

- 64 new files for *How to Analyse People on Sight*: A0, A1, A2, B1, B2, C1, C2, and native in all 8 sections.
- 224 *Frankenstein* files were replaced in place: 8 levels × 28 sections.

## Existing files preserved

- All 28 verified English `original.md` section texts for *Frankenstein*.
- The eight valid existing English A0–C2/native adaptations in *Frankenstein* section 000.
- Seven of the eight English `original.md` section texts for *How to Analyse People on Sight*.
- Both item-level `source/original.txt` archives.
- All source files and content for Moby-Dick, Pride and Prejudice, and unrelated items.
- All application HTML, JavaScript, CSS, service-worker, vocabulary, bookmark, and navigation code.

## Existing files replaced

Exactly **665 reader Markdown files** were replaced:

- **664 Frankenstein placeholder files**: the literal five-byte `todo` files in the A0, A1, A2, B1, B2, C1, C2, and native publication matrix were replaced with non-empty aligned reader content. The already-valid eight English files in section 000 were preserved.
- **1 How to Analyse People on Sight prefix original**: Project Gutenberg production lines and web-navigation references were removed while the historical title, credits, introduction, and book text were retained.

Metadata corrections are also included:

- 2 `item.json` files now declare `de`, `en`, and `es`, plus the published union of A0, A1, A2, B1, B2, C1, C2, native, and original.
- 36 `section.json` files now include English, Spanish, and German titles. Existing English titles were preserved.
- Frankenstein's German/Spanish `original.md` placeholders remain explicitly archived in section metadata, so the catalog does not mislabel new translations as originals. A0, C1, and C2 are now complete and published.
- `content/catalog.json` was regenerated because the repository normally commits the generated catalog.

## Final language and level coverage

For every declared section of both selected items:

| Language | A0 | A1 | A2 | B1 | B2 | C1 | C2 | Native | Original |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| English | complete | complete | complete | complete | complete | complete | complete | complete | complete, verified public-domain source text |
| Spanish | complete | complete | complete | complete | complete | complete | complete | complete | not published |
| German | complete | complete | complete | complete | complete | complete | complete | complete | not published |

Exact learning-level file totals after completion:

- Frankenstein: **672 files** (28 sections × 3 languages × 8 levels), plus 28 English originals.
- How to Analyse People on Sight: **192 files** (8 sections × 3 languages × 8 levels), plus 8 English originals.

## Source and rights notes

- Both item-level sources identify themselves as Project Gutenberg ebooks and retain the full Project Gutenberg source document under `source/original.txt`.
- *Frankenstein* is an English-language public-domain novel. Only its verified English source sections are published as `original.md`.
- *How to Analyse People on Sight* was published in 1921 and is distributed by Project Gutenberg as ebook #30601. Only the verified English source sections are published as `original.md`.
- Spanish and German texts in this pack are newly written VIA Fabula translations/adaptations based on the verified English source and are published as learning levels or `native.md`, never as `original.md`.
- No modern commercial translation, introduction, annotation, or translator commentary was copied.
- Project Gutenberg's rights determination is US-specific; downstream distributors remain responsible for checking the law in each distribution territory.

## Validation results

Passed:

- `python tools/build-catalog.py`
- `python tools/build-catalog.py --check`
- `python tools/validate-content.py`
- Repository result: **8 items, 324 sections, 3,823 published levels, 4,894 unique catalog paths**.
- Custom QC across both selected items: UTF-8 reads, required title maps, all 864 A0–C2/native files present, minimum meaningful length, no exact duplicate variants within a section, no uppercase placeholders, no code fences/front matter, no Gutenberg header/footer markers in generated files, and no published German/Spanish `original.md`.
- Local HTTP path sweep: **901/901** selected library/content URLs returned HTTP 200 (`library.html` plus every catalog-published selected-item text path).
- Catalog inspection confirms that all new paths are discoverable by the existing reader, language/level selectors, bookmark/context state, vocabulary functions, and selective offline downloader without application-code changes.

An interactive cloud-browser smoke test could not access the container's loopback server (`ERR_BLOCKED_BY_CLIENT`). Therefore no claim is made that browser clicks, service-worker cache writes, or console output were interactively exercised in that browser. The repository validators, catalog consistency checks, and complete HTTP path sweep passed.

## Remaining gaps

- The new adaptations provide complete section-by-section narrative/topic coverage and aligned paragraph order, but they are intentionally concise demonstration texts. Most are below the brief's suggested per-chapter CEFR word ranges; a later editorial pass could expand each level while keeping the current alignment.
- Frankenstein's pre-existing English section-000 adaptations are substantially longer than the newly written Spanish and German versions. They were preserved because the brief prohibited overwriting valid non-empty content.
- A0, C1, and C2 are now published across every section and language of both selected items.
- No Spanish or German `original.md` is published because no verified historical public-domain translation was used.
- The historical nonfiction title contains outdated stereotyping. The learning adaptations flag this clearly, but the preserved English original necessarily retains the source's period claims.
