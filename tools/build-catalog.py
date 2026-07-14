#!/usr/bin/env python3
"""Build VIA Fabula's explicit browser catalogue from canonical metadata."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ITEMS_ROOT = ROOT / "content" / "items"
CATALOG_PATH = ROOT / "content" / "catalog.json"
LANGUAGE_TITLES = {"de": "German", "en": "English", "es": "Spanish", "fr": "French"}
LEVEL_TITLES = {
    "a0": "A0", "a1": "A1", "a2": "A2", "b1": "B1", "b2": "B2",
    "c1": "C1", "c2": "C2", "native": "Native", "original": "Original",
}
AUDIO_EXTENSIONS = (".mp3", ".m4a", ".ogg", ".opus", ".wav", ".webm")
COVER_EXTENSIONS = (".avif", ".jpg", ".jpeg", ".png", ".webp")
TYPE_ORDER = ("literature", "short-stories", "travel", "biography")


class CatalogError(RuntimeError):
    pass


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise CatalogError(f"Missing metadata: {relative(path)}") from exc
    except json.JSONDecodeError as exc:
        raise CatalogError(f"Malformed JSON in {relative(path)}: {exc}") from exc
    if not isinstance(value, dict):
        raise CatalogError(f"Expected a JSON object in {relative(path)}")
    return value


def require_string(data: dict, key: str, context: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise CatalogError(f"{context}: {key} must be a non-empty string")
    return value


def safe_id(value: str, context: str) -> str:
    if value in {".", ".."} or "/" in value or "\\" in value:
        raise CatalogError(f"{context}: invalid path component {value!r}")
    return value


def optional_single(directory: Path, stem: str, extensions: tuple[str, ...], kind: str) -> Path | None:
    matches = [directory / f"{stem}{extension}" for extension in extensions if (directory / f"{stem}{extension}").is_file()]
    if len(matches) > 1:
        raise CatalogError(f"Conflicting {kind} files for {relative(directory / stem)}: {', '.join(relative(p) for p in matches)}")
    return matches[0] if matches else None


def section_title(metadata: dict, language_ids: list[str], context: str) -> str:
    title = metadata.get("title")
    if isinstance(title, str) and title.strip():
        return title
    if not isinstance(title, dict):
        raise CatalogError(f"{context}: title must be a string or language map")
    for language_id in ("en", *language_ids, *sorted(title)):
        value = title.get(language_id)
        if isinstance(value, str) and value.strip():
            return value
    raise CatalogError(f"{context}: title has no usable display value")


def build_section(item_dir: Path, declared: dict) -> dict:
    context = f"{relative(item_dir / 'item.json')} section"
    section_id = safe_id(require_string(declared, "id", context), context)
    slug = safe_id(require_string(declared, "slug", context), context)
    order = declared.get("order")
    if not isinstance(order, int) or order < 0:
        raise CatalogError(f"{context} {section_id}: order must be a non-negative integer")

    section_dir = item_dir / "sections" / f"{order:03d}-{slug}"
    metadata_path = section_dir / "section.json"
    metadata = read_json(metadata_path)
    for key, expected in (("id", section_id), ("slug", slug), ("order", order)):
        if metadata.get(key) != expected:
            raise CatalogError(f"{relative(metadata_path)}: {key} conflicts with item.json ({metadata.get(key)!r} != {expected!r})")

    archived_paths: set[Path] = set()
    for variant in metadata.get("archivedVariants", []):
        if not isinstance(variant, dict) or not isinstance(variant.get("path"), str):
            raise CatalogError(f"{relative(metadata_path)}: archivedVariants require a path")
        archived_path = (section_dir / variant["path"]).resolve()
        try:
            archived_path.relative_to(section_dir.resolve())
        except ValueError as exc:
            raise CatalogError(f"{relative(metadata_path)}: archived variant escapes its section") from exc
        if not archived_path.is_file():
            raise CatalogError(f"Missing archived variant: {relative(archived_path)}")
        archived_paths.add(archived_path)

    text_root = section_dir / "text"
    languages: list[dict] = []
    referenced_quizzes: set[Path] = set()
    referenced_audio: set[Path] = set()
    if text_root.is_dir():
        for language_dir in sorted((path for path in text_root.iterdir() if path.is_dir()), key=lambda path: path.name):
            language_id = safe_id(language_dir.name, relative(language_dir))
            levels: list[dict] = []
            for text_path in sorted(language_dir.glob("*.md"), key=lambda path: path.name):
                if text_path.resolve() in archived_paths:
                    continue
                level_id = safe_id(text_path.stem, relative(text_path))
                if not text_path.read_text(encoding="utf-8").strip():
                    raise CatalogError(f"Empty published Markdown: {relative(text_path)}")
                quiz_path = section_dir / "quizzes" / f"{language_id}-{level_id}.json"
                audio_path = optional_single(section_dir / "audio", f"{language_id}-{level_id}", AUDIO_EXTENSIONS, "audio")
                if quiz_path.is_file():
                    referenced_quizzes.add(quiz_path.resolve())
                if audio_path:
                    referenced_audio.add(audio_path.resolve())
                levels.append({
                    "id": level_id,
                    "title": LEVEL_TITLES.get(level_id, level_id.upper()),
                    "textPath": relative(text_path),
                    "quizPath": relative(quiz_path) if quiz_path.is_file() else None,
                    "audioPath": relative(audio_path) if audio_path else None,
                })
            if levels:
                languages.append({
                    "id": language_id,
                    "title": LANGUAGE_TITLES.get(language_id, language_id),
                    "levels": levels,
                })
    if not languages:
        raise CatalogError(f"{relative(section_dir)}: no non-empty published Markdown files")

    actual_quizzes = {path.resolve() for path in (section_dir / "quizzes").glob("*.json")}
    actual_audio = {path.resolve() for path in (section_dir / "audio").glob("*") if path.is_file()}
    for kind, extras in (("quiz", actual_quizzes - referenced_quizzes), ("audio", actual_audio - referenced_audio)):
        if extras:
            raise CatalogError(f"{relative(section_dir)}: {kind} files do not match published text: {', '.join(relative(path) for path in sorted(extras))}")

    declared_languages = metadata.get("languages")
    if declared_languages is not None and declared_languages != [language["id"] for language in languages]:
        raise CatalogError(f"{relative(metadata_path)}: declared languages disagree with published text")

    return {
        "id": section_id,
        "slug": slug,
        "order": order,
        "title": section_title(metadata, [language["id"] for language in languages], relative(metadata_path)),
        "legacyIds": metadata.get("legacyIds", []),
        "metadataPath": relative(metadata_path),
        "languages": languages,
    }


def build_item(item_dir: Path, expected_type: str) -> dict:
    metadata_path = item_dir / "item.json"
    metadata = read_json(metadata_path)
    context = relative(metadata_path)
    item_id = safe_id(require_string(metadata, "id", context), context)
    item_type = safe_id(require_string(metadata, "type", context), context)
    if item_id != item_dir.name:
        raise CatalogError(f"{context}: id {item_id!r} conflicts with folder {item_dir.name!r}")
    if item_type != expected_type:
        raise CatalogError(f"{context}: type {item_type!r} conflicts with folder {expected_type!r}")
    if metadata.get("schemaVersion") != 1:
        raise CatalogError(f"{context}: schemaVersion must be 1")
    title = require_string(metadata, "title", context)
    catalog_order = metadata.get("catalogOrder")
    if not isinstance(catalog_order, int) or catalog_order < 0:
        raise CatalogError(f"{context}: catalogOrder must be a non-negative integer")
    author = metadata.get("author")
    if author is not None and (not isinstance(author, str) or not author.strip()):
        raise CatalogError(f"{context}: author must be a non-empty string or null")
    section_label = metadata.get("sectionLabel")
    if not isinstance(section_label, dict) or not all(isinstance(section_label.get(key), str) and section_label[key] for key in ("singular", "plural")):
        raise CatalogError(f"{context}: sectionLabel requires singular and plural strings")
    declared_sections = metadata.get("sections")
    if not isinstance(declared_sections, list) or not declared_sections:
        raise CatalogError(f"{context}: sections must be a non-empty array")

    seen_ids: set[str] = set()
    seen_orders: set[int] = set()
    sections = []
    for declared in declared_sections:
        if not isinstance(declared, dict):
            raise CatalogError(f"{context}: every section entry must be an object")
        section = build_section(item_dir, declared)
        if section["id"] in seen_ids:
            raise CatalogError(f"{context}: duplicate section id {section['id']!r}")
        if section["order"] in seen_orders:
            raise CatalogError(f"{context}: duplicate section order {section['order']}")
        seen_ids.add(section["id"])
        seen_orders.add(section["order"])
        sections.append(section)
    if [section["order"] for section in sections] != sorted(seen_orders):
        raise CatalogError(f"{context}: sections must be listed in ascending order")

    actual_languages = sorted({language["id"] for section in sections for language in section["languages"]})
    actual_levels = sorted({level["id"] for section in sections for language in section["languages"] for level in language["levels"]})
    if sorted(metadata.get("languages", [])) != actual_languages:
        raise CatalogError(f"{context}: declared languages disagree with published text ({metadata.get('languages', [])!r} != {actual_languages!r})")
    if sorted(metadata.get("levels", [])) != actual_levels:
        raise CatalogError(f"{context}: declared levels disagree with published text ({metadata.get('levels', [])!r} != {actual_levels!r})")

    actual_metadata = {path.parent.resolve() for path in (item_dir / "sections").glob("*/section.json")}
    declared_metadata = {(ROOT / section["metadataPath"]).parent.resolve() for section in sections}
    extras = sorted(actual_metadata - declared_metadata)
    if extras:
        raise CatalogError(f"{context}: undeclared section metadata: {', '.join(relative(path / 'section.json') for path in extras)}")

    cover_path = optional_single(item_dir, "cover", COVER_EXTENSIONS, "cover")
    return {
        "id": item_id,
        "catalogOrder": catalog_order,
        "legacyIds": metadata.get("legacyIds", []),
        "type": item_type,
        "title": title,
        "author": author,
        "metadataPath": relative(metadata_path),
        "coverPath": relative(cover_path) if cover_path else None,
        "sectionLabel": section_label,
        "sections": sections,
    }


def build_catalog() -> dict:
    if not ITEMS_ROOT.is_dir():
        raise CatalogError(f"Missing content root: {relative(ITEMS_ROOT)}")
    items = []
    seen_ids: dict[str, str] = {}
    seen_orders: set[tuple[str, int]] = set()
    for type_dir in sorted((path for path in ITEMS_ROOT.iterdir() if path.is_dir()), key=lambda path: path.name):
        for item_dir in sorted((path for path in type_dir.iterdir() if path.is_dir()), key=lambda path: path.name):
            item = build_item(item_dir, type_dir.name)
            if item["id"] in seen_ids:
                raise CatalogError(f"Duplicate item id {item['id']!r}: {seen_ids[item['id']]} and {relative(item_dir)}")
            order_key = (item["type"], item["catalogOrder"])
            if order_key in seen_orders:
                raise CatalogError(f"Duplicate catalogOrder {item['catalogOrder']} in type {item['type']!r}")
            seen_ids[item["id"]] = relative(item_dir)
            seen_orders.add(order_key)
            items.append(item)
    type_rank = {item_type: index for index, item_type in enumerate(TYPE_ORDER)}
    items.sort(key=lambda item: (type_rank.get(item["type"], len(type_rank)), item["type"], item["catalogOrder"], item["id"]))
    for item in items:
        del item["catalogOrder"]
    return {"schemaVersion": 1, "items": items}


def serialized(catalog: dict) -> str:
    return json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if content/catalog.json is not current")
    args = parser.parse_args()
    try:
        output = serialized(build_catalog())
    except CatalogError as exc:
        print(f"Catalog build failed: {exc}", file=sys.stderr)
        return 1
    if args.check:
        try:
            current = CATALOG_PATH.read_text(encoding="utf-8")
        except OSError:
            current = ""
        if current != output:
            print("content/catalog.json is out of date; run python tools/build-catalog.py", file=sys.stderr)
            return 1
        print("content/catalog.json is current")
        return 0
    CATALOG_PATH.write_text(output, encoding="utf-8", newline="\n")
    print(f"Wrote {relative(CATALOG_PATH)} with {len(json.loads(output)['items'])} items")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
