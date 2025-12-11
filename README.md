# ViaFabula — Multilingual, Leveled Stories with Audio

ViaFabula is a lightweight reader and content pipeline for short stories that can be explored across languages and difficulty levels. The goal is to make it easy to compare phrasing, listen along, and move up from A0 to native-level texts without needing a heavy app or paid service.

## Mission and Motivation
- **Accessible language growth:** Provide bite-sized stories in multiple languages and CEFR-like levels (A0–C2, plus native/original) so learners can step up gradually.
- **Hearing and reading together:** Pair every passage with generated audio so learners can shadow, check pronunciation, or switch between silent and audio modes.
- **Device-friendly:** Ship as a static site/PWA that works offline once cached, so it runs well on low-end devices or shared computers.
- **Creator-friendly:** Keep content in plain text/Markdown with simple folder conventions, making it easy to add or translate stories without special tooling.

## How it Works (High Level)
- **Reader UI (PWA):** `index.html` loads stories from `content/` and lets you switch language, level, and chapters. Audio controls are integrated into the reader.
- **Content model:** Each book has chapters; each chapter has language folders (`english`, `spanish`, `german`, …). Within a language, leveled files live either directly under the language folder or in `<level>/` subfolders (e.g., `a0/a0.md`).
- **Audio pipeline:** Text is converted to `.wav` files via Piper TTS. One Piper HTTP server runs per language; the helper script maps languages to ports and writes audio next to the text files.
- **Static assets:** Everything runs client-side with no backend. Service worker (`sw.js`) supports offline caching.

## Repository Layout
- `index.html`, `converter.js`, `converter.css`, `manifest.json`, `sw.js` — the PWA front end.
- `content/` — stories and audio organized by book → chapter → language → level.
- `models/` — local Piper voice models (place your `.onnx` and `.json` files here).
- `scripts/generate_tts_piper.py` — generate `.wav` files from text using running Piper servers.
- `scripts/clean_wav.py` — clean up generated audio by date or in bulk.

## Getting Started
1) **Install Python dependencies**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install piper-tts mediapipe opencv-python playsound requests
   ```
   List available voices:
   ```bash
   python3 -m piper.download_voices
   ```
   Download a voice (example):
   ```bash
   python3 -m piper.download_voices en_US-lessac-medium
   ```

2) **Run Piper HTTP servers (one per language)**
   - Place the downloaded model files under `models/`.
   - Start a server per language/voice, binding to the ports expected by the script:
     - English → `http://127.0.0.1:5001`
     - Spanish → `http://127.0.0.1:5002`
     - German  → `http://127.0.0.1:5003`
   - Consult the Piper docs for the exact `piper`/`piper_server` command for your platform, pointing each server at the appropriate model.

3) **Generate audio**
   ```bash
   # From the repo root
   python scripts/generate_tts_piper.py --root content/books
   # Overwrite existing WAVs if needed
   python scripts/generate_tts_piper.py --root content/books --force
   ```
   The script walks books/chapters, finds `*.md` or `*.txt` per level, and writes `<level>.wav` next to each text file.

4) **Preview the reader**
   - Open `index.html` directly in a browser, or run a simple static server, e.g.:
     ```bash
     python -m http.server 8000
     ```
   - Add to home screen to test PWA/offline behavior.

## Using the Reader
- Choose a book and chapter from the sidebar.
- Switch **Language** to compare translations side-by-side over time.
- Step through **Levels** (A0 → native/original) to see progressively richer phrasing.
- Toggle **Audio** to play the generated narration for the current passage.

## Contributing Content
- Add a new book under `content/books/<Book_Name>/`.
- For each chapter, create language folders (`english`, `spanish`, `german`, …).
- Within a language, add leveled text as either:
  - `<language>/<level>.md` or `.txt`, or
  - `<language>/<level>/<level>.md` (and matching `.wav` after synthesis).
- Keep passages concise and aligned across levels to help learners compare.

## Maintenance Scripts
- **Generate audio:** `scripts/generate_tts_piper.py` (requires running Piper servers).
- **Clean audio:** `scripts/clean_wav.py --root content/books --since 2025-01-01 --really-delete` to prune generated `.wav` files by date or in bulk.

## Future Goals
- Add more voices/languages and allow per-chapter voice selection.
- Ship pre-generated audio alongside content for fully offline use.
- Build a content validator to catch missing levels or mismatched filenames.
- Improve in-browser audio controls (looping, sentence-level playback).
- Add progress tracking and lightweight quizzes for comprehension checks.

## Project Values
- Keep everything transparent and editable (plain text, open formats).
- Favor offline-first and low-resource usage.
- Prioritize learner empathy: short sessions, clear controls, and gentle difficulty ramps.
