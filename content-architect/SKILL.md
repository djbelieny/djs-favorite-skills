---
name: content-architect
description: "Designs structure for multi-part content: books, courses, talks, programs. Creates comprehensive structure proposals with transformational journey, audience analysis, and content organization."
---

# Content Architect

## Overview

Designs the structure and architecture for any multi-part content project. Works with or without a voice profile. Produces a Structure Proposal that maps out the complete content journey from audience analysis through detailed part/chapter/module organization.

## Usage

Provide project context (topic, audience, goals, existing materials) and optionally a voice profile. Select a content type preset or describe a custom format.

## Content Types

This skill supports multiple content formats via presets:

- **Book** (`presets/book.md`): Traditional book with parts, chapters, front/back matter
- **Course** (`presets/course.md`): Educational course with modules, lessons, assessments
- **Talk Series** (`presets/talk-series.md`): Series of presentations or talks

For custom formats, describe the desired structure and this skill will adapt the architecture accordingly.

## Workflow

### Step 1 - Project Intake

Gather essential information:
- **Content type**: Book, course, talk series, or custom
- **Topic/subject**: What the content is about
- **Target audience**: Who will consume this content
- **Core problem**: What problem does this content solve
- **Desired transformation**: What change should the audience experience
- **Existing materials**: Source materials, outlines, notes
- **Voice profile**: (optional) Output from voice-extractor
- **Language**: Primary language for the content
- **Constraints**: Length, number of parts, timeline, publishing goals

### Step 2 - Audience & Transformation Analysis

Define:
- Primary audience profile (demographic, psychographic)
- Current state (struggles, pain points, confusion)
- Desired state (transformation, achievement, understanding)
- Core question the content answers
- Key shifts required (mindset, belief, behavior)

### Step 3 - Core Framework Design

Identify and articulate:
- The author's unique method, system, or framework (if applicable)
- Core principles or pillars
- Visual models or diagrams (if applicable)
- How the framework drives the content structure

### Step 4 - Content Architecture

Design the full structure:
- Choose architecture type (linear, problem-solution, journey-based, modular, framework-based)
- Organize into parts/sections (if applicable)
- Detail each chapter/module/talk with:
  - Title
  - Core concept
  - Key takeaway for the audience
  - Transition/bridge to next section
- Map source materials to content sections
- Define recurring elements (stories, exercises, reflections, summaries)

### Step 5 - Generate Structure Proposal

Fill in the structure proposal template at `templates/structure-proposal.md` using the appropriate content type preset for reference.

### Step 6 - User Approval

Present the Structure Proposal for review. Iterate based on feedback until the structure is approved.

## Output

A completed **Structure Proposal** document (markdown) ready to guide content creation.

## Templates

- `templates/structure-proposal.md` - Main structure proposal template
- `templates/presets/book.md` - Book-specific patterns and conventions
- `templates/presets/course.md` - Course/module patterns
- `templates/presets/talk-series.md` - Talk/presentation series patterns
