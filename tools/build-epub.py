#!/usr/bin/env python3
"""Build and validate offline EPUB 3 exports from VIA Fabula canonical content."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import posixpath
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import uuid
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
ITEMS_ROOT = ROOT / "content" / "items"
OUTPUT_ROOT = ROOT / "exports" / "epub"
STATE_PATH = OUTPUT_ROOT / ".build-state.json"
EXPORTER_VERSION = "1"
LANGUAGE_TITLES = {
    "de": "German",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
}
LEVEL_TITLES = {
    "a0": "A0",
    "a1": "A1",
    "a2": "A2",
    "b1": "B1",
    "b2": "B2",
    "c1": "C1",
    "c2": "C2",
    "native": "Native",
    "original": "Original",
}
LEVEL_ORDER = tuple(LEVEL_TITLES)
CEFR_LEVELS = LEVEL_ORDER[:7]
COVER_EXTENSIONS = (".avif", ".jpg", ".jpeg", ".png", ".webp")
EPUB_COVER_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}
ID_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")
XML_NS = "http://www.w3.org/XML/1998/namespace"
XHTML_NS = "http://www.w3.org/1999/xhtml"
CONTAINER_NS = "urn:oasis:names:tc:opendocument:xmlns:container"
OPF_NS = "http://www.idpf.org/2007/opf"
DC_NS = "http://purl.org/dc/elements/1.1/"
EPUB_NS = "http://www.idpf.org/2007/ops"


class ExportError(RuntimeError):
    """A source, build, or EPUB validation error."""


@dataclass(frozen=True)
class Version:
    language: str
    level: str
    source_path: Path


@dataclass
class Section:
    id: str
    slug: str
    order: int
    directory: Path
    metadata_path: Path
    titles: dict[str, str]
    versions: dict[tuple[str, str], Version]


@dataclass
class Item:
    id: str
    type: str
    directory: Path
    metadata_path: Path
    metadata: dict
    title: str
    author: str | None
    original_language: str | None
    rights: str | None
    source_origin: str | None
    sections: list[Section]
    languages: list[str]
    levels: list[str]
    cover_path: Path | None


def relative(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def read_json(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ExportError(f"Missing metadata: {relative(path)}") from exc
    except UnicodeDecodeError as exc:
        raise ExportError(f"Metadata is not UTF-8: {relative(path)}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ExportError(f"Malformed JSON in {relative(path)}: {exc}") from exc
    if not isinstance(data, dict):
        raise ExportError(f"Expected a JSON object in {relative(path)}")
    return data


def require_string(data: dict, key: str, context: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ExportError(f"{context}: {key} must be a non-empty string")
    return value.strip()


def safe_id(value: str, context: str) -> str:
    if not ID_PATTERN.fullmatch(value):
        raise ExportError(f"{context}: invalid ID/path component {value!r}")
    return value


def resolve_link(base: Path, value: object, context: str) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise ExportError(f"{context}: linked path must be a non-empty string")
    value_path = PurePosixPath(value.replace("\\", "/"))
    if value_path.is_absolute() or ".." in value_path.parts:
        raise ExportError(f"{context}: path traversal is not allowed: {value!r}")
    target = (base / Path(*value_path.parts)).resolve()
    try:
        target.relative_to(base.resolve())
    except ValueError as exc:
        raise ExportError(f"{context}: path escapes {relative(base)}: {value!r}") from exc
    if not target.is_file():
        raise ExportError(f"{context}: missing linked resource {relative(target)}")
    return target


def cover_for(item_dir: Path) -> Path | None:
    matches = [
        path
        for path in item_dir.iterdir()
        if path.is_file()
        and path.stem.lower() == "cover"
        and path.suffix.lower() in COVER_EXTENSIONS
    ]
    matches.sort(key=lambda path: path.name.lower())
    if len(matches) > 1:
        raise ExportError(
            f"{relative(item_dir)}: multiple conflicting cover files: "
            + ", ".join(relative(path) for path in matches)
        )
    return matches[0] if matches else None


def title_map(value: object, context: str) -> dict[str, str]:
    if value is None:
        return {}
    if isinstance(value, str) and value.strip():
        return {"": value.strip()}
    if not isinstance(value, dict):
        raise ExportError(f"{context}: title must be a non-empty string or language map")
    result: dict[str, str] = {}
    for language, title in value.items():
        if not isinstance(language, str) or not isinstance(title, str) or not title.strip():
            raise ExportError(f"{context}: title entries must contain non-empty strings")
        if language:
            safe_id(language, context)
        result[language] = title.strip()
    return result


def section_title(section: Section, language: str) -> str:
    for candidate in (language, "en", "", *sorted(section.titles)):
        value = section.titles.get(candidate)
        if value:
            return value
    return section.id


def load_section(item_dir: Path, declaration: object) -> Section:
    item_context = relative(item_dir / "item.json")
    if not isinstance(declaration, dict):
        raise ExportError(f"{item_context}: each section declaration must be an object")
    section_id = safe_id(require_string(declaration, "id", item_context), item_context)
    slug = safe_id(require_string(declaration, "slug", item_context), item_context)
    order = declaration.get("order")
    if not isinstance(order, int) or isinstance(order, bool) or order < 0:
        raise ExportError(f"{item_context} section {section_id}: order must be a non-negative integer")
    section_dir = item_dir / "sections" / f"{order:03d}-{slug}"
    metadata_path = section_dir / "section.json"
    metadata = read_json(metadata_path)
    context = relative(metadata_path)
    for key, expected in (("id", section_id), ("slug", slug), ("order", order)):
        if metadata.get(key) != expected:
            raise ExportError(
                f"{context}: {key} conflicts with item.json "
                f"({metadata.get(key)!r} != {expected!r})"
            )
    if metadata.get("schemaVersion") != 1:
        raise ExportError(f"{context}: schemaVersion must be 1")

    archived: set[Path] = set()
    variants = metadata.get("archivedVariants", [])
    if not isinstance(variants, list):
        raise ExportError(f"{context}: archivedVariants must be an array")
    for variant in variants:
        if not isinstance(variant, dict):
            raise ExportError(f"{context}: archivedVariants entries must be objects")
        archived.add(resolve_link(section_dir, variant.get("path"), context).resolve())

    text_root = section_dir / "text"
    if not text_root.is_dir():
        raise ExportError(f"{relative(section_dir)}: missing text directory")
    versions: dict[tuple[str, str], Version] = {}
    for language_dir in sorted(text_root.iterdir(), key=lambda path: path.name):
        if not language_dir.is_dir():
            raise ExportError(f"{relative(language_dir)}: text entries must be language directories")
        language = safe_id(language_dir.name, relative(language_dir))
        for path in sorted(language_dir.iterdir(), key=lambda child: child.name):
            if path.is_dir():
                raise ExportError(f"{relative(path)}: nested text directories are not supported")
            if path.suffix.lower() != ".md":
                raise ExportError(f"{relative(path)}: invalid published text file; expected .md")
            if path.resolve() in archived:
                continue
            level = safe_id(path.stem, relative(path))
            if level not in LEVEL_TITLES:
                raise ExportError(f"{relative(path)}: invalid level ID {level!r}")
            try:
                source = path.read_text(encoding="utf-8")
            except UnicodeDecodeError as exc:
                raise ExportError(f"{relative(path)}: Markdown is not UTF-8: {exc}") from exc
            if not source.strip():
                raise ExportError(f"Empty published Markdown: {relative(path)}")
            key = (language, level)
            if key in versions:
                raise ExportError(f"{relative(section_dir)}: conflicting version {language}/{level}")
            versions[key] = Version(language, level, path)
    if not versions:
        raise ExportError(f"{relative(section_dir)}: no non-empty published Markdown")

    declared_languages = metadata.get("languages")
    actual_languages = sorted({language for language, _ in versions})
    if declared_languages is not None and declared_languages != actual_languages:
        raise ExportError(
            f"{context}: declared languages disagree with published text "
            f"({declared_languages!r} != {actual_languages!r})"
        )
    return Section(
        id=section_id,
        slug=slug,
        order=order,
        directory=section_dir,
        metadata_path=metadata_path,
        titles=title_map(metadata.get("title"), context),
        versions=versions,
    )


def load_item(item_dir: Path, expected_type: str) -> Item:
    metadata_path = item_dir / "item.json"
    metadata = read_json(metadata_path)
    context = relative(metadata_path)
    item_id = safe_id(require_string(metadata, "id", context), context)
    item_type = safe_id(require_string(metadata, "type", context), context)
    if item_id != item_dir.name:
        raise ExportError(f"{context}: id {item_id!r} conflicts with folder {item_dir.name!r}")
    if item_type != expected_type:
        raise ExportError(f"{context}: type {item_type!r} conflicts with folder {expected_type!r}")
    if metadata.get("schemaVersion") != 1:
        raise ExportError(f"{context}: schemaVersion must be 1")
    title = require_string(metadata, "title", context)
    author = metadata.get("author")
    if author is not None and (not isinstance(author, str) or not author.strip()):
        raise ExportError(f"{context}: author must be a non-empty string or null")

    declarations = metadata.get("sections")
    if not isinstance(declarations, list) or not declarations:
        raise ExportError(f"{context}: sections must be a non-empty array")
    sections = [load_section(item_dir, declaration) for declaration in declarations]
    ids = [section.id for section in sections]
    orders = [section.order for section in sections]
    if len(ids) != len(set(ids)):
        raise ExportError(f"{context}: duplicate section IDs")
    if len(orders) != len(set(orders)):
        raise ExportError(f"{context}: duplicate section orders")
    if orders != sorted(orders):
        raise ExportError(f"{context}: sections must be declared in ascending order")

    declared_dirs = {section.directory.resolve() for section in sections}
    sections_root = item_dir / "sections"
    actual_dirs = {path.resolve() for path in sections_root.iterdir() if path.is_dir()}
    extras = sorted(actual_dirs - declared_dirs)
    if extras:
        raise ExportError(
            f"{context}: undeclared section folders: "
            + ", ".join(relative(path) for path in extras)
        )
    unexpected_files = [path for path in sections_root.iterdir() if path.is_file()]
    if unexpected_files:
        raise ExportError(
            f"{context}: invalid files in sections directory: "
            + ", ".join(relative(path) for path in unexpected_files)
        )

    languages = sorted({language for section in sections for language, _ in section.versions})
    levels = sorted(
        {level for section in sections for _, level in section.versions},
        key=lambda value: LEVEL_ORDER.index(value),
    )
    if sorted(metadata.get("languages", [])) != languages:
        raise ExportError(
            f"{context}: declared languages disagree with published text "
            f"({metadata.get('languages', [])!r} != {languages!r})"
        )
    declared_levels = metadata.get("levels", [])
    if sorted(declared_levels, key=lambda value: LEVEL_ORDER.index(value) if value in LEVEL_ORDER else 999) != levels:
        raise ExportError(
            f"{context}: declared levels disagree with published text "
            f"({declared_levels!r} != {levels!r})"
        )

    source = metadata.get("source", {})
    if source is not None and not isinstance(source, dict):
        raise ExportError(f"{context}: source must be an object")
    source = source or {}
    original_language = source.get("originalLanguage")
    if original_language is not None:
        original_language = safe_id(require_string(source, "originalLanguage", context), context)
    source_files = metadata.get("sourceFiles", [])
    if not isinstance(source_files, list):
        raise ExportError(f"{context}: sourceFiles must be an array")
    for linked in source_files:
        resolve_link(item_dir, linked, context)

    return Item(
        id=item_id,
        type=item_type,
        directory=item_dir,
        metadata_path=metadata_path,
        metadata=metadata,
        title=title,
        author=author.strip() if isinstance(author, str) else None,
        original_language=original_language,
        rights=source.get("rights") if isinstance(source.get("rights"), str) else None,
        source_origin=source.get("origin") if isinstance(source.get("origin"), str) else None,
        sections=sections,
        languages=languages,
        levels=levels,
        cover_path=cover_for(item_dir),
    )


def discover_items() -> list[Item]:
    if not ITEMS_ROOT.is_dir():
        raise ExportError(f"Missing canonical content root: {relative(ITEMS_ROOT)}")
    items: list[Item] = []
    seen: dict[str, Path] = {}
    for type_dir in sorted(ITEMS_ROOT.iterdir(), key=lambda path: path.name):
        if not type_dir.is_dir():
            raise ExportError(f"{relative(type_dir)}: content item types must be directories")
        item_type = safe_id(type_dir.name, relative(type_dir))
        for item_dir in sorted(type_dir.iterdir(), key=lambda path: path.name):
            if not item_dir.is_dir():
                raise ExportError(f"{relative(item_dir)}: content items must be directories")
            item = load_item(item_dir, item_type)
            if item.id in seen:
                raise ExportError(
                    f"Conflicting item ID {item.id!r}: "
                    f"{relative(seen[item.id])} and {relative(item_dir)}"
                )
            seen[item.id] = item_dir
            items.append(item)
    return items


def generated_section_name(section: Section) -> str:
    return f"section-{section.order:03d}.xhtml"


def chapter_href(section: Section, language: str, level: str) -> str:
    return f"text/{language}/{level}/{generated_section_name(section)}"


def tracks(item: Item) -> list[tuple[str, str]]:
    available = {
        key
        for section in item.sections
        for key in section.versions
    }
    return [
        (language, level)
        for language in item.languages
        for level in LEVEL_ORDER
        if (language, level) in available
    ]


def default_track(item: Item) -> tuple[str, str]:
    available = tracks(item)
    original = item.original_language
    if original:
        for level in ("original", "native"):
            if (original, level) in available:
                return original, level
        cefr = [level for level in CEFR_LEVELS if (original, level) in available]
        if cefr:
            return original, cefr[-1]
    if not available:
        raise ExportError(f"{item.id}: no exportable reading tracks")
    return available[0]


def choose_target_level(section: Section, language: str, current_level: str) -> str | None:
    available = [level for lang, level in section.versions if lang == language]
    if current_level in available:
        return current_level
    if "native" in available:
        return "native"
    cefr = [level for level in available if level in CEFR_LEVELS]
    if cefr:
        if current_level in CEFR_LEVELS:
            current_index = CEFR_LEVELS.index(current_level)
            return min(
                cefr,
                key=lambda level: (
                    abs(CEFR_LEVELS.index(level) - current_index),
                    CEFR_LEVELS.index(level),
                ),
            )
        return max(cefr, key=CEFR_LEVELS.index)
    ordered = sorted(available, key=LEVEL_ORDER.index)
    return ordered[0] if ordered else None


def markdown_blocks(source: str) -> str:
    lines = source.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    output: list[str] = []
    paragraph: list[str] = []
    list_items: list[str] = []
    paragraph_number = 0

    def flush_paragraph() -> None:
        nonlocal paragraph_number
        if paragraph:
            paragraph_number += 1
            body = "<br />\n".join(html.escape(line.strip()) for line in paragraph)
            output.append(f'<p id="p-{paragraph_number:04d}">{body}</p>')
            paragraph.clear()

    def flush_list() -> None:
        if list_items:
            output.append("<ul>\n" + "\n".join(list_items) + "\n</ul>")
            list_items.clear()

    for line in lines:
        heading = re.match(r"^\s*(#{1,6})\s+(.+?)\s*$", line)
        bullet = re.match(r"^\s*[-+*]\s+(.+?)\s*$", line)
        if heading:
            flush_paragraph()
            flush_list()
            level = len(heading.group(1))
            output.append(f"<h{level}>{html.escape(heading.group(2))}</h{level}>")
        elif bullet:
            flush_paragraph()
            list_items.append(f"<li>{html.escape(bullet.group(1))}</li>")
        elif not line.strip():
            flush_paragraph()
            flush_list()
        else:
            flush_list()
            paragraph.append(line)
    flush_paragraph()
    flush_list()
    return "\n".join(output)


def xhtml_document(
    title: str,
    language: str,
    stylesheet: str,
    body: str,
    body_class: str = "",
) -> str:
    class_attribute = f' class="{html.escape(body_class, quote=True)}"' if body_class else ""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="{XHTML_NS}" xmlns:epub="{EPUB_NS}" lang="{html.escape(language, quote=True)}" xml:lang="{html.escape(language, quote=True)}">
<head>
  <meta charset="UTF-8" />
  <title>{html.escape(title)}</title>
  <link rel="stylesheet" type="text/css" href="{html.escape(stylesheet, quote=True)}" />
</head>
<body{class_attribute}>
{body}
</body>
</html>
"""


