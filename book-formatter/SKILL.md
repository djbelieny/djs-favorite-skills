---
name: book-formatter
description: "Book-specific assembly: front-matter, back-matter, page layout, i18n labels, and PDF export. Combines chapter markdown files into a complete, professionally formatted book DOCX. Depends on md-to-docx for markdown conversion."
---

# Book Formatter

## Overview

Assembles complete books from chapter files and configuration. Handles front-matter (title page, copyright, dedication, table of contents), back-matter (about author, acknowledgments, bibliography), i18n labels, page-size presets, and PDF export.

## Usage

### Command Line

```bash
# Assemble a book from config
node assemble-book.js book-config.json output.docx

# With PDF export
node assemble-book.js book-config.json output.docx --pdf
```

### Book Config Format

```json
{
  "title": "Book Title",
  "subtitle": "Subtitle",
  "author": "Author Name",
  "language": "en-US",
  "pageSize": "trade-6x9",
  "stylePreset": "book",
  "dedication": "Dedication text...",
  "copyright": {
    "year": 2025,
    "holder": "Author Name",
    "isbn": "978-0-000-00000-0"
  },
  "frontMatter": ["halfTitle", "titlePage", "copyright", "dedication", "toc"],
  "backMatter": ["aboutAuthor"],
  "chapters": [
    { "type": "preface", "title": "Preface", "file": "preface.md" },
    { "type": "chapter", "number": 1, "title": "Chapter Title", "file": "ch01.md" },
    { "type": "chapter", "number": 2, "title": "Chapter Title", "file": "ch02.md" },
    { "type": "conclusion", "title": "Conclusion", "file": "conclusion.md" }
  ]
}
```

### Chapter Sources

Chapters can be provided as:
- **Markdown files**: `"file": "ch01.md"` — converted via md-to-docx
- **Inline content**: `"content": ["Paragraph 1", "Paragraph 2"]` — legacy format from old ghostwriter

### Page Size Presets

- `trade-6x9` — 6" x 9" (standard trade paperback)
- `letter` — 8.5" x 11" (US letter)
- `a5` — 5.83" x 8.27" (A5 international)
- `digest-5.5x8.5` — 5.5" x 8.5" (digest size)
- `royal-6.14x9.21` — 6.14" x 9.21" (royal format)

### i18n (Internationalization)

All labels (Dedication, Table of Contents, Chapter, Part, copyright text, etc.) are loaded from `assets/i18n/{language}.json`. Supported languages:
- `en-US` — English
- `pt-BR` — Portuguese (Brazil)
- `es` — Spanish

## Dependencies

- Node.js
- `docx` package
- `md-to-docx` skill (sibling skill for markdown conversion)
- LibreOffice (optional, for PDF export): `brew install libreoffice`

## Installation

```bash
cd ~/.claude/skills/book-formatter
npm install
```
