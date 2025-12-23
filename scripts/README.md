# Scripts

This directory contains utility scripts for the ViaFabula project.

## extract_book_chapters.py

A Python script that extracts chapters from plain text book files and creates the folder structure used by the ViaFabula project.

### Features

- Parses chapter breaks (supports patterns like "Letter 1", "Chapter 1", etc.)
- Handles Project Gutenberg formatted files (skips header/footer and TOC)
- Creates standardized folder structure: `<book_name>/chapters/XX_chapter_name/english/original/original.md`
- Adaptive: works with different text files and chapter formats
- Automatically converts Roman numerals to integers

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
- Chapter headers like "Chapter 1", "Letter 1", "Part I", etc.

### Output Structure

The script creates the following structure:
```
<output_base_dir>/
  chapters/
    00_chapter_name/
      english/
        original/
          original.md
    01_chapter_name/
      english/
        original/
          original.md
    ...
```

This matches the structure used by other books in the project (e.g., The_Tortoise_and_the_Hare, mobby_dick, ben_robin_wesse).

### Notes

- The script automatically skips Project Gutenberg headers, footers, and table of contents
- Chapter names are converted to lowercase with underscores (e.g., "Chapter 1" → "chapter_1")
- Each chapter is numbered sequentially starting from 00
- Only the `english/original/original.md` files are created; other language versions and difficulty levels can be added separately

## Other Scripts

- `clean_wav.py` - Utility for cleaning audio files
- `generate_tortoise_questions.js` - Generates questions for The Tortoise and the Hare
- `generate_tts_piper.py` - Generates TTS audio files using Piper