def language_label(language: str) -> str:
    return LANGUAGE_TITLES.get(language, language)


def level_label(level: str) -> str:
    return LEVEL_TITLES.get(level, level.upper())


def start_xhtml(item: Item, cover_href: str | None) -> str:
    language = item.original_language if item.original_language in item.languages else item.languages[0]
    groups: list[str] = []
    available_tracks = set(tracks(item))
    for language_id in item.languages:
        links: list[str] = []
        for level in LEVEL_ORDER:
            if (language_id, level) not in available_tracks:
                continue
            first = next(
                section
                for section in item.sections
                if (language_id, level) in section.versions
            )
            href = chapter_href(first, language_id, level)
            links.append(f'<li><a href="../{href}">{level_label(level)}</a></li>')
        groups.append(
            f"<section><h2>{html.escape(language_label(language_id))}</h2>"
            f"<ul>{''.join(links)}</ul></section>"
        )
    cover = (
        f'<img class="cover" src="../{html.escape(cover_href, quote=True)}" '
        f'alt="Cover for {html.escape(item.title, quote=True)}" />'
        if cover_href
        else ""
    )
    author = f'<p class="author">{html.escape(item.author)}</p>' if item.author else ""
    metadata = []
    if item.rights:
        metadata.append(f"<dt>Rights</dt><dd>{html.escape(item.rights)}</dd>")
    if item.source_origin:
        metadata.append(f"<dt>Source</dt><dd>{html.escape(item.source_origin)}</dd>")
    metadata_html = f'<dl class="metadata">{"".join(metadata)}</dl>' if metadata else ""
    body = f"""<main>
{cover}
<h1>{html.escape(item.title)}</h1>
{author}
<p class="lede">Choose a reading path</p>
<p>Each reading path contains the same story at a different language or difficulty where that version is available.</p>
<div class="reading-paths">
{''.join(groups)}
</div>
{metadata_html}
</main>"""
    return xhtml_document(item.title, language, "../styles/book.css", body, "start-page")


