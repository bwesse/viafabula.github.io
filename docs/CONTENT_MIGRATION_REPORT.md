# Content Migration Report

## 1. Original inventory

The pre-migration library contained 9,818 files: 9,075 Markdown, 388 JSON, 351 WAV, and 4 TXT files. Of the Markdown files, 5,373 were verified byte-for-byte as zero-byte placeholders. No whitespace-only non-empty text files were found.

## 2. Item classifications

Eight meaningful items were retained. `Pride_and_Prejudice` and `How_to_Analyse_People_on_Sight` were present on disk but absent from the old catalogue; both are classified as literature. Type describes the content form, while `source.origin` independently records provenance.

## 3. Complete old-to-new item mapping

| Old root | New item root | Type |
|---|---|---|
| `content/books/mobby_dick` | `literature/moby-dick` | literature |
| `content/books/Frankenstein` | `literature/frankenstein` | literature |
| `content/books/Pride_and_Prejudice` | `literature/pride-and-prejudice` | literature |
| `content/books/How_to_Analyse_People_on_Sight` | `literature/how-to-analyse-people-on-sight` | literature |
| `content/books/The_Tortoise_and_the_Hare` | `short-stories/the-tortoise-and-the-hare` | short-stories |
| `content/books/Morocco` | `travel/morocco` | travel |
| `content/books/Peru` | `travel/peru` | travel |
| `content/books/ben_robin_wesse` | `biography/ben-robin-wesse` | biography |

Section counts: `moby-dick` 136, `frankenstein` 28, `pride-and-prejudice` 62, `how-to-analyse-people-on-sight` 8, `the-tortoise-and-the-hare` 13, `morocco` 30, `peru` 32, `ben-robin-wesse` 15.

## 4. Naming decisions

Item, category, section, and general filenames use lowercase kebab-case. Sections use a three-digit order prefix and stable `section-NNN` identity. Language folders use `en`, `es`, `de`, and `fr`. The original full-book TXT sources are preserved under each applicable item's `source/original.txt`.

## 5. Collisions encountered

Moby-Dick's `001_loomings`/`01_loomings` and `002_carpetbag`/`02_carpet_bag` roots were merged by section order. The formatted three-digit-root text is the published `original.md`; each non-identical alternate is preserved as `original-legacy.md` and referenced only by `section.json.archivedVariants`.

The short story had 13 misplaced top-level `english/c1.md` files containing the same repeated first-scene text. Correct section-specific `english/c1/c1.md` files were retained.

## 6. Deleted empty files

Exactly 5373 zero-byte Markdown placeholders were removed. Breakdown:

| Source item | Language | Level | Removed |
|---|---|---|---:|
| How_to_Analyse_People_on_Sight | de | a0 | 8 |
| How_to_Analyse_People_on_Sight | de | a1 | 8 |
| How_to_Analyse_People_on_Sight | de | a2 | 8 |
| How_to_Analyse_People_on_Sight | de | b1 | 8 |
| How_to_Analyse_People_on_Sight | de | b2 | 8 |
| How_to_Analyse_People_on_Sight | de | c1 | 8 |
| How_to_Analyse_People_on_Sight | de | c2 | 8 |
| How_to_Analyse_People_on_Sight | de | native | 8 |
| How_to_Analyse_People_on_Sight | de | original | 8 |
| How_to_Analyse_People_on_Sight | en | a0 | 8 |
| How_to_Analyse_People_on_Sight | en | a1 | 8 |
| How_to_Analyse_People_on_Sight | en | a2 | 8 |
| How_to_Analyse_People_on_Sight | en | b1 | 8 |
| How_to_Analyse_People_on_Sight | en | b2 | 8 |
| How_to_Analyse_People_on_Sight | en | c1 | 8 |
| How_to_Analyse_People_on_Sight | en | c2 | 8 |
| How_to_Analyse_People_on_Sight | en | native | 8 |
| How_to_Analyse_People_on_Sight | es | a0 | 8 |
| How_to_Analyse_People_on_Sight | es | a1 | 8 |
| How_to_Analyse_People_on_Sight | es | a2 | 8 |
| How_to_Analyse_People_on_Sight | es | b1 | 8 |
| How_to_Analyse_People_on_Sight | es | b2 | 8 |
| How_to_Analyse_People_on_Sight | es | c1 | 8 |
| How_to_Analyse_People_on_Sight | es | c2 | 8 |
| How_to_Analyse_People_on_Sight | es | native | 8 |
| How_to_Analyse_People_on_Sight | es | original | 8 |
| Pride_and_Prejudice | de | a0 | 62 |
| Pride_and_Prejudice | de | a1 | 62 |
| Pride_and_Prejudice | de | a2 | 62 |
| Pride_and_Prejudice | de | b1 | 62 |
| Pride_and_Prejudice | de | b2 | 62 |
| Pride_and_Prejudice | de | c1 | 62 |
| Pride_and_Prejudice | de | c2 | 62 |
| Pride_and_Prejudice | de | native | 62 |
| Pride_and_Prejudice | de | original | 62 |
| Pride_and_Prejudice | en | a0 | 62 |
| Pride_and_Prejudice | en | a1 | 62 |
| Pride_and_Prejudice | en | a2 | 62 |
| Pride_and_Prejudice | en | b1 | 62 |
| Pride_and_Prejudice | en | b2 | 62 |
| Pride_and_Prejudice | en | c1 | 62 |
| Pride_and_Prejudice | en | c2 | 62 |
| Pride_and_Prejudice | en | native | 62 |
| Pride_and_Prejudice | es | a0 | 62 |
| Pride_and_Prejudice | es | a1 | 62 |
| Pride_and_Prejudice | es | a2 | 62 |
| Pride_and_Prejudice | es | b1 | 62 |
| Pride_and_Prejudice | es | b2 | 62 |
| Pride_and_Prejudice | es | c1 | 62 |
| Pride_and_Prejudice | es | c2 | 62 |
| Pride_and_Prejudice | es | native | 62 |
| Pride_and_Prejudice | es | original | 62 |
| mobby_dick | de | a0 | 138 |
| mobby_dick | de | a1 | 138 |
| mobby_dick | de | a2 | 138 |
| mobby_dick | de | b1 | 138 |
| mobby_dick | de | b2 | 138 |
| mobby_dick | de | c1 | 138 |
| mobby_dick | de | c2 | 138 |
| mobby_dick | de | native | 138 |
| mobby_dick | de | original | 138 |
| mobby_dick | en | a0 | 136 |
| mobby_dick | en | a1 | 136 |
| mobby_dick | en | a2 | 136 |
| mobby_dick | en | b1 | 136 |
| mobby_dick | en | b2 | 136 |
| mobby_dick | en | c1 | 136 |
| mobby_dick | en | c2 | 136 |
| mobby_dick | en | native | 136 |
| mobby_dick | es | a0 | 136 |
| mobby_dick | es | a1 | 136 |
| mobby_dick | es | a2 | 136 |
| mobby_dick | es | b1 | 136 |
| mobby_dick | es | b2 | 136 |
| mobby_dick | es | c1 | 136 |
| mobby_dick | es | c2 | 136 |
| mobby_dick | es | native | 135 |
| mobby_dick | es | original | 136 |

