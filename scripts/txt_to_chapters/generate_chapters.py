#!/usr/bin/env python3
"""
Generate chapter folder structures from plain text books.

Supports multiple chapter heading styles:
  - Arabic numeral:  "CHAPTER 1. Title."        (e.g. Moby Dick)
  - Roman numeral:   "CHAPTER I." or "CHAPTER I" (e.g. Pride and Prejudice,
                                                   How to Analyse People)

For each chapter the following folder tree is created:

    chapters/
      <chapter_id>/
        english/
          a0.md  a1.md  a2.md  b1.md  b2.md  c1.md  c2.md  native.md  original.md
        german/
          a0.md  a1.md  a2.md  b1.md  b2.md  c1.md  c2.md  native.md  original.md
        spanish/
          a0.md  a1.md  a2.md  b1.md  b2.md  c1.md  c2.md  native.md  original.md

Only english/original.md receives the actual chapter text; all other .md files
are left empty.  Existing files are never overwritten.

Usage:
    python generate_chapters.py <path/to/book.txt> [--output-dir <dir>]
"""

import argparse
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

LANGUAGES = ["english", "german", "spanish"]
LEVELS = ["a0", "a1", "a2", "b1", "b2", "c1", "c2", "native", "original"]

# Minimum character count that distinguishes body text from a TOC entry.
# We also require at least one blank line (paragraph break) in the body.
TOC_THRESHOLD = 50

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def roman_to_int(s: str) -> int:
    """Convert a Roman numeral string to an integer."""
    vals = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    result, prev = 0, 0
    for ch in reversed(s.upper()):
        v = vals.get(ch, 0)
        if v < prev:
            result -= v
        else:
            result += v
        prev = v
    return result


def slugify(text: str, max_len: int = 40) -> str:
    """Convert arbitrary text to a filesystem-safe lowercase slug."""
    text = text.lower().strip()
    # drop possessives, hyphens and em-dashes before replacing punctuation
    text = re.sub(r"['\u2019\u2014\u2013\-]", "", text)
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = text.strip("_")
    # remove a leading "the_" so "the_whale" → "whale"
    text = re.sub(r"^the_", "", text)
    return text[:max_len]


def unwrap_paragraphs(text: str) -> str:
    """
    Join soft-wrapped lines within each paragraph so that each paragraph
    occupies exactly one logical line.  Blank-line paragraph separators are
    preserved.
    """
    # Normalise CRLF / CR
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    paragraphs = re.split(r"\n{2,}", text)
    unwrapped = []
    for para in paragraphs:
        lines = para.splitlines()
        # Strip trailing whitespace from every line
        lines = [l.rstrip() for l in lines]
        # If every non-empty line is short (< 10 chars), it is likely a
        # heading / illustration reference – keep line breaks as-is.
        non_empty = [l for l in lines if l.strip()]
        if non_empty and all(len(l) < 10 for l in non_empty):
            unwrapped.append("\n".join(lines))
        else:
            # Join with a single space, collapse internal runs of whitespace
            joined = " ".join(l for l in lines if l.strip())
            joined = re.sub(r" {2,}", " ", joined)
            unwrapped.append(joined)

    return "\n\n".join(unwrapped)


# ---------------------------------------------------------------------------
# Gutenberg stripping
# ---------------------------------------------------------------------------

_START_RE = re.compile(
    r"\*{3}\s*START OF THE PROJECT GUTENBERG.*?\*{3}", re.IGNORECASE
)
_END_RE = re.compile(
    r"\*{3}\s*END OF THE PROJECT GUTENBERG.*?\*{3}", re.IGNORECASE
)


def strip_gutenberg(text: str) -> str:
    """Remove Project Gutenberg header and footer."""
    m = _START_RE.search(text)
    if m:
        text = text[m.end():]
    m = _END_RE.search(text)
    if m:
        text = text[: m.start()]
    return text


# ---------------------------------------------------------------------------
# Chapter detection
# ---------------------------------------------------------------------------

# Pattern A – Moby Dick style:  "CHAPTER 42. The Whiteness of the Whale."
_ARABIC_RE = re.compile(
    r"^CHAPTER\s+(\d+)\.\s+(.+?)\.?\s*$",
    re.MULTILINE,
)

# Pattern B – Roman numeral style (case-insensitive first word, optional
# trailing period and/or bracket):
#   "CHAPTER I."  |  "CHAPTER I"  |  "Chapter I.]"
_ROMAN_RE = re.compile(
    r"^(?:CHAPTER|Chapter)\s+([IVXLCDM]+)\.?\]?\s*$",
    re.MULTILINE,
)


def _detect_pattern(text: str):
    """
    Return (compiled_pattern, pattern_type) where pattern_type is
    'arabic' or 'roman'.
    """
    arabic_hits = len(_ARABIC_RE.findall(text))
    roman_hits = len(_ROMAN_RE.findall(text))
    if arabic_hits >= roman_hits:
        return _ARABIC_RE, "arabic"
    return _ROMAN_RE, "roman"