def nav_xhtml(item: Item) -> str:
    groups: list[str] = []
    available_tracks = tracks(item)
    for language in item.languages:
        level_groups: list[str] = []
        for level in LEVEL_ORDER:
            if (language, level) not in available_tracks:
                continue
            chapters = []
            for section in item.sections:
                if (language, level) in section.versions:
                    chapters.append(
                        f'<li><a href="{chapter_href(section, language, level)}">'
                        f"{html.escape(section_title(section, language))}</a></li>"
                    )
            level_groups.append(
                f'<li id="track-{language}-{level}"><span>{level_label(level)}</span>'
                f"<ol>{''.join(chapters)}</ol></li>"
            )
        groups.append(
            f"<li><span>{html.escape(language_label(language))}</span>"
            f"<ol>{''.join(level_groups)}</ol></li>"
        )
    body = f"""<nav epub:type="toc" id="toc">
<h1>Contents</h1>
<ol>
  <li><a href="text/start.xhtml">Start</a></li>
  {''.join(groups)}
</ol>
</nav>"""
    language = item.original_language if item.original_language in item.languages else item.languages[0]
    return xhtml_document(f"Contents — {item.title}", language, "styles/book.css", body, "contents-page")


def version_navigation(item: Item, section: Section, language: str, level: str) -> str:
    language_links: list[str] = []
    section_languages = sorted({lang for lang, _ in section.versions})
    current_dir = PurePosixPath(chapter_href(section, language, level)).parent
    for target_language in section_languages:
        target_level = choose_target_level(section, target_language, level)
        if target_level is None:
            continue
        label = language_label(target_language)
        if target_level != level:
            label += f" ({level_label(target_level)})"
        if target_language == language and target_level == level:
            language_links.append(f"<span aria-current=\"page\">{html.escape(label)}</span>")
        else:
            target = chapter_href(section, target_language, target_level)
            href = posixpath.relpath(target, current_dir.as_posix())
            language_links.append(f'<a href="{href}">{html.escape(label)}</a>')

    levels = sorted(
        (candidate_level for lang, candidate_level in section.versions if lang == language),
        key=LEVEL_ORDER.index,
    )
    level_links: list[str] = []
    for target_level in levels:
        label = level_label(target_level)
        if target_level == level:
            level_links.append(f'<span aria-current="page">{label}</span>')
        else:
            target = chapter_href(section, language, target_level)
            href = posixpath.relpath(target, current_dir.as_posix())
            level_links.append(f'<a href="{href}">{label}</a>')
    return f"""<nav class="version-nav" aria-label="Change this chapter version">
<p><strong>Language:</strong> {" · ".join(language_links)}</p>
<p><strong>Level:</strong> {" · ".join(level_links)}</p>
</nav>"""


