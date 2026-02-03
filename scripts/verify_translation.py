#!/usr/bin/env python3
"""
Translation Verification Script

This script verifies that translations maintain the same paragraph structure
as the original files.

Usage:
    python3 verify_translation.py <original_file> <translated_file>
    
    # Verify a chapter's translations
    python3 verify_translation.py --chapter-path ./content/books/Morocco/general/01_Geography --languages es,de
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Tuple


def split_into_paragraphs(text: str) -> List[str]:
    """Split markdown text into paragraphs."""
    paragraphs = re.split(r'\n\n+', text)
    return [p.strip() for p in paragraphs if p.strip()]


def verify_files(original_file: str, translated_file: str, verbose: bool = True) -> Tuple[bool, dict]:
    """
    Verify that a translation maintains the same structure as the original.
    
    Returns:
        Tuple of (success: bool, details: dict)
    """
    if not os.path.exists(original_file):
        return False, {'error': f'Original file not found: {original_file}'}
    
    if not os.path.exists(translated_file):
        return False, {'error': f'Translated file not found: {translated_file}'}
    
    # Read files
    with open(original_file, 'r', encoding='utf-8') as f:
        original_content = f.read()
    
    with open(translated_file, 'r', encoding='utf-8') as f:
        translated_content = f.read()
    
    # Split into paragraphs
    original_paragraphs = split_into_paragraphs(original_content)
    translated_paragraphs = split_into_paragraphs(translated_content)
    
    # Count headers
    original_headers = len(re.findall(r'^#+\s+', original_content, re.MULTILINE))
    translated_headers = len(re.findall(r'^#+\s+', translated_content, re.MULTILINE))
    
    # Count list items
    original_lists = len(re.findall(r'^\s*[-*]\s+', original_content, re.MULTILINE))
    translated_lists = len(re.findall(r'^\s*[-*]\s+', translated_content, re.MULTILINE))
    
    # Build details
    details = {
        'original_paragraphs': len(original_paragraphs),
        'translated_paragraphs': len(translated_paragraphs),
        'paragraph_match': len(original_paragraphs) == len(translated_paragraphs),
        'original_headers': original_headers,
        'translated_headers': translated_headers,
        'headers_match': original_headers == translated_headers,
        'original_lists': original_lists,
        'translated_lists': translated_lists,
        'lists_match': original_lists == translated_lists,
    }
    
    # Check for untranslated content
    if translated_content.strip().lower() == 'todo':
        details['status'] = 'Not translated (contains only "todo")'
        success = False
    elif len(translated_content.strip()) < 100:
        details['status'] = 'Possibly not translated (too short)'
        success = False
    elif details['paragraph_match'] and details['headers_match']:
        details['status'] = 'OK - Structure matches'
        success = True
    else:
        details['status'] = 'WARNING - Structure mismatch'
        success = False
    
    if verbose:
        print(f"\n{'='*60}")
        print(f"Verification: {os.path.basename(original_file)} → {os.path.basename(translated_file)}")
        print(f"{'='*60}")
        print(f"Status: {details['status']}")
        print(f"\nParagraphs: {details['original_paragraphs']} → {details['translated_paragraphs']} {'✓' if details['paragraph_match'] else '✗'}")
        print(f"Headers: {details['original_headers']} → {details['translated_headers']} {'✓' if details['headers_match'] else '✗'}")
        print(f"Lists: {details['original_lists']} → {details['translated_lists']} {'✓' if details['lists_match'] else '✗'}")
    
    return success, details


def verify_chapter(chapter_path: str, languages: List[str], source_lang: str = 'en', verbose: bool = True) -> Tuple[int, int]:
    """
    Verify translations for a chapter.
    
    Returns:
        Tuple of (successful_count, failed_count)
    """
    lang_dir_map = {
        'en': 'english', 'es': 'spanish', 'de': 'german', 'fr': 'french',
        'english': 'english', 'spanish': 'spanish', 'german': 'german', 'french': 'french'
    }
    
    source_dir = lang_dir_map.get(source_lang, source_lang)
    source_file = os.path.join(chapter_path, source_dir, 'original', 'original.md')
    
    if not os.path.exists(source_file):
        print(f"Source file not found: {source_file}", file=sys.stderr)
        return 0, 1
    
    successful = 0
    failed = 0
    
    for target_lang in languages:
        target_dir = lang_dir_map.get(target_lang, target_lang)
        target_file = os.path.join(chapter_path, target_dir, 'original', 'original.md')
        
        success, details = verify_files(source_file, target_file, verbose)
        
        if success:
            successful += 1
        else:
            failed += 1
    
    return successful, failed


def main():
    parser = argparse.ArgumentParser(description='Verify markdown translations')
    parser.add_argument('original_file', nargs='?', help='Original markdown file')
    parser.add_argument('translated_file', nargs='?', help='Translated markdown file')
    parser.add_argument('--chapter-path', help='Path to chapter directory')
    parser.add_argument('--languages', help='Comma-separated target languages to verify')
    parser.add_argument('--source-lang', default='en', help='Source language (default: en)')
    parser.add_argument('--quiet', action='store_true', help='Suppress verbose output')
    
    args = parser.parse_args()
    
    verbose = not args.quiet
    
    # Chapter mode
    if args.chapter_path:
        if not args.languages:
            print("Error: --languages required for chapter mode", file=sys.stderr)
            return 1
        
        languages = [lang.strip() for lang in args.languages.split(',')]
        successful, failed = verify_chapter(args.chapter_path, languages, args.source_lang, verbose)
        
        if verbose:
            print(f"\n{'='*60}")
            print(f"Verification complete: {successful} passed, {failed} failed")
            print(f"{'='*60}")
        
        return 0 if failed == 0 else 1
    
    # Single file mode
    else:
        if not args.original_file or not args.translated_file:
            print("Error: original_file and translated_file required", file=sys.stderr)
            parser.print_help()
            return 1
        
        success, details = verify_files(args.original_file, args.translated_file, verbose)
        
        return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