## 7. Deleted exact duplicates

The following 13 misplaced copies were removed after hash/content verification; the canonical first-scene text remains in the correct section-specific file:

- `content/books/The_Tortoise_and_the_Hare/00_preamble/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/01_A_Boastful_Runner/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/02_A_Quiet_Challenge/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/03_The_Forest_Gathers/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/04_At_the_Starting_Line/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/05_The_Race_Begins/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/06_Overconfidence/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/07Steady_Progress/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/08_A_Sudden_Awakening/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/09_The_Final_Stride/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/10_Lesson_of_the_Day/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/11_A_New_Understanding/english/c1.md`
- `content/books/The_Tortoise_and_the_Hare/12_The_Enduring_Moral/english/c1.md`

## 8. Retained unclear files

All four non-empty TXT source documents were retained in item-level `source/` folders. The two Moby-Dick legacy variants were retained archivally. Exactly 2,640 Markdown files containing the literal marker `todo` were conservatively preserved because they are non-empty and their intended publication state is not established.

The post-migration duplicate scan found 131 hash groups (2,904 files beyond the first copy): 2,648 Markdown and 387 quiz JSON files. These occupy distinct item/section/language/level slots, including the deliberately preserved `todo` placeholders and identical question sets used at different semantic levels. They were retained because identical bytes alone do not prove those published slots are disposable artifacts.

## 9. Preservation counts

| Content class | Before | Removed empty/duplicate | After |
|---|---:|---:|---:|
| Markdown | 9,075 | 5,373 empty + 13 duplicates | 3,689 |
| Quiz JSON | 388 | 0 | 388 |
| Audio | 351 | 0 | 351 |
| Images/media | 0 | 0 | 0 |
| TXT source files | 4 | 0 | 4 |

The Markdown delta is limited to the approved zero-byte placeholders and verified repeated short-story copies. A Git-blob multiset audit confirmed exact byte preservation for all 3,689 retained Markdown files, 388 quizzes, 351 audio files, and four TXT source documents.

## 10. Validation results

`python tools/validate-content.py` passed:

```text
Content validation passed: 8 items, 324 sections, 3687 published levels, 4758 unique catalogue paths.
```

The final filesystem audit found zero zero-byte files, zero whitespace-only text/JSON files, zero empty content directories, no catalogue path collisions, and no missing archived variants.

## 11. Smoke-test results

Cache-independent smoke tests ran through `python -m http.server` and headless Chrome. Results:

- all 4,759 catalogue and app paths returned successfully over HTTP;
- all eight item options appeared;
- one item from each of the four categories opened;
- first/last section navigation and 136-section Moby-Dick ordering passed;
- language and CEFR level switching, Markdown rendering, quizzes, and existing audio passed;
- optional missing quiz/audio did not break reading;
- canonical bookmark storage and invalid legacy-bookmark cleanup passed;
- dark mode and text sizing passed;
- service-worker registration/control and offline app-shell reload passed;
- selective download cached all 17 files for a complete test item;
- no catalogue-listed browser request returned a 404.

## 12. Remaining risks or manual checks

Rights for Morocco, Peru, the biography, and the public-domain adaptation remain marked `review-required` where repository evidence did not establish a licence. The 2,640 non-empty `todo` Markdown files remain intentionally preserved and warrant editorial review. Git directory-level moves were denied by the Windows checkout, so byte-preserving filesystem moves were used; the staged diff must be reviewed with a high rename limit to display move detection.