def chapter_xhtml(item: Item, section: Section, language: str, level: str) -> str:
    version = section.versions[(language, level)]
    try:
        markdown = version.source_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise ExportError(f"{relative(version.source_path)}: Markdown is not UTF-8: {exc}") from exc
    title = section_title(section, language)
    source = relative(version.source_path)
    body = f"""<main>
{version_navigation(item, section, language, level)}
<article data-source="{html.escape(source, quote=True)}">
<h1>{html.escape(title)}</h1>
{markdown_blocks(markdown)}
</article>
</main>"""
    return xhtml_document(title, language, "../../../styles/book.css", body, "chapter-page")


BOOK_CSS = """body {
  font-family: serif;
  line-height: 1.55;
  margin: 5%;
}
main {
  max-width: 42em;
  margin: 0 auto;
}
h1, h2, h3, h4, h5, h6 {
  line-height: 1.2;
}
a {
  text-decoration: underline;
}
.author, .lede {
  font-style: italic;
}
.cover {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  height: auto;
  margin: 0 auto 1.5em;
}
.reading-paths section {
  margin-block: 1.25em;
}
.version-nav {
  font-size: 0.9em;
  line-height: 1.35;
  margin: 0 0 1em;
  padding: 0 0 0.5em;
  border-bottom: 1px solid;
}
.version-nav p {
  margin: 0.15em 0;
}
.metadata {
  margin-top: 2em;
}
.metadata dt {
  font-weight: bold;
}
.metadata dd {
  margin: 0 0 0.75em;
}
"""


