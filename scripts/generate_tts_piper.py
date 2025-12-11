#!/usr/bin/env python3
"""
Generate TTS .wav files for language-level text files using *separate* Piper HTTP
servers (one per language).

Expected structure under some ROOT directory:

  ROOT/
    english/
      a0/a0.md or a0/a0.txt
      a1/a1.md or a1/a1.txt
      ...
    spanish/
      a0/a0.md or a0/a0.txt
      ...
    german/
      a0/a0.md or a0/a0.txt
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

LEVEL_NAMES = {"a0", "a1", "a2", "b1", "b2", "c1", "c2"}


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

def process_language_dir(
    root: Path,
    lang_dir: Path,
    server_url: str,
    force: bool,
):
    lang_name = lang_dir.name
    print(f"\n=== Language: {lang_name} (server: {server_url}) ===")

    for level_dir in sorted(lang_dir.iterdir()):
        if not level_dir.is_dir():
            continue

        level_name = level_dir.name.lower()
        if level_name not in LEVEL_NAMES:
            # Skip folders like "native", "original", etc.
            continue

        text_file = find_text_file(level_dir, level_name)
        if text_file is None:
            print(f"  [skip] No {level_name}.md or {level_name}.txt in {level_dir}")
            continue

        out_wav = level_dir / f"{level_name}.wav"
        if out_wav.exists() and not force:
            print(f"  [skip] {out_wav} already exists (use --force to overwrite)")
            continue

        text = text_file.read_text(encoding="utf-8")
        if not text.strip():
            print(f"  [skip] {text_file} is empty")
            continue

        print(f"  Synthesizing {text_file} -> {out_wav}")
        synthesize_to_wav(server_url, text, out_wav)


def main():
    parser = argparse.ArgumentParser(
        description="Generate TTS .wav files using separate Piper HTTP servers per language."
    )
    parser.add_argument(
        "--root",
        type=str,
        default=".",
        help="Root directory containing language folders (english, spanish, german). "
             "Example: content/books/The_Tortoise_and_the_Hare/00_preamble",
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

    for lang_name, server_url in LANGUAGE_SERVERS.items():
        lang_dir = root / lang_name
        if not lang_dir.is_dir():
            continue
        process_language_dir(root, lang_dir, server_url, args.force)

    print("\nDone.")


if __name__ == "__main__":
    main()
