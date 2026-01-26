# Morocco Book - Quick Reference Guide

## 📍 Location
```
/home/runner/work/viafabula.github.io/viafabula.github.io/content/books/Morocco/
```

## 📚 What Was Created

### Complete Book Structure
- **12 Chapters** covering different Moroccan cities
- **4 Languages** (English, Spanish, German, French)
- **9 CEFR Levels** per language (a0, a1, a2, b1, b2, c1, c2, native, original)
- **2,161 Total Files**

### Files Per Level Directory
Each level directory contains 5 files:
1. `[level].md` - Story content
2. `[level]_q.json` - Comprehension questions (3 questions with 3 options each)
3. `[level].json` - Metadata placeholder (empty)
4. `[level].mp3` - Audio placeholder (empty)
5. `[level].wav` - Audio placeholder (empty)

## 🗺️ Chapters

| # | Folder Name | City | Description |
|---|-------------|------|-------------|
| 00 | 00_intro | Introduction | Overview of Morocco |
| 01 | 01_Marrakesh | Marrakesh | The vibrant heart of Morocco |
| 02 | 02_Fez | Fez | Cultural and spiritual capital |
| 03 | 03_Casablanca | Casablanca | Cosmopolitan economic hub |
| 04 | 04_Rabat | Rabat | The elegant capital |
| 05 | 05_Tangier | Tangier | Gateway between Africa and Europe |
| 06 | 06_Chefchaouen | Chefchaouen | The blue pearl |
| 07 | 07_Agadir | Agadir | Premier beach resort |
| 08 | 08_Merzouga | Merzouga | Gateway to the Sahara |
| 09 | 09_Essaouira | Essaouira | Charming coastal town |
| 10 | 10_Meknes | Meknes | The imperial city |
| 11 | 11_Ouarzazate | Ouarzazate | Hollywood of Morocco |

## 🌍 Languages

| Code | Language | Native Name |
|------|----------|-------------|
| english | English | English |
| spanish | Spanish | Español |
| german | German | Deutsch |
| french | French | Français |

## 📊 CEFR Levels & Word Counts

| Level | Name | Target Words | Complexity |
|-------|------|--------------|------------|
| a0 | Beginner | ~100 | Very simple sentences, present tense |
| a1 | Elementary | ~500 | Simple sentences, basic past tense |
| a2 | Pre-Intermediate | ~1000 | More complex sentences, questions |
| b1 | Intermediate | ~2000 | Complex sentences, various tenses |
| b2 | Upper-Intermediate | ~4000 | Idiomatic expressions, nuanced language |
| c1 | Advanced | ~8000 | Abstract topics, sophisticated language |
| c2 | Proficiency | ~16000 | Near-native complexity |
| native | Native | Variable | Modern, natural-sounding text |
| original | Original | Variable | Original version (same as native) |

## 📝 Content Quality

### Enhanced Stories (Higher Quality)
- **Marrakesh (English)**: A2, B1, B2 levels have detailed, engaging narratives
- **Fez (English)**: A2 level has a cultural exploration story

### Standard Stories (Good Quality)
- All other chapters and languages have appropriate level-based content
- A0 and A1 levels are fully developed for all chapters/languages

## 🔍 Example File Paths

```
Morocco/01_Marrakesh/english/a0/a0.md
Morocco/02_Fez/spanish/b1/b1_q.json
Morocco/06_Chefchaouen/german/c2/c2.wav
Morocco/08_Merzouga/french/native/native.md
```

## ✅ Verification Commands

### Count all files:
```bash
find /home/runner/work/viafabula.github.io/viafabula.github.io/content/books/Morocco -type f | wc -l
```

### View a story:
```bash
cat /home/runner/work/viafabula.github.io/viafabula.github.io/content/books/Morocco/01_Marrakesh/english/a1/a1.md
```

### Check questions:
```bash
cat /home/runner/work/viafabula.github.io/viafabula.github.io/content/books/Morocco/02_Fez/spanish/b2/b2_q.json
```

### List all chapters:
```bash
ls /home/runner/work/viafabula.github.io/viafabula.github.io/content/books/Morocco/
```

## 📋 Question Format

Each `*_q.json` file follows this structure:
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": [
        "Correct answer",
        "Wrong answer 1",
        "Wrong answer 2"
      ],
      "correctIndex": 0
    },
    {
      "id": "q2",
      "question": "...",
      "options": ["...", "...", "..."],
      "correctIndex": 0
    },
    {
      "id": "q3",
      "question": "...",
      "options": ["...", "...", "..."],
      "correctIndex": 0
    }
  ]
}
```

## 🎯 Matches Existing Books

This structure exactly matches:
- The_Tortoise_and_the_Hare
- Frankenstein
- mobby_dick
- ben_robin_wesse

## 🚀 Ready to Use!

All files are in place and ready for the VIA Fabula platform!