CONTAINER_XML = f"""<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="{CONTAINER_NS}">
  <rootfiles>
    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>
"""


def package_opf(
    item: Item,
    modified: str,
    chapter_documents: list[tuple[Section, str, str, str]],
    cover_href: str | None,
    cover_media_type: str | None,
) -> str:
    identifier = f"urn:uuid:{uuid.uuid5(uuid.NAMESPACE_URL, f'https://viafabula.com/items/{item.id}')}"
    language_order = list(item.languages)
    if item.original_language in language_order:
        language_order.remove(item.original_language)
        language_order.insert(0, item.original_language)
    metadata = [
        f'<dc:identifier id="pub-id">{html.escape(identifier)}</dc:identifier>',
        f"<dc:title>{html.escape(item.title)}</dc:title>",
        *(f"<dc:language>{html.escape(language)}</dc:language>" for language in language_order),
        f'<meta property="dcterms:modified">{modified}</meta>',
    ]
    if item.author:
        metadata.append(f"<dc:creator>{html.escape(item.author)}</dc:creator>")
    if item.rights:
        metadata.append(f"<dc:rights>{html.escape(item.rights)}</dc:rights>")
    if item.source_origin:
        metadata.append(f"<dc:source>{html.escape(item.source_origin)}</dc:source>")

    manifest = [
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
        '<item id="style" href="styles/book.css" media-type="text/css" />',
        '<item id="start" href="text/start.xhtml" media-type="application/xhtml+xml" />',
    ]
    if cover_href and cover_media_type:
        manifest.append(
            f'<item id="cover-image" href="{html.escape(cover_href, quote=True)}" '
            f'media-type="{cover_media_type}" properties="cover-image" />'
        )
    document_ids: dict[str, str] = {}
    for index, (_, _, _, href) in enumerate(chapter_documents, start=1):
        document_id = f"chapter-{index:04d}"
        document_ids[href] = document_id
        manifest.append(
            f'<item id="{document_id}" href="{html.escape(href, quote=True)}" '
            'media-type="application/xhtml+xml" />'
        )

    primary = default_track(item)
    primary_hrefs = [
        href
        for _, language, level, href in chapter_documents
        if (language, level) == primary
    ]
    alternate_hrefs = [
        href
        for _, language, level, href in chapter_documents
        if (language, level) != primary
    ]
    spine = ['<itemref idref="start" />']
    spine.extend(f'<itemref idref="{document_ids[href]}" />' for href in primary_hrefs)
    spine.extend(f'<itemref idref="{document_ids[href]}" />' for href in alternate_hrefs)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="{OPF_NS}" version="3.0" unique-identifier="pub-id" xml:lang="{html.escape(language_order[0], quote=True)}">
  <metadata xmlns:dc="{DC_NS}">
    {' '.join(metadata)}
  </metadata>
  <manifest>
    {' '.join(manifest)}
  </manifest>
  <spine>
    {' '.join(spine)}
  </spine>
