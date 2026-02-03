#!/usr/bin/env python3
"""
AI-Powered Markdown Translation Script

This script translates markdown files while preserving paragraph structure.
It supports multiple translation backends:
- OpenAI GPT (recommended for quality)
- Google Translate (free, requires internet)
- Mock mode (for testing without API)

Usage:
    # Translate using OpenAI (requires OPENAI_API_KEY env variable)
    python3 translate_markdown.py input.md output.md --target-lang es --backend openai
    
    # Translate using Google Translate (free, requires internet)
    python3 translate_markdown.py input.md output.md --target-lang es --backend google
    
    # Translate a chapter to multiple languages
    python3 translate_markdown.py --chapter-mode --chapter-path ./path/to/chapter --languages es,de
    
    # Batch translate all chapters
    python3 translate_markdown.py --batch --base-path ./content/books/Morocco/general
"""

import argparse
import os
import re
import sys
import time
from pathlib import Path
from typing import List, Tuple

# Optional imports based on backend
try:
    from deep_translator import GoogleTranslator
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


def split_into_paragraphs(text: str) -> List[str]:
    """
    Split markdown text into paragraphs, preserving structure.
    
    A paragraph is defined as text separated by blank lines.
    Headings, code blocks, and other markdown elements are treated as paragraphs.
    """
    # Split on double newlines (blank lines)
    paragraphs = re.split(r'\n\n+', text)
    return [p.strip() for p in paragraphs if p.strip()]


