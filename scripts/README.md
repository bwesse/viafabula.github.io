# Scripts

This directory contains utility scripts for the ViaFabula project.

## extract_book_chapters.py

A Python script that extracts chapters from plain text book files and creates the folder structure used by the ViaFabula project.

### Features

- Parses chapter breaks (supports patterns like "Letter 1", "Chapter 1", "Stave I", "Chapter I.", etc.)
- Handles Project Gutenberg formatted files (skips header/footer and TOC)
- Creates standardized folder structure: `<book_name>/chapters/XX_chapter_name/english/original/original.md`
- Adaptive: works with different text files and chapter formats
- Automatically converts Roman numerals to integers
- Supports books with "Stave" chapters (e.g., A Christmas Carol)
- Supports chapters with periods after numbers (e.g., "CHAPTER I." in Alice in Wonderland)

### Usage

```bash
python3 scripts/extract_book_chapters.py <input_file> <output_base_dir>
```

### Examples

Extract chapters from Frankenstein:
```bash
python3 scripts/extract_book_chapters.py \
    content/books/Frankenstein/original.txt \
    content/books/Frankenstein
```

Extract chapters from A Christmas Carol:
```bash
python3 scripts/extract_book_chapters.py \
    content/books/a_christmas_carol/original.txt \
    content/books/a_christmas_carol
```

Extract chapters from Alice in Wonderland:
```bash
python3 scripts/extract_book_chapters.py \
    "content/books/Alice's Adventures in Wonderland by Lewis Carroll/original.txt" \
    "content/books/Alice's Adventures in Wonderland by Lewis Carroll"
```

Extract chapters from a custom book:
```bash
python3 scripts/extract_book_chapters.py \
    path/to/book.txt \
    content/books/MyBook \
    --book-name "My Book"
```

### Input File Format

The script works best with:
- Plain text files with clear chapter markers
- Project Gutenberg format books
- Chapter headers like "Chapter 1", "Letter 1", "Stave I", "Chapter I.", "Part I", etc.

### Output Structure

The script creates the following structure:
```
<output_base_dir>/
  chapters/
    01_chapter_name/
      english/
        original/
          original.md
    02_chapter_name/
      english/
        original/
          original.md
    ...
```

This matches the structure used by other books in the project (e.g., The_Tortoise_and_the_Hare, moby_dick, ben_robin_wesse).

### Notes

- The script automatically skips Project Gutenberg headers, footers, and table of contents
- Chapter names are converted to lowercase with underscores (e.g., "Chapter 1" → "chapter_1")
- Each chapter is numbered sequentially starting from 01
- Only the `english/original/original.md` files are created; other language versions and difficulty levels can be added separately

## Other Scripts

- `clean_wav.py` - Utility for cleaning audio files
- `generate_tortoise_questions.js` - Generates questions for The Tortoise and the Hare
- `generate_tts_piper.py` - Generates TTS audio files using Piper
