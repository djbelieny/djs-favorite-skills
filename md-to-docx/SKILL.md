---
name: md-to-docx
description: "Converts markdown files to professionally formatted DOCX documents using proper Word styles. Supports style presets (book, report, academic, business) and custom configurations. Foundation for document generation."
---

# Markdown to DOCX Converter

## Overview

Converts markdown files to properly formatted DOCX documents using Word styles (not inline formatting). Every paragraph uses proper style assignments (`heading`, `style`) so documents are professionally structured and easily customizable in Word.

## Usage

### Command Line

```bash
# Basic conversion with default preset
node convert.js input.md output.docx

# With a style preset
node convert.js input.md output.docx --preset book

# With a custom config file
node convert.js input.md output.docx --config custom.json
```

### As Library

```javascript
const { convert, convertMarkdown } = require('./scripts/convert.js');

// Convert a markdown file
await convert('input.md', 'output.docx', { preset: 'book' });

// Convert markdown string to docx buffer
const buffer = await convertMarkdown(markdownString, { preset: 'report' });
```

## Style Presets

Located in `assets/presets/`:

- **book.json** - Garamond, 6x9 trade paperback, justified text, first-line indent
- **report.json** - Arial, letter size, left-aligned, professional reports
- **academic.json** - Times New Roman, letter size, double-spaced, academic papers
- **business.json** - Calibri, letter size, clean business documents

## Markdown Support

### Supported Elements
- `#` through `######` - Headings (mapped to Heading1-Heading6 styles)
- Regular paragraphs - Normal style
- `**bold**` and `*italic*` - Inline formatting within paragraphs
- `***bold italic***` - Combined bold and italic
- `> blockquote` - Quote style with indentation
- `- item` or `* item` - Unordered lists (ListParagraph style)
- `1. item` - Ordered lists (ListParagraph style)
- `---` or `***` or `___` - Horizontal rules (scene breaks)
- `` `code` `` - Inline code
- Code blocks (``` fenced) - Code style with monospace font

### Style Mapping
| Markdown | Word Style |
|----------|-----------|
| `#` | Heading 1 |
| `##` | Heading 2 |
| `###` | Heading 3 |
| `####` | Heading 4 |
| `#####` | Heading 5 |
| `######` | Heading 6 |
| Paragraph | Normal |
| `>` | Quote |
| List items | ListParagraph |
| Code block | Code |

## Custom Configuration

Create a JSON file following the preset format to customize any aspect:

```json
{
  "name": "custom",
  "page": {
    "width": 12240,
    "height": 15840,
    "margins": { "top": 1440, "bottom": 1440, "left": 1440, "right": 1440 }
  },
  "styles": {
    "default": { "font": "Georgia", "size": 24 },
    "Heading1": { "size": 48, "bold": true, "alignment": "CENTER" },
    "Normal": { "alignment": "LEFT", "spaceBefore": 0, "spaceAfter": 200 }
  }
}
```

## Dependencies

- Node.js
- `docx` package (installed via `npm install` in skill directory)

## Installation

```bash
cd ~/.claude/skills/md-to-docx
npm install
```