def translate_text_openai(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text using OpenAI GPT."""
    if not OPENAI_AVAILABLE:
        raise ImportError("OpenAI library not installed. Install with: pip install openai")
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    client = openai.OpenAI(api_key=api_key)
    
    lang_names = {
        'en': 'English', 'es': 'Spanish', 'de': 'German', 'fr': 'French',
        'english': 'English', 'spanish': 'Spanish', 'german': 'German', 'french': 'French'
    }
    
    source_name = lang_names.get(source_lang, source_lang)
    target_name = lang_names.get(target_lang, target_lang)
    
    prompt = f"""Translate the following {source_name} text to {target_name}.
Preserve all markdown formatting exactly (headers, bold, italic, lists, etc.).
Maintain the same structure and formatting.
Only provide the translation, no explanations.

Text to translate:
{text}"""
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    return response.choices[0].message.content.strip()


def translate_text_google(text: str, source_lang: str, target_lang: str, max_retries: int = 3) -> str:
    """Translate text using Google Translate."""
    if not GOOGLE_AVAILABLE:
        raise ImportError("deep-translator library not installed. Install with: pip install deep-translator")
    
    if not text.strip():
        return text
    
    # Map full names to codes
    lang_codes = {
        'english': 'en', 'spanish': 'es', 'german': 'de', 'french': 'fr'
    }
    src_code = lang_codes.get(source_lang, source_lang)
    tgt_code = lang_codes.get(target_lang, target_lang)
    
    for attempt in range(max_retries):
        try:
            translator = GoogleTranslator(source=src_code, target=tgt_code)
            
            # Split into chunks if text is too long (Google Translate has a 5000 char limit)
            max_length = 4500
            if len(text) <= max_length:
                result = translator.translate(text)
                time.sleep(0.5)  # Rate limiting
                return result
            else:
                # Split into sentences for large texts
                sentences = re.split(r'([.!?]\s+)', text)
                translated_parts = []
                current_chunk = ""
                
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) <= max_length:
                        current_chunk += sentence
                    else:
                        if current_chunk:
                            translated_parts.append(translator.translate(current_chunk))
                            time.sleep(0.5)
                        current_chunk = sentence
                
                if current_chunk:
                    translated_parts.append(translator.translate(current_chunk))
                
                return ''.join(translated_parts)
                
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Translation attempt {attempt + 1} failed: {e}. Retrying...", file=sys.stderr)
                time.sleep(2)
            else:
                raise


def translate_text_mock(text: str, source_lang: str, target_lang: str) -> str:
    """
    Mock translation for testing without API.
    Adds language prefix to demonstrate structure preservation.
    """
    # Map language codes
    lang_prefixes = {
        'es': '[ES]', 'spanish': '[ES]',
        'de': '[DE]', 'german': '[DE]',
        'fr': '[FR]', 'french': '[FR]'
    }
    
    prefix = lang_prefixes.get(target_lang, f'[{target_lang.upper()}]')
    
    # For mock mode, just add a prefix to show it worked
    # In production, this would not be used
    if text.startswith('#'):
        # Keep headers as-is but add prefix after
        return text.replace('\n', f'\n{prefix} ', 1) if '\n' in text else f"{text} {prefix}"
    
    return f"{prefix} {text}"


def translate_text(text: str, source_lang: str, target_lang: str, backend: str = 'google') -> str:
    """
    Translate text using the specified backend.
    
    Args:
        text: Text to translate
        source_lang: Source language code (e.g., 'en')
        target_lang: Target language code (e.g., 'es', 'de')
        backend: Translation backend ('openai', 'google', or 'mock')
        
    Returns:
        Translated text
    """
    if not text.strip():
        return text
    
    try:
        if backend == 'openai':
            return translate_text_openai(text, source_lang, target_lang)
        elif backend == 'google':
            return translate_text_google(text, source_lang, target_lang)
        elif backend == 'mock':
            return translate_text_mock(text, source_lang, target_lang)
        else:
            raise ValueError(f"Unknown backend: {backend}")
    except Exception as e:
        print(f"Translation failed: {e}", file=sys.stderr)
        print(f"Returning original text for paragraph", file=sys.stderr)
        return text  # Return original text if translation fails


def translate_markdown_file(input_path: str, output_path: str, source_lang: str = 'en', 
                           target_lang: str = 'es', backend: str = 'google', verbose: bool = True) -> bool:
    """
    Translate a markdown file while preserving paragraph structure.
    
    Args:
        input_path: Path to input markdown file
        output_path: Path to output markdown file
        source_lang: Source language code
        target_lang: Target language code
        backend: Translation backend ('openai', 'google', or 'mock')
        verbose: Print progress messages
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Read input file
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if verbose:
            print(f"Translating {input_path} from {source_lang} to {target_lang} using {backend}...")
        
        # Split into paragraphs
        paragraphs = split_into_paragraphs(content)
        
        if verbose:
            print(f"Found {len(paragraphs)} paragraphs to translate")
        
        # Translate each paragraph
        translated_paragraphs = []
        for i, paragraph in enumerate(paragraphs):
            if verbose and (i + 1) % 5 == 0:
                print(f"Translating paragraph {i + 1}/{len(paragraphs)}...")
            
            translated = translate_text(paragraph, source_lang, target_lang, backend)
            translated_paragraphs.append(translated)
        
        # Join paragraphs with double newlines
        translated_content = '\n\n'.join(translated_paragraphs)
        
        # Ensure file ends with a newline
        if not translated_content.endswith('\n'):
            translated_content += '\n'
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Write output file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(translated_content)
        
        if verbose:
            print(f"Translation complete: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"Error translating file: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def translate_chapter(base_chapter_path: str, languages: List[str], source_lang: str = 'en',
                     backend: str = 'google', verbose: bool = True) -> Tuple[int, int]:
    """
    Translate a chapter to multiple target languages.
    
    Args:
        base_chapter_path: Path to the chapter directory (e.g., .../01_Geography)
        languages: List of target language codes (e.g., ['es', 'de'])
        source_lang: Source language code
        backend: Translation backend
        verbose: Print progress messages
        
    Returns:
        Tuple of (successful_count, failed_count)
    """
    successful = 0
    failed = 0
    
    # Map language codes to directory names
    lang_dir_map = {
        'en': 'english',
        'es': 'spanish', 
        'de': 'german',
        'fr': 'french',
        'english': 'english',
        'spanish': 'spanish',
        'german': 'german',
        'french': 'french'
    }
    
    source_dir = lang_dir_map.get(source_lang, source_lang)
    
    # Find the source file
    source_file = os.path.join(base_chapter_path, source_dir, 'original', 'original.md')
    
    if not os.path.exists(source_file):
        print(f"Source file not found: {source_file}", file=sys.stderr)
        return 0, 1
    
    # Check if source file has content (not just "todo")
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read().strip()
        if content.lower() == 'todo' or len(content) < 10:
            if verbose:
                print(f"Skipping {source_file} - no content to translate")
            return 0, 0
    
    for target_lang in languages:
        target_dir = lang_dir_map.get(target_lang, target_lang)
        target_file = os.path.join(base_chapter_path, target_dir, 'original', 'original.md')
        
        if verbose:
            print(f"\n{'='*60}")
            print(f"Translating chapter to {target_lang}")
            print(f"{'='*60}")
        
        if translate_markdown_file(source_file, target_file, source_lang, target_lang, backend, verbose):
            successful += 1
        else:
            failed += 1
    
    return successful, failed


def main():
    parser = argparse.ArgumentParser(
        description='Translate markdown files while preserving paragraph structure',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Translate a single file to Spanish
  %(prog)s input.md output.md --target-lang es
  
  # Translate a chapter to multiple languages
  %(prog)s --chapter-mode --chapter-path ./content/books/Morocco/general/01_Geography --languages es,de
  
  # Batch translate all chapters in a book
  %(prog)s --batch --base-path ./content/books/Morocco/general --languages es,de
        """
    )
    
    parser.add_argument('input_file', nargs='?', help='Input markdown file')
    parser.add_argument('output_file', nargs='?', help='Output markdown file')
    parser.add_argument('--source-lang', default='en', help='Source language code (default: en)')
    parser.add_argument('--target-lang', help='Target language code (e.g., es, de, fr)')
    parser.add_argument('--chapter-mode', action='store_true', 
                       help='Translate a chapter to multiple languages')
    parser.add_argument('--chapter-path', help='Path to chapter directory')
    parser.add_argument('--batch', action='store_true',
                       help='Batch translate all chapters in a base path')
    parser.add_argument('--base-path', help='Base path for batch translation')
    parser.add_argument('--languages', help='Comma-separated list of target languages (e.g., es,de,fr)')
    parser.add_argument('--backend', default='google', 
                       choices=['google', 'openai', 'mock'],
                       help='Translation backend (default: google)')
    parser.add_argument('--verbose', action='store_true', default=True, help='Print progress messages')
    parser.add_argument('--quiet', action='store_true', help='Suppress progress messages')
    
    args = parser.parse_args()
    
    verbose = args.verbose and not args.quiet
    
    # Parse languages
    languages = []
    if args.languages:
        languages = [lang.strip() for lang in args.languages.split(',')]
    elif args.target_lang:
        languages = [args.target_lang]
    
    # Batch mode
    if args.batch:
        if not args.base_path:
            print("Error: --base-path required for batch mode", file=sys.stderr)
            return 1
        
        if not languages:
            print("Error: --languages required for batch mode", file=sys.stderr)
            return 1
        
        base_path = args.base_path
        if not os.path.exists(base_path):
            print(f"Error: Base path does not exist: {base_path}", file=sys.stderr)
            return 1
        
        # Find all chapter directories
        chapter_dirs = [d for d in os.listdir(base_path) 
                       if os.path.isdir(os.path.join(base_path, d))]
        chapter_dirs.sort()
        
        total_successful = 0
        total_failed = 0
        
        for chapter_dir in chapter_dirs:
            chapter_path = os.path.join(base_path, chapter_dir)
            if verbose:
                print(f"\n{'='*60}")
                print(f"Processing chapter: {chapter_dir}")
                print(f"{'='*60}")
            
            successful, failed = translate_chapter(chapter_path, languages, args.source_lang, args.backend, verbose)
            total_successful += successful
            total_failed += failed
        
        if verbose:
            print(f"\n{'='*60}")
            print(f"Batch translation complete!")
            print(f"Successful: {total_successful}, Failed: {total_failed}")
            print(f"{'='*60}")
        
        return 0 if total_failed == 0 else 1
    
    # Chapter mode
    elif args.chapter_mode:
        if not args.chapter_path:
            print("Error: --chapter-path required for chapter mode", file=sys.stderr)
            return 1
        
        if not languages:
            print("Error: --languages required for chapter mode", file=sys.stderr)
            return 1
        
        successful, failed = translate_chapter(args.chapter_path, languages, args.source_lang, args.backend, verbose)
        
        if verbose:
            print(f"\nTranslation complete! Successful: {successful}, Failed: {failed}")
        
        return 0 if failed == 0 else 1
    
    # Single file mode
    else:
        if not args.input_file or not args.output_file:
            print("Error: input_file and output_file required for single file mode", file=sys.stderr)
            parser.print_help()
            return 1
        
        if not args.target_lang:
            print("Error: --target-lang required for single file mode", file=sys.stderr)
            return 1
        
        success = translate_markdown_file(
            args.input_file, 
            args.output_file,
            args.source_lang,
            args.target_lang,
            args.backend,
            verbose
        )
        
        return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
