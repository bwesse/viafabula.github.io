# Translation Scripts

This directory contains scripts for translating markdown files while preserving paragraph structure.

## Available Scripts

### 1. `translate_markdown.py` - Multi-backend Translation Script

Main translation script that supports multiple backends:
- **OpenAI** (GPT-3.5/GPT-4) - Best quality, requires API key
- **Google Translate** - Free, requires internet connection
- **Mock** - For testing without external APIs

#### Installation

```bash
# Install required packages
pip install deep-translator  # For Google Translate backend
pip install openai           # For OpenAI backend
```

#### Usage Examples

```bash
# Translate a single file using Google Translate (free)
python3 translate_markdown.py input.md output.md --target-lang es --backend google

# Translate a single file using OpenAI (best quality)
export OPENAI_API_KEY=your_key_here
python3 translate_markdown.py input.md output.md --target-lang es --backend openai

# Translate a chapter to multiple languages
python3 translate_markdown.py \
  --chapter-mode \
  --chapter-path ./content/books/Morocco/general/01_Geography \
  --languages es,de \
  --backend google

# Batch translate all chapters in a book
python3 translate_markdown.py \
  --batch \
  --base-path ./content/books/Morocco/general \
  --languages es,de,fr \
  --backend openai
```

### 2. `translate_with_llm.py` - LLM-Optimized Translation

Optimized translation script that uses LLM (OpenAI GPT-4) for high-quality translations.
Translates in batches for efficiency.

#### Usage

```bash
# Set your API key
export OPENAI_API_KEY=your_key_here

# Translate a chapter
python3 translate_with_llm.py \
  --chapter-path ./content/books/Morocco/general/01_Geography \
  --languages es,de
```

## Translation Backends

### OpenAI (Recommended for Quality)

**Pros:**
- Highest translation quality
- Preserves context and nuance
- Best handling of markdown formatting
- Can batch translate paragraphs efficiently

**Cons:**
- Requires API key (paid service)
- Costs money per translation

**Setup:**
```bash
export OPENAI_API_KEY=sk-...your-key-here...
```

### Google Translate (Free Option)

**Pros:**
- Completely free
- No API key required
- Fast

**Cons:**
- Requires internet connection
- May struggle with markdown formatting
- Lower quality for complex texts
- Rate limits

**Setup:**
```bash
pip install deep-translator
```

## Features

All scripts preserve:
- ✅ Markdown headers (# ## ###)
- ✅ Bold and italic formatting (** __)
- ✅ Lists (- * 1.)
- ✅ Code blocks
- ✅ Links and images
- ✅ Paragraph structure (each paragraph maps 1:1)

## File Structure

The scripts expect and maintain this structure:

```
chapter/
├── english/
│   └── original/
│       └── original.md    (source)
├── spanish/
│   └── original/
│       └── original.md    (translated)
├── german/
│   └── original/
│       └── original.md    (translated)
└── french/
    └── original/
        └── original.md    (translated)
```

## Quality Verification

After translation, verify:

1. **Paragraph count matches**: Original and translated files should have the same number of paragraphs
2. **Markdown formatting preserved**: Headers, lists, etc. should remain intact
3. **Language quality**: Review a few paragraphs to ensure natural-sounding translation
4. **No missing content**: Check that all sections were translated

## Troubleshooting

### "No module named 'deep_translator'"
```bash
pip install deep-translator
```

### "OPENAI_API_KEY environment variable not set"
```bash
export OPENAI_API_KEY=your_key_here
```

### "Failed to resolve 'translate.google.com'"
- Ensure you have internet connection
- Google Translate may be blocked in your network
- Try using OpenAI backend instead

### Translation quality issues
- Try using OpenAI backend instead of Google Translate
- For OpenAI, use GPT-4 instead of GPT-3.5 for better quality
- Review and manually edit problematic paragraphs

## Best Practices

1. **Start with one chapter**: Test the translation on a single chapter first
2. **Verify manually**: Always review translations for quality
3. **Use version control**: Commit before running batch translations
4. **Backup**: Keep backup of original files
5. **Batch wisely**: Don't translate everything at once - do it in chunks and verify

## Cost Estimation (OpenAI)

- GPT-3.5-turbo: ~$0.001-0.002 per 1000 tokens
- GPT-4: ~$0.03-0.06 per 1000 tokens

A typical chapter (100 paragraphs, ~5000 words):
- GPT-3.5: ~$0.05-0.10
- GPT-4: ~$1.50-3.00

Batch translating an entire book to 3 languages:
- GPT-3.5: ~$5-10
- GPT-4: ~$150-300
