#!/usr/bin/env python3
"""
Generate TTS .wav files for language-level text files using *separate* Piper HTTP
servers (one per language).

Expected structures under some ROOT directory:

  Single chapter directory
    ROOT/
      english/
        a0/a0.md or a0.md
        a1/a1.md or a1.md
        ...
      spanish/
        a0/a0.md or a0.md
        ...
      german/
        a0/a0.md or a0.md
        ...

  Book with chapters at top level
    ROOT/
      00_intro/
        english/...
        spanish/...
      01_next/
        english/...
        ...

  Book with chapters under "chapters/"
    ROOT/
      chapters/
        00_prefix/
          english/...
          ...
        01_loomings/
          english/...
          ...

For each <lang>/<level>/<level>.md or .txt, create:

    <lang>/<level>/<level>.wav

Language -> server mapping (ports):

  english -> http://127.0.0.1:5001
  spanish -> http://127.0.0.1:5002
  german  -> http://127.0.0.1:5003

Each server is started with the appropriate -m MODEL.
"""

import argparse
from pathlib import Path
import sys
import requests

# Map language directory name -> Piper HTTP server URL
LANGUAGE_SERVERS = {
    "english": "http://127.0.0.1:5001",
    "spanish": "http://127.0.0.1:5002",
    "german":  "http://127.0.0.1:5003",
}

LEVEL_NAMES = [
    "a0",
    "a1",
    "a2",
    "b1",
    "b2",
    "c1",
    "c2",
    "native",
    "original",
]


def find_text_file(level_dir: Path, level_name: str) -> Path | None:
    """Try <level>.md, then <level>.txt."""
    md_path = level_dir / f"{level_name}.md"
    if md_path.is_file():
        return md_path
    txt_path = level_dir / f"{level_name}.txt"
    if txt_path.is_file():
        return txt_path
    return None


def synthesize_to_wav(server_url: str, text: str, out_path: Path) -> None:
    """Send text to Piper HTTP server (POST JSON) and save WAV."""
    url = server_url.rstrip("/")  # e.g. http://127.0.0.1:5001

    payload = {"text": text}

    try:
        resp = requests.post(url, json=payload, timeout=300)
    except requests.RequestException as e:
        print(f"  [error] HTTP request failed: {e}")
        return

    if resp.status_code != 200:
        print(f"  [error] Server returned {resp.status_code}: {resp.text[:200]!r}")
        return

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(resp.content)
    print(f"  -> wrote {out_path}")


def find_language_dirs(parent: Path) -> list[Path]:
    """Return language directories present under parent."""
    return [
        child
        for child in sorted(parent.iterdir())
        if child.is_dir() and child.name in LANGUAGE_SERVERS
    ]


def find_chapter_dirs(book_dir: Path) -> list[Path]:
    """Return chapter directories under a book directory."""
    chapters: list[Path] = []

    for child in sorted(book_dir.iterdir()):
        if not child.is_dir():
            continue

        if child.name == "chapters":
            for grandchild in sorted(child.iterdir()):
                if grandchild.is_dir():
                    chapters.append(grandchild)
            continue

        chapters.append(child)

    return [chapter for chapter in chapters if find_language_dirs(chapter)]


def process_language_dir(lang_dir: Path, server_url: str, force: bool) -> None:
    lang_name = lang_dir.name
    print(f"  Language: {lang_name} (server: {server_url})")

    for level_name in LEVEL_NAMES:
        text_file: Path | None
        out_wav: Path | None

        level_dir = lang_dir / level_name
        if level_dir.is_dir():
            text_file = find_text_file(level_dir, level_name)
            out_wav = level_dir / f"{level_name}.wav"
        else:
            text_file = find_text_file(lang_dir, level_name)
            out_wav = (lang_dir / f"{level_name}.wav") if text_file else None

        if text_file is None or out_wav is None:
            continue

        if out_wav.exists() and not force:
            print(f"    [skip] {out_wav} already exists (use --force to overwrite)")
            continue

        text = text_file.read_text(encoding="utf-8").strip()
        if not text:
            print(f"    [skip] {text_file} is empty")
            continue

        print(f"    Synthesizing {text_file} -> {out_wav}")
        synthesize_to_wav(server_url, text, out_wav)


def process_chapter_dir(chapter_dir: Path, force: bool) -> None:
    print(f"\n-- Chapter: {chapter_dir.name}")
    language_dirs = find_language_dirs(chapter_dir)

    if not language_dirs:
        print("  [skip] No language folders found in this chapter.")
        return

    for lang_dir in language_dirs:
        server_url = LANGUAGE_SERVERS.get(lang_dir.name)
        if server_url is None:
            print(f"  [skip] No server configured for {lang_dir.name}")
            continue
        process_language_dir(lang_dir, server_url, force)


def process_book_dir(book_dir: Path, force: bool) -> bool:
    chapters = find_chapter_dirs(book_dir)
    if not chapters:
        print(f"[skip] {book_dir} has no chapters with language folders.")
        return False

    print(f"\n=== Book: {book_dir.name} ===")
    for chapter_dir in chapters:
        process_chapter_dir(chapter_dir, force)

    return True


def main():
    parser = argparse.ArgumentParser(
        description="Generate TTS .wav files using separate Piper HTTP servers per language."
    )
    parser.add_argument(
        "--root",
        type=str,
        default="content/books",
        help=(
            "Root directory containing books or a single chapter. "
            "Examples: content/books (all books), content/books/The_Tortoise_and_the_Hare "
            "(one book), content/books/The_Tortoise_and_the_Hare/00_preamble (one chapter)."
        ),
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing .wav files.",
    )

    args = parser.parse_args()
    root = Path(args.root).resolve()

    if not root.is_dir():
        print(f"Root is not a directory: {root}")
        sys.exit(1)

    print(f"Root: {root}")

    # Case 1: root is a chapter directory (contains language folders)
    if find_language_dirs(root):
        process_chapter_dir(root, args.force)
        print("\nDone.")
        return

    # Case 2: root is a single book directory
    if process_book_dir(root, args.force):
        print("\nDone.")
        return

    # Case 3: root contains multiple books
    processed_any = False
    for book_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        processed_any |= process_book_dir(book_dir, args.force)

    if not processed_any:
        print("[info] Nothing to process — no books/chapters with language folders found.")

    print("\nDone.")


if __name__ == "__main__":
    main()
