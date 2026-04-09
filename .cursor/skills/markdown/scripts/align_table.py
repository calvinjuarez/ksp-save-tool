#!/usr/bin/env python3
"""
Align a GitHub-flavored Markdown pipe table for markdownlint MD055 / MD060.

- Leading | only on each row (no trailing |).
- Delimiter row uses exactly three hyphens per column; pad between columns, not after the last cell.
- No trailing whitespace at end of line (last column is not right-padded).
- Column widths are the max width of each column across rows (minimum 3 for the delimiter).

Pass table rows on stdin (header and body lines only; delimiter rows are ignored and recomputed).

Example:

	echo '| Name | Role' | cat - doc-lines.txt | python align_table.py
"""

from __future__ import annotations

import re
import sys


def split_row(line: str) -> list[str] | None:
	s = line.strip()
	if not s.startswith('|'):
		return None
	s = s[1:]
	if s.endswith('|'):
		s = s[:-1]
	return [c.strip() for c in s.split('|')]


def is_delimiter_row(cells: list[str]) -> bool:
	if not cells:
		return False
	for c in cells:
		if not c:
			continue
		if not re.fullmatch(r'-{3,}', c.strip()):
			return False
	return True


def column_widths(rows: list[list[str]]) -> list[int]:
	cols = max(len(r) for r in rows) if rows else 0
	widths = [0] * cols
	for r in rows:
		for i in range(cols):
			cell = r[i] if i < len(r) else ''
			widths[i] = max(widths[i], len(cell))
	return [max(w, 3) for w in widths]


def emit_row(cells: list[str], widths: list[int]) -> str:
	padded = []
	for i, w in enumerate(widths):
		c = cells[i] if i < len(cells) else ''
		if i == len(widths) - 1:
			padded.append(c)
		else:
			padded.append(c.ljust(w))
	return '| ' + ' | '.join(padded)


def emit_delimiter(widths: list[int]) -> str:
	padded = []
	for i, w in enumerate(widths):
		inner = '---' + ' ' * max(0, w - 3)
		if i == len(widths) - 1:
			padded.append(inner.rstrip())
		else:
			padded.append(inner.ljust(w))
	return '| ' + ' | '.join(padded)


def align_table(lines: list[str]) -> str:
	rows: list[list[str]] = []
	for line in lines:
		cells = split_row(line)
		if cells is None:
			continue
		if is_delimiter_row(cells):
			continue
		rows.append(cells)
	if not rows:
		return ''

	cols = max(len(r) for r in rows)
	for r in rows:
		while len(r) < cols:
			r.append('')

	widths = column_widths(rows)
	out: list[str] = []
	for i, r in enumerate(rows):
		out.append(emit_row(r, widths))
		if i == 0:
			out.append(emit_delimiter(widths))
	return '\n'.join(out)


def main() -> None:
	text = sys.stdin.read()
	if not text.strip():
		sys.exit(0)
	lines = text.splitlines()
	result = align_table(lines)
	if result:
		print(result)


if __name__ == '__main__':
	main()
