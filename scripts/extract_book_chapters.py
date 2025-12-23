#!/usr/bin/env python3
"""
Extract chapters from a plain text book file and create the folder structure
used by the viafabula project.

This script takes a plain text file (like Frankenstein/original.txt) and:
1. Parses chapter breaks (patterns like "Letter 1", "Chapter 1", etc.)
2. Extracts content for each chapter
3. Creates the folder structure: <book_name>/chapters/XX_chapter_name/english/original/original.md

Usage:
    python extract_book_chapters.py <input_file> <output_base_dir>

Example:
    python extract_book_chapters.py content/books/Frankenstein/original.txt content/books/Frankenstein
"""

import os
import re
import sys
import argparse
from pathlib import Path


def slugify(text):
    """Convert text to a valid folder name (lowercase, underscores instead of spaces)."""
    # Convert to lowercase and replace spaces/special chars with underscores
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    slug = re.sub(r'[-\s]+', '_', slug)
    return slug.strip('_')


def extract_chapters(input_file):
    """
    Parse the input file and extract chapters.
    
    Returns a list of tuples: (chapter_number, chapter_title, chapter_content)
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Handle Project Gutenberg files - skip header/footer
    start_idx = 0
    end_idx = len(lines)
    
    for i, line in enumerate(lines):
        if '*** START OF' in line and 'GUTENBERG' in line:
            start_idx = i + 1
        elif '*** END OF' in line and 'GUTENBERG' in line:
            end_idx = i
            break
    
    # Use the content between start and end markers
    content_lines = lines[start_idx:end_idx]
    
    chapters = []
    current_chapter = None
    current_content = []
    # Matches patterns like "Letter 1", "Chapter 1", "Letter I", "Chapter II", etc.
    # To support additional patterns like "Part", "Book", "Section", add them to the pattern
    chapter_pattern = re.compile(r'^(Letter|Chapter)\s+(\d+|[IVXLCDM]+)$', re.IGNORECASE)
    
    # Find where actual content starts by looking for consistent chapter headers
    # In TOC, chapter entries are usually indented or in a list
    # Actual chapters are left-aligned and followed by content
    in_actual_content = False
    
    for line_num, line in enumerate(content_lines):
        stripped = line.strip()
        
        # Check if this line matches a chapter pattern
        match = chapter_pattern.match(stripped)
        
        if match:
            # Determine if this is TOC or actual content
            # Real chapters: line starts at column 0 (no leading whitespace) and has content after
            # TOC entries: typically have leading whitespace or are followed by other chapter names
            
            if not in_actual_content:
                # Check if line has leading whitespace (TOC indicator)
                if line.startswith(' ') or line.startswith('\t'):
                    # This is likely TOC, skip it
                    continue
                
                # Check what follows this chapter marker
                if line_num + 1 < len(content_lines):
                    # Look ahead a few lines
                    next_lines = content_lines[line_num + 1:min(line_num + 10, len(content_lines))]
                    next_stripped = [l.strip() for l in next_lines if l.strip()]
                    
                    # If the next non-empty lines contain more chapter patterns, it's TOC
                    # Threshold of 2 indicates a list of chapters (TOC) vs actual content
                    toc_count = sum(1 for l in next_stripped[:5] if chapter_pattern.match(l))
                    if toc_count >= 2:
                        # Multiple chapter patterns nearby = TOC
                        continue
                    
                    # If there's substantial text content, it's the real chapter
                    if len(next_stripped) >= 3:
                        in_actual_content = True
            
            if in_actual_content:
                # Save previous chapter if exists
                if current_chapter is not None:
                    chapters.append((
                        current_chapter['number'],
                        current_chapter['title'],
                        ''.join(current_content)
                    ))
                
                # Start new chapter
                chapter_type = match.group(1)  # "Letter" or "Chapter"
                chapter_num = match.group(2)   # Number or Roman numeral
                
                # Convert roman numerals to integers if needed
                try:
                    num_val = int(chapter_num)
                except ValueError:
                    # Try to convert roman numeral
                    num_val = roman_to_int(chapter_num)
                
                current_chapter = {
                    'number': num_val,
                    'title': f"{chapter_type} {chapter_num}",
                    'type': chapter_type.lower()
                }
                current_content = []
        elif current_chapter is not None:
            # Add line to current chapter content
            current_content.append(line)
    
    # Don't forget the last chapter
    if current_chapter is not None:
        chapters.append((
            current_chapter['number'],
            current_chapter['title'],
            ''.join(current_content)
        ))
    
    return chapters


def roman_to_int(s):
    """Convert Roman numeral to integer."""
    roman_values = {
        'I': 1, 'V': 5, 'X': 10, 'L': 50,
        'C': 100, 'D': 500, 'M': 1000
    }
    
    s = s.upper()
    total = 0
    prev_value = 0
    
    for char in reversed(s):
        value = roman_values.get(char, 0)
        if value < prev_value:
            total -= value
        else:
            total += value
        prev_value = value
    
    return total


def clean_chapter_content(content):
    """Clean up chapter content by removing excessive whitespace."""
    lines = content.split('\n')
    
    # Remove leading empty lines
    while lines and not lines[0].strip():
        lines.pop(0)
    
    # Remove trailing empty lines
    while lines and not lines[-1].strip():
        lines.pop()
    
    # Join lines back together
    cleaned = '\n'.join(lines)
    
    # Remove excessive blank lines (more than 2 consecutive)
    cleaned = re.sub(r'\n\n\n+', '\n\n', cleaned)
    
    return cleaned.strip()


def create_chapter_structure(chapters, output_base_dir, book_name):
    """
    Create the folder structure for all chapters.
    
    Structure:
        <book_name>/chapters/XX_chapter_name/english/original/original.md
    """
    chapters_dir = Path(output_base_dir) / 'chapters'
    chapters_dir.mkdir(parents=True, exist_ok=True)
    
    created_folders = []
    
    for idx, (chapter_num, chapter_title, chapter_content) in enumerate(chapters, start=1):
        # Create folder name: XX_chapter_name
        # Using sequential numbering (starting from 01) ensures consistent folder numbering
        folder_num = f"{idx:02d}"
        folder_name = f"{folder_num}_{slugify(chapter_title)}"
        
        # Create the full path
        chapter_dir = chapters_dir / folder_name / 'english' / 'original'
        chapter_dir.mkdir(parents=True, exist_ok=True)
        
        # Write the content to original.md
        output_file = chapter_dir / 'original.md'
        cleaned_content = clean_chapter_content(chapter_content)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
            f.write('\n')  # Ensure file ends with newline
        
        created_folders.append(folder_name)
        print(f"Created: {folder_name}/english/original/original.md")
    
    return created_folders


def main():
    parser = argparse.ArgumentParser(
        description='Extract chapters from a plain text book and create folder structure'
    )
    parser.add_argument(
        'input_file',
        help='Path to the input text file (e.g., content/books/Frankenstein/original.txt)'
    )
    parser.add_argument(
        'output_base_dir',
        help='Base directory for output (e.g., content/books/Frankenstein)'
    )
    parser.add_argument(
        '--book-name',
        help='Name of the book (derived from output_base_dir if not provided)',
        default=None
    )
    
    args = parser.parse_args()
    
    # Validate input file
    if not os.path.exists(args.input_file):
        print(f"Error: Input file '{args.input_file}' not found", file=sys.stderr)
        sys.exit(1)
    
    # Determine book name
    book_name = args.book_name
    if book_name is None:
        book_name = Path(args.output_base_dir).name
    
    print(f"Extracting chapters from: {args.input_file}")
    print(f"Output directory: {args.output_base_dir}")
    print(f"Book name: {book_name}")
    print()
    
    # Extract chapters
    chapters = extract_chapters(args.input_file)
    print(f"Found {len(chapters)} chapters")
    print()
    
    # Create folder structure
    created_folders = create_chapter_structure(chapters, args.output_base_dir, book_name)
    
    print()
    print(f"Successfully created {len(created_folders)} chapter folders")
    print(f"Chapters directory: {os.path.join(args.output_base_dir, 'chapters')}")


if __name__ == '__main__':
    main()
