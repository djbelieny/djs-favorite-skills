---
name: voice-extractor
description: "Extracts detailed voice profiles from source materials (transcriptions, notes, interviews, audio summaries). Reusable for books, courses, talks, newsletters, or any content requiring authentic voice replication."
---

# Voice Extractor

## Overview

Analyzes source materials to extract a comprehensive voice profile capturing the author's unique cognitive patterns, sentence rhythm, vocabulary, emotional distance, and core convictions. The resulting profile can be used by any writing skill (ghostwriter, content creation, etc.) to produce voice-matched content.

## Usage

Provide source materials (transcriptions, notes, interviews, outlines, audio summaries) and this skill will produce a Voice Profile document.

## Workflow

### Step 1 - Gather Materials

Collect all available source materials. The more diverse the samples, the more accurate the profile:
- Transcriptions (talks, sermons, podcasts, interviews)
- Written notes or drafts
- Published articles or posts
- Audio/video summaries
- Email or message samples

### Step 2 - Analyze Voice Dimensions

Analyze all provided materials and extract the following dimensions:

1. **Cognitive Patterns**: How the author thinks and structures arguments
   - Thinking style (linear, associative, dialectical, narrative, analytical)
   - Argument construction method
   - Intellectual posture (authoritative, conversational, prophetic, teaching, etc.)

2. **Sentence Rhythm**: Typical sentence length, cadence, and flow
   - Length distribution (short/medium/long percentages)
   - Sentence types (declarative, rhetorical, imperative, exclamations)
   - Paragraph structure and transitions

3. **Vocabulary & Expressions**: Signature language patterns
   - Recurring phrases and expressions
   - Metaphor preferences and domains
   - Vocabulary level and register

4. **Emotional Distance**: Level of personal engagement
   - Engagement level (vulnerable, moderate, professional, academic)
   - Emotional expression patterns
   - Reader address style (you, we, third person)

5. **Core Convictions**: The beliefs driving the author's message
   - Central message
   - Key beliefs and worldview elements

6. **Unique Elements**: What makes this voice distinctive
   - Differentiating characteristics
   - Tendencies to replicate and avoid

7. **Voice Capture Test**: Side-by-side comparison
   - Original quote from source material
   - New content written in the author's voice for validation

### Step 3 - Generate Voice Profile

Fill in the voice profile template at `templates/voice-profile.md` with findings from the analysis.

### Step 4 - User Approval

Present the completed Voice Profile for user review and approval. Iterate based on feedback until the profile accurately captures the author's voice.

## Output

A completed **Voice Profile** document (markdown) ready to be used by any downstream writing skill.

## Template

Use the template at `templates/voice-profile.md` to structure the output.
