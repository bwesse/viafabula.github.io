#!/usr/bin/env python3
"""
LLM-Powered Markdown Translation Script

This script uses an LLM (via API call) to translate markdown files
while preserving paragraph structure and quality.

Usage:
    export OPENAI_API_KEY=your_key_here
    python3 translate_with_llm.py --chapter-path ./path/to/chapter --languages es,de
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Tuple

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


def split_into_paragraphs(text: str) -> List[str]:
    """Split markdown text into paragraphs, preserving structure."""
    paragraphs = re.split(r'\n\n+', text)
    return [p.strip() for p in paragraphs if p.strip()]


def translate_paragraphs_batch(paragraphs: List[str], source_lang: str, target_lang: str) -> List[str]:
    """Translate multiple paragraphs in a single API call."""
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
    
    # Create numbered paragraphs for easy matching
    numbered_text = "\n\n".join(f"[{i}] {p}" for i, p in enumerate(paragraphs))
    
    prompt = f"""Translate the following {source_name} text to {target_name}.

IMPORTANT INSTRUCTIONS:
1. Preserve ALL markdown formatting exactly (headers #, ##, bold **, italic *, lists -, etc.)
2. Maintain the exact same structure and number of paragraphs
3. Keep the [NUMBER] prefix for each paragraph so we can match them
4. Only provide the translation, no explanations or additional text
5. Ensure high-quality, natural-sounding translation
6. Keep proper names (like Morocco, Atlas, etc.) as-is or use standard translations

Text to translate:

{numbered_text}"""
    
    response = client.chat.completions.create(
        model="gpt-4",  # Using GPT-4 for best quality
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    translated_text = response.choices[0].message.content.strip()
    
    # Extract translated paragraphs
    translated_paragraphs = []
    for i in range(len(paragraphs)):
        # Find the paragraph with this number
        pattern = rf'\[{i}\]\s*(.*?)(?=\n\n\[{i+1}\]|\Z)'
        match = re.search(pattern, translated_text, re.DOTALL)
        if match:
            translated_paragraphs.append(match.group(1).strip())
        else:
            # Fallback: use original if translation failed
            print(f"Warning: Could not find translation for paragraph {i}, using original", file=sys.stderr)
            translated_paragraphs.append(paragraphs[i])
    
    return translated_paragraphs


def translate_file(input_path: str, output_path: str, source_lang: str, target_lang: str):
    """Translate a markdown file."""
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"Translating {input_path} from {source_lang} to {target_lang}...")
    
    paragraphs = split_into_paragraphs(content)
    print(f"Found {len(paragraphs)} paragraphs")
    
    # Translate in batches to avoid token limits
    batch_size = 10
    all_translated = []
    
    for i in range(0, len(paragraphs), batch_size):
        batch = paragraphs[i:i+batch_size]
        print(f"Translating paragraphs {i+1}-{min(i+batch_size, len(paragraphs))}...")
        translated_batch = translate_paragraphs_batch(batch, source_lang, target_lang)
        all_translated.extend(translated_batch)
    
    # Join paragraphs
    translated_content = '\n\n'.join(all_translated) + '\n'
    
    # Write output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(translated_content)
    
    print(f"Translation complete: {output_path}")


def translate_chapter(chapter_path: str, languages: List[str], source_lang: str = 'en'):
    """Translate a chapter to multiple languages."""
    lang_dir_map = {
        'en': 'english', 'es': 'spanish', 'de': 'german', 'fr': 'french',
        'english': 'english', 'spanish': 'spanish', 'german': 'german', 'french': 'french'
    }
    
    source_dir = lang_dir_map.get(source_lang, source_lang)
    source_file = os.path.join(chapter_path, source_dir, 'original', 'original.md')
    
    if not os.path.exists(source_file):
        print(f"Source file not found: {source_file}", file=sys.stderr)
        return
    
    # Check if source has content
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read().strip()
        if content.lower() == 'todo' or len(content) < 10:
            print(f"Skipping {source_file} - no content")
            return
    
    for target_lang in languages:
        target_dir = lang_dir_map.get(target_lang, target_lang)
        target_file = os.path.join(chapter_path, target_dir, 'original', 'original.md')
        
        print(f"\n{'='*60}")
        print(f"Translating to {target_lang}")
        print(f"{'='*60}")
        
        translate_file(source_file, target_file, source_lang, target_lang)


def main():
    parser = argparse.ArgumentParser(description='Translate markdown files using LLM')
    parser.add_argument('--chapter-path', required=True, help='Path to chapter directory')
    parser.add_argument('--languages', required=True, help='Comma-separated target languages (e.g., es,de)')
    parser.add_argument('--source-lang', default='en', help='Source language (default: en)')
    
    args = parser.parse_args()
    
    languages = [lang.strip() for lang in args.languages.split(',')]
    translate_chapter(args.chapter_path, languages, args.source_lang)


if __name__ == '__main__':
    main()
