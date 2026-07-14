#!/usr/bin/env python3
"""Validate the VIA Fabula canonical content catalogue without dependencies."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "content" / "catalog.json"
VALID_TYPES = {"literature", "short-stories", "travel", "biography"}
PATH_FIELDS = {"metadataPath", "coverPath", "textPath", "quizPath", "audioPath"}


def load_json(path: Path, errors: list[str]):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"Invalid JSON {path.relative_to(ROOT)}: {exc}")
        return None


def validate_path(value: str | None, field: str, seen: set[str], errors: list[str]) -> None:
    if value is None:
        return
    if not isinstance(value, str) or not value:
        errors.append(f"{field} must be a non-empty string or null: {value!r}")
        return
    normalized = value.replace("\\", "/")
    if "content/books/" in normalized or normalized.startswith("content/books"):
        errors.append(f"Legacy content path in {field}: {value}")
    if normalized in seen:
        errors.append(f"Duplicate catalogue destination path: {value}")
    seen.add(normalized)
    target = (ROOT / normalized).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        errors.append(f"Path escapes repository root: {value}")
        return
    if not target.is_file():
        errors.append(f"Missing {field}: {value}")
    elif field == "textPath" and not target.read_text(encoding="utf-8").strip():
        errors.append(f"Empty published Markdown: {value}")


def walk_paths(value, seen: set[str], errors: list[str]) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in PATH_FIELDS:
                validate_path(child, key, seen, errors)
            else:
                walk_paths(child, seen, errors)
    elif isinstance(value, list):
        for child in value:
            walk_paths(child, seen, errors)


def main() -> int:
    errors: list[str] = []
    catalog = load_json(CATALOG_PATH, errors)
    if not isinstance(catalog, dict):
        print("\n".join(errors), file=sys.stderr)
        return 1
    if catalog.get("schemaVersion") != 1:
        errors.append("catalog.json schemaVersion must be 1")
    items = catalog.get("items")
    if not isinstance(items, list):
        errors.append("catalog.json items must be an array")
        items = []

    item_ids: set[str] = set()
    orders_seen: dict[str, set[int]] = {}
    for item in items:
        item_id = item.get("id")
        if not isinstance(item_id, str) or not item_id:
            errors.append(f"Invalid item id: {item_id!r}")
            continue
        if item_id in item_ids:
            errors.append(f"Duplicate item id: {item_id}")
        item_ids.add(item_id)
        if item.get("type") not in VALID_TYPES:
            errors.append(f"Invalid category for {item_id}: {item.get('type')!r}")
        metadata_path = ROOT / str(item.get("metadataPath", ""))
        metadata = load_json(metadata_path, errors) if metadata_path.is_file() else None
        if isinstance(metadata, dict) and metadata.get("id") != item_id:
            errors.append(f"Item metadata id mismatch: {item_id}")

        section_ids: set[str] = set()
        section_orders: set[int] = set()
        for section in item.get("sections", []):
            section_id = section.get("id")
            if section_id in section_ids:
                errors.append(f"Duplicate section id in {item_id}: {section_id}")
            section_ids.add(section_id)
            order = section.get("order")
            if not isinstance(order, int) or order < 0:
                errors.append(f"Invalid section order in {item_id}/{section_id}: {order!r}")
            elif order in section_orders:
                errors.append(f"Duplicate section order in {item_id}: {order}")
            else:
                section_orders.add(order)
            section_path = ROOT / str(section.get("metadataPath", ""))
            section_metadata = load_json(section_path, errors) if section_path.is_file() else None
            if isinstance(section_metadata, dict):
                if section_metadata.get("id") != section_id:
                    errors.append(f"Section metadata id mismatch: {item_id}/{section_id}")
                if section_metadata.get("order") != order:
                    errors.append(f"Section metadata order mismatch: {item_id}/{section_id}")
                for variant in section_metadata.get("archivedVariants", []):
                    variant_path = section_path.parent / str(variant.get("path", ""))
                    if not variant_path.is_file():
                        errors.append(f"Missing archived variant: {variant_path.relative_to(ROOT)}")
        orders_seen[item_id] = section_orders

    seen_paths: set[str] = set()
    walk_paths(catalog, seen_paths, errors)

    for path in (ROOT / "content" / "items").rglob("*.json"):
        load_json(path, errors)
    for path in (ROOT / "content" / "items").rglob("*.md"):
        if path.stat().st_size == 0 or not path.read_text(encoding="utf-8").strip():
            errors.append(f"Empty Markdown file retained: {path.relative_to(ROOT)}")

    if errors:
        print(f"Content validation failed with {len(errors)} error(s):", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    section_count = sum(len(item.get("sections", [])) for item in items)
    level_count = sum(len(language.get("levels", [])) for item in items for section in item.get("sections", []) for language in section.get("languages", []))
    print(f"Content validation passed: {len(items)} items, {section_count} sections, {level_count} published levels, {len(seen_paths)} unique catalogue paths.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