</package>
"""


def fingerprint(item: Item) -> str:
    digest = hashlib.sha256()
    digest.update(f"via-fabula-epub-exporter:{EXPORTER_VERSION}\0".encode())
    digest.update(Path(__file__).read_bytes())
    paths = [item.metadata_path, *(section.metadata_path for section in item.sections)]
    paths.extend(
        version.source_path
        for section in item.sections
        for version in section.versions.values()
    )
    if item.cover_path:
        paths.append(item.cover_path)
    for path in sorted(paths, key=lambda candidate: relative(candidate)):
        digest.update(relative(path).encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def write_epub(item: Item, destination: Path) -> dict[str, tuple[str, str]]:
    chapter_documents: list[tuple[Section, str, str, str]] = []
    expected_sources: dict[str, tuple[str, str]] = {}
    for language, level in tracks(item):
        for section in item.sections:
            if (language, level) not in section.versions:
                continue
            href = chapter_href(section, language, level)
            chapter_documents.append((section, language, level, href))
            expected_sources[href] = (
                relative(section.versions[(language, level)].source_path),
                language,
            )

    cover_href = None
    cover_media_type = None
    if item.cover_path and item.cover_path.suffix.lower() in EPUB_COVER_TYPES:
        cover_href = f"images/cover{item.cover_path.suffix.lower()}"
        cover_media_type = EPUB_COVER_TYPES[item.cover_path.suffix.lower()]
    elif item.cover_path:
        print(
            f"{item.id}: cover {relative(item.cover_path)} is not embedded because "
            f"{item.cover_path.suffix.lower()} is not a core-compatible EPUB image type",
            file=sys.stderr,
        )

    modified = datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")
    with zipfile.ZipFile(destination, "w") as archive:
        archive.writestr(
            zipfile.ZipInfo("mimetype"),
            b"application/epub+zip",
            compress_type=zipfile.ZIP_STORED,
        )
        archive.writestr("META-INF/container.xml", CONTAINER_XML, compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr("EPUB/styles/book.css", BOOK_CSS, compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr(
            "EPUB/text/start.xhtml",
            start_xhtml(item, cover_href),
            compress_type=zipfile.ZIP_DEFLATED,
        )
        archive.writestr(
            "EPUB/nav.xhtml",
            nav_xhtml(item),
            compress_type=zipfile.ZIP_DEFLATED,
        )
        for section, language, level, href in chapter_documents:
            archive.writestr(
                f"EPUB/{href}",
                chapter_xhtml(item, section, language, level),
                compress_type=zipfile.ZIP_DEFLATED,
            )
        if cover_href and item.cover_path:
            archive.write(item.cover_path, f"EPUB/{cover_href}", compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr(
            "EPUB/package.opf",
            package_opf(item, modified, chapter_documents, cover_href, cover_media_type),
            compress_type=zipfile.ZIP_DEFLATED,
        )
    return expected_sources


def safe_archive_target(base: str, href: str) -> str:
    if "\\" in href:
        raise ExportError(f"Invalid backslash in EPUB href: {href}")
    target = posixpath.normpath(posixpath.join(posixpath.dirname(base), href))
    if target.startswith("../") or target == ".." or target.startswith("/"):
        raise ExportError(f"EPUB link escapes publication root: {href}")
    return target


def validate_epub(
    path: Path,
    expected_sources: dict[str, tuple[str, str]] | None = None,
) -> None:
    if not path.is_file():
        raise ExportError(f"EPUB output does not exist: {relative(path)}")
    try:
        archive = zipfile.ZipFile(path, "r")
    except (OSError, zipfile.BadZipFile) as exc:
        raise ExportError(f"Unreadable EPUB ZIP {relative(path)}: {exc}") from exc
    with archive:
        infos = archive.infolist()
        names = [info.filename for info in infos]
        if not infos or infos[0].filename != "mimetype":
            raise ExportError(f"{relative(path)}: mimetype must be the first ZIP entry")
        if infos[0].compress_type != zipfile.ZIP_STORED:
            raise ExportError(f"{relative(path)}: mimetype must be stored without compression")
        if archive.read("mimetype") != b"application/epub+zip":
            raise ExportError(f"{relative(path)}: invalid mimetype content")
        if len(names) != len(set(names)):
            raise ExportError(f"{relative(path)}: duplicate ZIP entries")
        required = {
            "META-INF/container.xml",
            "EPUB/package.opf",
            "EPUB/nav.xhtml",
            "EPUB/styles/book.css",
            "EPUB/text/start.xhtml",
        }
        missing = sorted(required - set(names))
        if missing:
            raise ExportError(f"{relative(path)}: missing required entries: {', '.join(missing)}")

        xml_roots: dict[str, ET.Element] = {}
        ids_by_path: dict[str, set[str]] = {}
        for name in names:
            if not (name.endswith(".xml") or name.endswith(".opf") or name.endswith(".xhtml")):
                continue
            try:
                root = ET.fromstring(archive.read(name))
            except ET.ParseError as exc:
                raise ExportError(f"{relative(path)}: invalid XML in {name}: {exc}") from exc
            xml_roots[name] = root
            ids: set[str] = set()
            for element in root.iter():
                element_id = element.get("id")
                if element_id:
                    if element_id in ids:
                        raise ExportError(f"{relative(path)}: duplicate ID {element_id!r} in {name}")
                    ids.add(element_id)
            ids_by_path[name] = ids
            if name.endswith(".xhtml"):
                if root.tag != f"{{{XHTML_NS}}}html":
                    raise ExportError(f"{relative(path)}: {name} is not XHTML")
                language = root.get("lang")
                if not language or root.get(f"{{{XML_NS}}}lang") != language:
                    raise ExportError(f"{relative(path)}: {name} lacks matching lang/xml:lang")
                title = root.find(f".//{{{XHTML_NS}}}title")
                if title is None or not "".join(title.itertext()).strip():
                    raise ExportError(f"{relative(path)}: {name} has no title")

        container = xml_roots["META-INF/container.xml"]
        rootfile = container.find(f".//{{{CONTAINER_NS}}}rootfile")
        package_path = rootfile.get("full-path") if rootfile is not None else None
        if not package_path or package_path not in names:
            raise ExportError(f"{relative(path)}: container references a missing package")
        package = xml_roots.get(package_path)
        if package is None:
            raise ExportError(f"{relative(path)}: package document is not parseable")

        manifest: dict[str, str] = {}
        xhtml_manifest: set[str] = set()
        for element in package.findall(f".//{{{OPF_NS}}}manifest/{{{OPF_NS}}}item"):
            item_id = element.get("id")
            href = element.get("href")
            if not item_id or not href or item_id in manifest:
                raise ExportError(f"{relative(path)}: invalid or duplicate manifest item")
            target = safe_archive_target(package_path, href)
            if target not in names:
                raise ExportError(f"{relative(path)}: manifest target is missing: {target}")
            manifest[item_id] = target
            if element.get("media-type") == "application/xhtml+xml":
                xhtml_manifest.add(target)
        spine_entries: list[tuple[str, str | None]] = []
        for element in package.findall(f".//{{{OPF_NS}}}spine/{{{OPF_NS}}}itemref"):
            idref = element.get("idref")
            if not idref or idref not in manifest:
                raise ExportError(f"{relative(path)}: spine references unknown manifest ID {idref!r}")
            spine_entries.append((manifest[idref], element.get("linear")))
        spine_targets = {target for target, _ in spine_entries}
        if not xhtml_manifest.issubset(spine_targets | {"EPUB/nav.xhtml"}):
            missing_spine = sorted(xhtml_manifest - spine_targets - {"EPUB/nav.xhtml"})
            raise ExportError(
                f"{relative(path)}: XHTML manifest documents missing from spine: "
                + ", ".join(missing_spine)
            )

        linked_xhtml: set[str] = set()
        for document_path, root in xml_roots.items():
            if not document_path.endswith(".xhtml"):
                continue
            for element in root.iter():
                href = element.get("href")
                if not href or re.match(r"^[a-z][a-z0-9+.-]*:", href, re.I):
                    continue
                resource, _, fragment = href.partition("#")
                target = (
                    safe_archive_target(document_path, resource)
                    if resource
                    else document_path
                )
                if target not in names:
                    raise ExportError(
                        f"{relative(path)}: broken link in {document_path}: {href}"
                    )
                if fragment and fragment not in ids_by_path.get(target, set()):
                    raise ExportError(
                        f"{relative(path)}: missing fragment in {document_path}: {href}"
                    )
                if target.endswith(".xhtml"):
                    linked_xhtml.add(target)
        if not linked_xhtml.issubset(xhtml_manifest):
            missing_manifest = sorted(linked_xhtml - xhtml_manifest)
            raise ExportError(
                f"{relative(path)}: linked XHTML missing from manifest: "
                + ", ".join(missing_manifest)
            )
        if not linked_xhtml.issubset(spine_targets | {"EPUB/nav.xhtml"}):
            missing_spine = sorted(linked_xhtml - spine_targets - {"EPUB/nav.xhtml"})
            raise ExportError(
                f"{relative(path)}: linked XHTML missing from spine: "
                + ", ".join(missing_spine)
            )

        if expected_sources is not None:
            represented: set[str] = set()
            expected_documents = {f"EPUB/{href}" for href in expected_sources}
            native_chapter_order = [
                (target, linear)
                for target, linear in spine_entries
                if target in expected_documents
            ]
            non_linear = [target for target, linear in native_chapter_order if linear == "no"]
            if non_linear:
                raise ExportError(
                    f"{relative(path)}: chapter documents must use native linear progression"
                )
            seen_tracks: set[str] = set()
            current_track: str | None = None
            for target, _ in native_chapter_order:
                track = posixpath.dirname(target)
                if track != current_track:
                    if track in seen_tracks:
                        raise ExportError(
                            f"{relative(path)}: reading track is not contiguous in spine: {track}"
                        )
                    seen_tracks.add(track)
                    current_track = track
            for href, (source, expected_language) in expected_sources.items():
                document_path = f"EPUB/{href}"
                root = xml_roots.get(document_path)
                if root is None:
                    raise ExportError(f"{relative(path)}: source document missing: {href}")
                if root.get("lang") != expected_language:
                    raise ExportError(
                        f"{relative(path)}: wrong language on {href}: "
                        f"{root.get('lang')!r} != {expected_language!r}"
                    )
                article = root.find(f".//{{{XHTML_NS}}}article")
                if article is None or article.get("data-source") != source:
                    raise ExportError(
                        f"{relative(path)}: source mapping missing or incorrect on {href}"
                    )
                represented.add(source)
            expected = {source for source, _ in expected_sources.values()}
            if represented != expected:
                raise ExportError(f"{relative(path)}: not all selected Markdown is represented")


def run_epubcheck(path: Path, jar: Path | None) -> None:
    if jar is None:
        return
    if not jar.is_file():
        raise ExportError(f"EPUBCheck JAR does not exist: {jar}")
    java = shutil.which("java")
    if not java:
        raise ExportError("EPUBCheck was requested, but Java is not available")
    result = subprocess.run(
        [java, "-jar", str(jar), str(path)],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    if result.returncode != 0:
        raise ExportError(f"EPUBCheck failed for {relative(path)}")


def load_state() -> dict:
    if not STATE_PATH.is_file():
        return {}
    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ExportError(f"Invalid build state {relative(STATE_PATH)}: {exc}") from exc
    if not isinstance(state, dict):
        raise ExportError(f"{relative(STATE_PATH)} must contain a JSON object")
    return state


def save_state(state: dict) -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    temporary = STATE_PATH.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(state, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    os.replace(temporary, STATE_PATH)


def build_item(
    item: Item,
    state: dict,
    force: bool,
    check: bool,
    epubcheck_jar: Path | None,
) -> bool:
    output = OUTPUT_ROOT / f"{item.id}.epub"
    current_fingerprint = fingerprint(item)
    record = state.get(item.id)
    is_current = (
        isinstance(record, dict)
        and record.get("fingerprint") == current_fingerprint
        and output.is_file()
    )
    if check:
        if not output.is_file():
            raise ExportError(f"{item.id}: missing {relative(output)}")
        if not is_current:
            raise ExportError(f"{item.id}: EPUB is stale; rebuild it before checking")
        validate_epub(output, {
            chapter_href(section, language, level): (relative(version.source_path), language)
            for section in item.sections
            for (language, level), version in section.versions.items()
        })
        run_epubcheck(output, epubcheck_jar)
        print(f"{item.id}: valid")
        return False
    if is_current and not force:
        if epubcheck_jar is not None:
            validate_epub(output, {
                chapter_href(section, language, level): (relative(version.source_path), language)
                for section in item.sections
                for (language, level), version in section.versions.items()
            })
            run_epubcheck(output, epubcheck_jar)
        print(f"{item.id}: unchanged, skipped")
        return False

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    handle, temporary_name = tempfile.mkstemp(
        prefix=f".{item.id}.",
        suffix=".epub.tmp",
        dir=OUTPUT_ROOT,
    )
    os.close(handle)
    temporary = Path(temporary_name)
    try:
        expected_sources = write_epub(item, temporary)
        validate_epub(temporary, expected_sources)
        run_epubcheck(temporary, epubcheck_jar)
        os.replace(temporary, output)
    except Exception:
        temporary.unlink(missing_ok=True)
        raise
    state[item.id] = {
        "fingerprint": current_fingerprint,
        "output": relative(output),
        "builtAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
    }
    print(f"{item.id}: built {relative(output)}")
    return True


def select_items(items: list[Item], item_id: str | None, all_items: bool) -> list[Item]:
    if item_id:
        selected = [item for item in items if item.id == item_id]
        if not selected:
            raise ExportError(f"Unknown item ID {item_id!r}; use --list to see available items")
        return selected
    if all_items:
        return items
    raise ExportError("Choose --item ITEM_ID or --all")


def execute_builds(
    selected: list[Item],
    force: bool,
    check: bool,
    epubcheck_jar: Path | None,
) -> int:
    state = load_state()
    failures = 0
    changed = False
    for item in selected:
        try:
            changed = build_item(item, state, force, check, epubcheck_jar) or changed
        except (ExportError, OSError, zipfile.BadZipFile) as exc:
            failures += 1
            print(f"{item.id}: failed: {exc}", file=sys.stderr)
    if changed and not check:
        save_state(state)
    return 1 if failures else 0


def content_snapshot(item_id: str | None = None) -> dict[str, tuple[int, int]]:
    snapshot: dict[str, tuple[int, int]] = {}
    if not ITEMS_ROOT.is_dir():
        return snapshot
    for path in ITEMS_ROOT.rglob("*"):
        if not path.is_file():
            continue
        try:
            relative_parts = path.relative_to(ITEMS_ROOT).parts
        except ValueError:
            continue
        if len(relative_parts) < 3:
            continue
        owner = relative_parts[1]
        if item_id and owner != item_id:
            continue
        stat = path.stat()
        snapshot[path.as_posix()] = (stat.st_mtime_ns, stat.st_size)
    return snapshot


def changed_item_ids(
    previous: dict[str, tuple[int, int]],
    current: dict[str, tuple[int, int]],
) -> set[str]:
    changed_paths = {
        path
        for path in previous.keys() | current.keys()
        if previous.get(path) != current.get(path)
    }
    owners: set[str] = set()
    for value in changed_paths:
        path = Path(value)
        try:
            parts = path.relative_to(ITEMS_ROOT).parts
        except ValueError:
            continue
        if len(parts) >= 2:
            owners.add(parts[1])
    return owners


def watch(item_id: str | None, epubcheck_jar: Path | None) -> int:
    try:
        items = discover_items()
        selected = select_items(items, item_id, not bool(item_id))
    except ExportError as exc:
        print(f"EPUB watch failed: {exc}", file=sys.stderr)
        return 1
    execute_builds(selected, False, False, epubcheck_jar)
    previous = content_snapshot(item_id)
    print("\nWatching VIA Fabula content… Press Ctrl+C to stop.")
    if hasattr(signal, "SIGBREAK"):
        def interrupt_watch(_signum: int, _frame: object) -> None:
            raise KeyboardInterrupt

        signal.signal(signal.SIGBREAK, interrupt_watch)
    try:
        while True:
            time.sleep(1)
            current = content_snapshot(item_id)
            owners = changed_item_ids(previous, current)
            if not owners:
                continue
            time.sleep(0.5)
            current = content_snapshot(item_id)
            owners |= changed_item_ids(previous, current)
            previous = current
            for owner in sorted(owners):
                print(f"\n{owner}: change detected")
                try:
                    items = discover_items()
                    selected = [item for item in items if item.id == owner]
                    if not selected:
                        print(f"{owner}: item removed or renamed; existing artifact retained")
                        continue
                    execute_builds(selected, False, False, epubcheck_jar)
                except (ExportError, OSError) as exc:
                    print(f"{owner}: recoverable build error: {exc}", file=sys.stderr)
    except KeyboardInterrupt:
        print("\nStopped watching.")
        return 0


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python tools/build-epub.py --item frankenstein
  python tools/build-epub.py --all --force
  python tools/build-epub.py --watch --item frankenstein
  python tools/build-epub.py --all --check
""",
    )
    target = result.add_mutually_exclusive_group()
    target.add_argument("--item", metavar="ITEM_ID", help="build or check one canonical item")
    target.add_argument("--all", action="store_true", help="build or check every canonical item")
    target.add_argument("--list", action="store_true", help="list canonical exportable items")
    result.add_argument("--force", action="store_true", help="rebuild even when inputs are unchanged")
    result.add_argument("--watch", action="store_true", help="poll content/items and rebuild affected items")
    result.add_argument(
        "--check",
        action="store_true",
        help="validate existing current EPUBs without rebuilding them",
    )
    result.add_argument(
        "--epubcheck",
        metavar="JAR",
        type=Path,
        help="also validate with the specified official EPUBCheck JAR",
    )
    return result


def main() -> int:
    args = parser().parse_args()
    if args.list and (args.force or args.watch or args.check):
        parser().error("--list cannot be combined with --force, --watch, or --check")
    if args.watch and (args.force or args.check or args.all):
        parser().error("--watch may only be combined with --item and --epubcheck")
    if args.force and args.check:
        parser().error("--force and --check cannot be combined")
    epubcheck_value = args.epubcheck or (
        Path(os.environ["EPUBCHECK_JAR"]) if os.environ.get("EPUBCHECK_JAR") else None
    )
    if args.watch:
        return watch(args.item, epubcheck_value)
    try:
        items = discover_items()
        if args.list:
            for item in items:
                print(
                    f"{item.id}\t{item.title}\t"
                    f"{len(item.sections)} sections\t{len(tracks(item))} tracks"
                )
            return 0
        selected = select_items(items, args.item, args.all)
        return execute_builds(selected, args.force, args.check, epubcheck_value)
    except (ExportError, OSError) as exc:
        print(f"EPUB export failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
