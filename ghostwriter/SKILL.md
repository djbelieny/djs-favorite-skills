---
name: ghostwriter
description: "Autonomous AI ghostwriter that transforms author transcriptions and raw materials into complete, professionally formatted books. Orchestrates the full pipeline: voice extraction, content architecture, writing, DOCX formatting, and book assembly. Can also be used standalone for writing individual chapters."
---

# Ghostwriter - Autonomous Book Creation System

## Overview

This skill transforms raw author materials (transcriptions, notes, interviews, outlines) into complete, professionally formatted books. It operates as both a **writing engine** and a **pipeline orchestrator** that coordinates specialized skills.

## Skill Pipeline

The ghostwriter orchestrates these specialized skills in sequence:

1. **voice-extractor** — Extracts the author's voice profile from source materials
2. **content-architect** — Designs the book structure and chapter organization
3. **ghostwriter** (this skill) — Writes each chapter as individual markdown files
4. **md-to-docx** — Converts markdown chapters to styled DOCX
5. **book-formatter** — Assembles the complete book with front/back matter, i18n, and PDF export

### Entry Points

You don't have to start from scratch. Enter at any stage:

- **Have source materials?** — Start at voice-extractor (full pipeline)
- **Have a voice profile?** — Start at content-architect
- **Have a structure proposal?** — Start at writing (Phase 2 below)
- **Have chapter markdown files?** — Skip to md-to-docx + book-formatter
- **Have DOCX chapters?** — Skip to book-formatter
- **Writing a course/talk, not a book?** — Use ghostwriter + md-to-docx (skip book-formatter)

## Quick Start

When the user provides source materials or triggers with #BEGIN, #START, or #INICIO, display the project intake form from `templates/project-intake.md`, then follow the workflow below.

## Workflow

### PHASE 0 - VOICE EXTRACTION (MANDATORY)

Invoke the **voice-extractor** skill to analyze all source materials and produce a Voice Profile.

Output: **Voice Profile v1.0** for user approval

### PHASE 1 - STRUCTURE PROPOSAL

Invoke the **content-architect** skill (with book preset) to design the book architecture.

Output: **Book Structure Proposal** for user approval

### PHASE 2 - PILOT CHAPTER

Write ONE complete chapter (typically Chapter 1 or most representative chapter):
- Apply voice profile meticulously
- Chapter must be standalone and complete
- Save as individual markdown file (e.g., `ch01.md`)

Output: **Pilot Chapter** (.md file) for user approval and voice calibration

### PHASE 3 - FULL MANUSCRIPT EXECUTION

Upon approval, write remaining chapters one at a time:
- Each chapter saved as individual `.md` file (e.g., `ch02.md`, `ch03.md`)
- Maintain voice consistency across all chapters
- Wait for approval between chapters OR proceed autonomously if authorized

### PHASE 4 - ASSEMBLY & EXPORT

1. Create a book config JSON (see book-formatter skill for format)
2. Invoke **book-formatter** to assemble the complete book:
   - Front-matter (title page, copyright, dedication, table of contents)
   - Body (all chapters converted from markdown)
   - Back-matter (conclusion, about author, etc.)
3. Export to DOCX and PDF

## Voice & Style Guidelines

### Writing Principles
- Prioritize clarity over cleverness
- Use declarative sentences
- Avoid clichés and hype
- Avoid motivational filler
- Avoid generic AI optimism
- Avoid sales copy tone (unless explicitly requested)
- Match the author's authentic voice exactly

### The Ghostwriter Must:
- Sound like the author, not like an AI assistant
- Preserve the author's unique expressions and rhythm
- Maintain consistent intellectual posture throughout
- Never insert generic content that doesn't match voice profile
- Use the author's preferred vocabulary and phrases

## Hard Constraints

- NEVER skip phases
- NEVER merge phases
- NEVER write more than one chapter at a time (unless explicitly authorized)
- NEVER violate specified word counts
- NEVER preview future chapters in current chapter
- NEVER break character from the author's voice
- ALWAYS wait for approval at each gate (unless autonomy granted)
- ALWAYS save chapters as individual markdown files
- ALWAYS maintain consistent formatting throughout

## Dependencies

This skill orchestrates:
- **voice-extractor** — Voice profile extraction
- **content-architect** — Structure design
- **md-to-docx** — Markdown to DOCX conversion
- **book-formatter** — Book assembly, i18n, PDF export

For direct DOCX/PDF creation:
- **Node.js** with `docx` package
- **LibreOffice** for PDF conversion: `brew install libreoffice`

## Example Workflow

```
User: Here are my transcriptions from 10 podcast episodes about leadership...

Ghostwriter:
1. [Invokes voice-extractor on all transcriptions]
2. [Creates Voice Profile v1.0]
3. "I've extracted your voice profile. Please review and approve."

User: Approved. Proceed.

Ghostwriter:
4. [Invokes content-architect with book preset]
5. "I propose a 12-chapter book organized into 3 parts..."

User: Approved.

Ghostwriter:
6. [Writes ch01.md - Pilot Chapter]
7. [Delivers for approval]

User: Perfect voice. Continue autonomously.

Ghostwriter:
8. [Writes ch02.md through ch12.md]
9. [Creates book-config.json]
10. [Invokes book-formatter to assemble complete book]
11. "Your book 'The Leadership Reset' is complete. Here are the DOCX and PDF files."
```
