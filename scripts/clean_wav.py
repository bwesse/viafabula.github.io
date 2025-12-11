#!/usr/bin/env python3
"""
Clean .wav files under a root directory, with optional date filters.

Examples:

  # Dry-run: show all .wav files under ROOT
  python scripts/clean_wavs.py --root content/books

  # Dry-run: show .wav files modified ON or AFTER 2025-12-11
  python scripts/clean_wavs.py --root content/books --since 2025-12-11

  # Actually delete .wav files ON or AFTER 2025-12-11
  python scripts/clean_wavs.py --root content/books --since 2025-12-11 --really-delete

  # Delete all .wav files (no date filter) under ROOT
  python scripts/clean_wavs.py --root content/books --all --really-delete
"""

import argparse
from pathlib import Path
from datetime import datetime, date
import sys
import os


def parse_date(s: str) -> date:
    """Parse YYYY-MM-DD into a date object."""
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError as e:
        raise argparse.ArgumentTypeError(f"Invalid date '{s}', expected YYYY-MM-DD") from e


def should_delete(file_date: date,
                  since: date | None,
                  before: date | None,
                  delete_all: bool) -> bool:
    """Return True if the file_date matches the deletion criteria."""
    if delete_all:
        return True

    if since is not None and before is not None:
        # Between (inclusive)
        return since <= file_date <= before
    elif since is not None:
        # On or after
        return file_date >= since
    elif before is not None:
        # On or before
        return file_date <= before
    else:
        # No filters and not --all -> never delete
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Delete .wav files under a root folder, optionally filtered by date."
    )
    parser.add_argument(
        "--root",
        type=str,
        default=".",
        help="Root directory to search under (default: current directory).",
    )
    parser.add_argument(
        "--since",
        type=parse_date,
        help="Delete files modified on or after this date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--before",
        type=parse_date,
        help="Delete files modified on or before this date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Delete all .wav files under root (ignores date filters).",
    )
    parser.add_argument(
        "--really-delete",
        action="store_true",
        help="Actually delete files. If not set, only shows what would be deleted (dry-run).",
    )

    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.is_dir():
        print(f"Root is not a directory: {root}")
        sys.exit(1)

    if not args.all and args.since is None and args.before is None:
        print("No filters specified and --all not set -> nothing to delete.")
        print("Use one of: --since YYYY-MM-DD, --before YYYY-MM-DD, or --all.")
        sys.exit(0)

    print(f"Root:   {root}")
    print(f"Since:  {args.since}")
    print(f"Before: {args.before}")
    print(f"All:    {args.all}")
    print(f"Mode:   {'DELETE' if args.really_delete else 'DRY-RUN (no deletions)'}")
    print()

    to_delete: list[Path] = []

    for wav_path in root.rglob("*.wav"):
        # Get modification date
        mtime = datetime.fromtimestamp(wav_path.stat().st_mtime).date()
        if should_delete(mtime, args.since, args.before, args.all):
            to_delete.append(wav_path)

    if not to_delete:
        print("No matching .wav files found.")
        return

    print(f"Found {len(to_delete)} .wav file(s) matching criteria:")
    for p in to_delete:
        mtime = datetime.fromtimestamp(p.stat().st_mtime)
        print(f"  {p}  (mtime: {mtime.isoformat(sep=' ')})")

    print()
    if not args.really_delete:
        print("Dry-run only. No files were deleted.")
        print("Re-run with --really-delete to actually remove them.")
        return

    # Actually delete
    print("Deleting files...")
    for p in to_delete:
        try:
            os.remove(p)
            print(f"  deleted: {p}")
        except OSError as e:
            print(f"  [error] could not delete {p}: {e}")

    print("Done.")


if __name__ == "__main__":
    main()