def _real_chapters(text: str, pattern) -> list:
    """
    Return only the regex Match objects whose heading is followed by enough
    body text to be a genuine chapter (not a TOC entry).

    A heading is considered a real chapter when the text that follows it
    (before the next heading) contains at least one blank line, indicating
    actual paragraph content rather than a short TOC continuation line.
    A minimum character length is also required as a safety net.
    """
    all_matches = list(pattern.finditer(text))
    real = []
    for i, m in enumerate(all_matches):
        next_start = all_matches[i + 1].start() if i + 1 < len(all_matches) else len(text)
        body = text[m.end(): next_start].strip()
        has_blank_line = "\n\n" in body
        if len(body) > TOC_THRESHOLD and has_blank_line:
            real.append(m)
    return real


# ---------------------------------------------------------------------------
# Book splitting
# ---------------------------------------------------------------------------

def split_book(text: str):
    """
    Split *text* (already stripped of the Gutenberg envelope) into:
        prefix_text  – content before the first proper chapter
        chapters     – list of (chapter_number: int, folder_name: str, chapter_text: str)

    The chapter_text includes the heading line.
    """
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    pattern, ptype = _detect_pattern(text)
    raw_matches = _real_chapters(text, pattern)

    if not raw_matches:
        return text.strip(), []

    # Deduplicate: if the same chapter number appears more than once in the
    # candidate list (e.g. the last TOC entry passes the blank-line test
    # because it is followed by an Epilogue with blank lines), keep only the
    # *last* occurrence of each number – the actual body chapter always comes
    # after the TOC occurrence.
    if ptype == "arabic":
        seen: dict[int, int] = {}  # chapter_num -> index in raw_matches
        for idx, m in enumerate(raw_matches):
            num = int(m.group(1))
            seen[num] = idx          # overwrite → last occurrence wins
        chapters_matches = [raw_matches[i] for i in sorted(seen.values())]
    else:
        chapters_matches = raw_matches  # Roman-numeral books have no TOC ambiguity

    prefix = text[: chapters_matches[0].start()].strip()

    chapters = []
    pad = len(str(len(chapters_matches)))  # digit-width for zero-padding
    pad = max(pad, 2)                       # at least 2 digits

    for i, m in enumerate(chapters_matches):
        end = chapters_matches[i + 1].start() if i + 1 < len(chapters_matches) else len(text)
        ch_text = text[m.start(): end].strip()

        if ptype == "arabic":
            num = int(m.group(1))
            title = m.group(2).strip().rstrip(".")
            folder = f"{num:0{pad}d}_{slugify(title)}"
        else:
            roman = m.group(1)          # group(1) for the roman part
            num = roman_to_int(roman)
            folder = f"{num:0{pad}d}_chapter_{roman.lower()}"

        chapters.append((num, folder, ch_text))

    return prefix, chapters


# ---------------------------------------------------------------------------
# Folder / file creation
# ---------------------------------------------------------------------------

def create_chapter(chapters_dir: Path, chapter_id: str, english_text: str) -> None:
    """
    Create the full language × level folder tree for one chapter.

    *english_text* is written verbatim to english/original.md.
    All other .md files are created empty.
    Files that already exist are left untouched.
    """
    ch_dir = chapters_dir / chapter_id

    for lang in LANGUAGES:
        lang_dir = ch_dir / lang
        lang_dir.mkdir(parents=True, exist_ok=True)

        for level in LEVELS:
            md_path = lang_dir / f"{level}.md"
            if md_path.exists():
                continue  # never overwrite

            if lang == "english" and level == "original":
                content = unwrap_paragraphs(english_text)
            else:
                content = ""

            md_path.write_text(content, encoding="utf-8")


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def process_book(txt_file: str, output_dir: str | None = None) -> int:
    """
    Parse *txt_file* and create the chapter folder tree.

    Returns the number of chapters created.
    """
    txt_path = Path(txt_file)
    if not txt_path.is_file():
        print(f"ERROR: file not found: {txt_file}", file=sys.stderr)
        return 0

    book_dir = Path(output_dir) if output_dir else txt_path.parent
    chapters_dir = book_dir / "chapters"
    chapters_dir.mkdir(parents=True, exist_ok=True)

    raw = txt_path.read_text(encoding="utf-8", errors="replace")
    body = strip_gutenberg(raw)

    prefix, chapters = split_book(body)

    created = 0

    # Prefix section (content before chapter 1)
    if prefix.strip():
        create_chapter(chapters_dir, "00_prefix", prefix.strip())
        created += 1

    for _num, folder_name, ch_text in chapters:
        create_chapter(chapters_dir, folder_name, ch_text)
        created += 1

    print(f"Book : {txt_path.name}")
    print(f"Output: {chapters_dir}")
    print(f"Sections created/updated: {created}  ({len(chapters)} chapters + prefix)")
    return created


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate chapter folder structure from a plain-text book."
    )
    parser.add_argument("txt_file", help="Path to the plain-text book (.txt)")
    parser.add_argument(
        "--output-dir",
        help="Directory that will contain the 'chapters' folder "
             "(default: same directory as the txt file)",
    )
    args = parser.parse_args()
    process_book(args.txt_file, args.output_dir)


if __name__ == "__main__":
    main()
