# VIA Fabula - Language Learning Through Stories

A Progressive Web App (PWA) for language learning via graded reading. Read classic stories and fables adapted to your reading level, from beginner (A0) to advanced (C2).

## Features

- 📚 **Multiple Books** - Classic literature and fables available for reading
- 🌍 **Multiple Languages** - English, Spanish, German, and more
- 📊 **CEFR Levels** - Content graded from A0 (pre-beginner) to C2 (proficient), plus native and original texts
- 📱 **Offline Support** - PWA with offline caching for reading anywhere
- ❓ **Comprehension Questions** - Optional quizzes to test understanding

## Books Available

- **Moby Dick** - Herman Melville's classic tale
- **The Tortoise and the Hare** - Aesop's famous fable

## Quick Start

1. Open `index.html` in a web browser
2. Use the sidebar menu to select a book, chapter, language, and level
3. Read and learn!

## Adding New Content

Want to add a new book or story? See our detailed guide:
**[How to Add a New Book](docs/HOW_TO_ADD_A_BOOK.md)**

## Project Structure

```
├── index.html           # Main PWA application
├── content-index.json   # Master index of all books/chapters/levels
├── content/
│   └── books/           # Book content organized by book/chapter/language/level
├── docs/
│   └── HOW_TO_ADD_A_BOOK.md  # Guide for adding new books
├── sw.js                # Service worker for offline support
└── manifest.json        # PWA manifest
```

## Contributing

Contributions are welcome! You can:
- Add new books or fables
- Translate existing content to new languages
- Create new reading level adaptations
- Add comprehension questions
