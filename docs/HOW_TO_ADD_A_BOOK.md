# How to Add a New Book to VIA Fabula

This guide explains how to add a new book to the VIA Fabula language learning platform.

## Overview

VIA Fabula is a Progressive Web App (PWA) that helps users learn languages through reading stories at various difficulty levels. Books are organized by:
- **Chapters** - Sections of the story
- **Languages** - Available translations (e.g., English, Spanish, German)
- **Levels** - CEFR-based reading difficulty (A0 to C2, plus native and original)

## Step-by-Step Guide

### Step 1: Create the Folder Structure

Create a new folder for your book under `content/books/`:

```
content/books/<your_book_id>/
└── chapters/
    ├── 00_intro/
    │   ├── english/
    │   │   ├── a0.md
    │   │   ├── a1.md
    │   │   ├── a2.md
    │   │   ├── b1.md
    │   │   ├── b2.md
    │   │   ├── c1.md
    │   │   ├── c2.md
    │   │   ├── native.md
    │   │   └── original.md
    │   └── spanish/
    │       ├── a0.md
    │       └── ... (other levels)
    ├── 01_chapter_one/
    │   └── ...
    └── 02_chapter_two/
        └── ...
```

**Naming conventions:**
- Use underscores for spaces in folder names (e.g., `The_Little_Prince`)
- Chapter IDs should be prefixed with numbers for ordering (e.g., `00_`, `01_`, `02_`)
- Language IDs should be lowercase (e.g., `english`, `spanish`, `german`)
- Level files should match the level ID (e.g., `a0.md`, `b1.md`, `native.md`)

### Step 2: Create Content Files (Markdown)

Each `.md` file contains the chapter text at that specific reading level.

**Example `a0.md` (beginner level):**
```markdown
# Chapter 1: The Beginning

Hello. My name is Maria.
I live in a small house.
The house is old but nice.
I like my house.
```

**Example `c2.md` (advanced level):**
```markdown
# Chapter 1: The Beginning

In the picturesque village of San Miguel, nestled between undulating hills and a meandering river, stood an unassuming dwelling that harbored countless generations of memories. Maria, its current inhabitant, possessed an inexplicable attachment to its weathered walls and creaking floorboards, finding solace in its timeless embrace despite its evident antiquity.
```

**Level Guidelines (CEFR):**
| Level | Description | Vocabulary | Sentences |
|-------|-------------|-----------|-----------|
| A0 | Pre-beginner | ~100 words | Very simple, short |
| A1 | Beginner | ~500 words | Simple present tense |
| A2 | Elementary | ~1000 words | Past tense, questions |
| B1 | Intermediate | ~2000 words | Complex sentences |
| B2 | Upper-intermediate | ~4000 words | Idiomatic expressions |
| C1 | Advanced | ~8000 words | Abstract topics |
| C2 | Proficient | ~16000 words | Near-native complexity |
| native | Modern native text | Unrestricted | Natural modern writing |
| original | Original work | As written | The original author's text |

### Step 3: Update the Content Index

Open `content-index.json` and add your book entry to the `books` array:

```json
{
  "books": [
    // ... existing books ...
    {
      "id": "the_little_prince",
      "title": "The Little Prince",
      "chapters": [
        {
          "id": "00_dedication",
          "title": "00 Dedication",
          "languages": [
            {
              "id": "english",
              "title": "English",
              "levels": [
                {
                  "id": "a0",
                  "title": "A0",
                  "path": "content/books/the_little_prince/chapters/00_dedication/english/a0.md"
                },
                {
                  "id": "a1",
                  "title": "A1",
                  "path": "content/books/the_little_prince/chapters/00_dedication/english/a1.md"
                }
                // ... add all levels you have content for
              ]
            },
            {
              "id": "french",
              "title": "French",
              "levels": [
                {
                  "id": "original",
                  "title": "Original",
                  "path": "content/books/the_little_prince/chapters/00_dedication/french/original.md"
                }
                // ... other levels
              ]
            }
          ]
        },
        {
          "id": "01_chapter_one",
          "title": "01 Chapter One",
          "languages": [
            // ... same structure as above
          ]
        }
      ]
    }
  ]
}
```

**Important Notes:**
- The `path` must exactly match your file location
- All paths are relative to the repository root
- The `id` fields are used for internal state management
- The `title` fields are displayed in the UI

### Step 4: Optional - Add Comprehension Questions

You can add reading comprehension questions for each level. Create a JSON file alongside the markdown file:

For `content/books/my_book/chapters/01_intro/english/a0.md`, create:
`content/books/my_book/chapters/01_intro/english/a0_q.json`

```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What is the main character's name?",
      "options": ["Maria", "Juan", "Pedro", "Ana"],
      "correctIndex": 0
    },
    {
      "id": "q2",
      "question": "Where does Maria live?",
      "options": ["A big city", "A small house", "An apartment", "A castle"],
      "correctIndex": 1
    }
  ]
}
```

### Step 5: Test Your Changes

1. Open `index.html` in a web browser (or use a local server)
2. Open the sidebar menu
3. Select your book from the "Story" dropdown
4. Navigate through chapters and levels
5. Verify all content loads correctly

## Quick Reference

### Minimal Book Structure

The absolute minimum to add a book:

1. **One markdown file:** `content/books/my_book/chapters/01_intro/english/a0.md`

2. **One entry in content-index.json:**
```json
{
  "id": "my_book",
  "title": "My Book",
  "chapters": [
    {
      "id": "01_intro",
      "title": "01 Introduction",
      "languages": [
        {
          "id": "english",
          "title": "English",
          "levels": [
            {
              "id": "a0",
              "title": "A0",
              "path": "content/books/my_book/chapters/01_intro/english/a0.md"
            }
          ]
        }
      ]
    }
  ]
}
```

### Supported Languages

While you can add any language, these are commonly used in the existing content:
- `english` - English
- `spanish` - Spanish
- `german` - German

### Tips

- Start with just a few levels (e.g., A0, B1, original) and expand later
- Use AI tools to help generate level-appropriate adaptations
- Keep the `original` level for the actual source text
- The `native` level should be modern, natural-sounding text
- Test on mobile devices as this is a PWA designed for mobile reading

## Troubleshooting

**Book doesn't appear in dropdown:**
- Check that `content-index.json` has valid JSON syntax
- Verify the book entry is inside the `books` array

**Content doesn't load:**
- Check the `path` in `content-index.json` matches the actual file location
- Ensure markdown files exist and are not empty
- Check browser console for 404 errors

**Levels not switching correctly:**
- Verify all `id` fields are unique within their scope
- Check that level paths point to existing files
