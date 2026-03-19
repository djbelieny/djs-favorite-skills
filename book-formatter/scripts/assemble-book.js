/**
 * Book Formatter - Assembly Script
 *
 * Assembles complete books from chapter files and configuration.
 * Handles front-matter, back-matter, i18n labels, page-size presets, and PDF export.
 *
 * Usage: node assemble-book.js <config.json> <output.docx> [--pdf]
 *
 * Depends on: md-to-docx skill (sibling) for markdown conversion
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  Footer,
  AlignmentType,
  PageNumber,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
  SectionType,
} = require('docx');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Load md-to-docx for markdown processing ---

const MD_TO_DOCX_PATH = path.join(__dirname, '..', '..', 'md-to-docx', 'scripts', 'convert.js');
let mdConverter;
try {
  mdConverter = require(MD_TO_DOCX_PATH);
} catch (e) {
  console.warn('Warning: md-to-docx skill not found. Markdown file chapters will not be supported.');
  console.warn('Expected at:', MD_TO_DOCX_PATH);
}

// --- i18n ---

const I18N_DIR = path.join(__dirname, '..', 'assets', 'i18n');

function loadI18n(language) {
  const langPath = path.join(I18N_DIR, `${language}.json`);
  if (!fs.existsSync(langPath)) {
    console.warn(`Warning: Language "${language}" not found. Falling back to en-US.`);
    return JSON.parse(fs.readFileSync(path.join(I18N_DIR, 'en-US.json'), 'utf8'));
  }
  return JSON.parse(fs.readFileSync(langPath, 'utf8'));
}

// --- Page Size Presets ---

const PAGE_SIZES = {
  'trade-6x9': { width: 8640, height: 12960 },
  'letter': { width: 12240, height: 15840 },
  'a5': { width: 8392, height: 11907 },
  'digest-5.5x8.5': { width: 7920, height: 12240 },
  'royal-6.14x9.21': { width: 8842, height: 13262 },
};

const DEFAULT_MARGINS = {
  'trade-6x9': { top: 1512, bottom: 864, left: 864, right: 1008, gutter: 504, mirror: true },
  'letter': { top: 1440, bottom: 1440, left: 1440, right: 1440, gutter: 0, mirror: false },
  'a5': { top: 1080, bottom: 720, left: 720, right: 720, gutter: 432, mirror: true },
  'digest-5.5x8.5': { top: 1296, bottom: 864, left: 864, right: 864, gutter: 432, mirror: true },
  'royal-6.14x9.21': { top: 1440, bottom: 864, left: 864, right: 1008, gutter: 504, mirror: true },
};

// --- Typography ---

const FONT_FAMILY = 'Garamond';
const FONT = {
  BODY: 28,
  TITLE: 72,
  SUBTITLE: 40,
  CHAPTER_TITLE: 52,
  SUBHEADING: 28,
  PAGE_NUMBER: 20,
  COPYRIGHT: 22,
};
const SPACING = {
  PARAGRAPH_BEFORE: 120,
  PARAGRAPH_AFTER: 240,
  CHAPTER_BEFORE: 480,
  CHAPTER_AFTER: 480,
  FIRST_LINE_INDENT: 0,
};

// --- Helper: Create body paragraph ---

function createBodyParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: {
      before: SPACING.PARAGRAPH_BEFORE,
      after: SPACING.PARAGRAPH_AFTER,
      line: 240,
      lineRule: 'auto',
    },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: FONT.BODY,
      }),
    ],
  });
}

// --- Front Matter ---

function createHalfTitlePage(config) {
  const elements = [];
  for (let i = 0; i < 12; i++) {
    elements.push(new Paragraph({ children: [] }));
  }
  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: config.title.toUpperCase(),
        font: FONT_FAMILY,
        size: FONT.TITLE,
        bold: true,
      }),
    ],
  }));
  elements.push(new Paragraph({ children: [new PageBreak()] }));
  return elements;
}

function createTitlePage(config) {
  const elements = [];

  for (let i = 0; i < 8; i++) {
    elements.push(new Paragraph({ children: [] }));
  }

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: config.title.toUpperCase(),
        font: FONT_FAMILY,
        size: FONT.TITLE,
        bold: true,
      }),
    ],
  }));

  if (config.subtitle) {
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: config.subtitle,
          font: FONT_FAMILY,
          size: FONT.SUBTITLE,
          italics: true,
        }),
      ],
    }));
  }

  for (let i = 0; i < 10; i++) {
    elements.push(new Paragraph({ children: [] }));
  }

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: config.author,
        font: FONT_FAMILY,
        size: FONT.BODY,
        bold: true,
      }),
    ],
  }));

  elements.push(new Paragraph({ children: [new PageBreak()] }));
  return elements;
}

function createCopyrightPage(config, i18n) {
  const elements = [];
  const copyright = config.copyright || {};
  const year = copyright.year || new Date().getFullYear();
  const holder = copyright.holder || config.author;

  elements.push(new Paragraph({ children: [new PageBreak()] }));

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: `${i18n.copyright} © ${year} ${holder}`,
        font: FONT_FAMILY,
        size: FONT.COPYRIGHT,
      }),
    ],
  }));

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: i18n.allRightsReserved,
        font: FONT_FAMILY,
        size: FONT.COPYRIGHT,
      }),
    ],
  }));

  if (copyright.isbn) {
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `ISBN: ${copyright.isbn}`,
          font: FONT_FAMILY,
          size: FONT.COPYRIGHT,
        }),
      ],
    }));
  }

  elements.push(new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: i18n.noReproduction,
        font: FONT_FAMILY,
        size: FONT.COPYRIGHT,
      }),
    ],
  }));

  elements.push(new Paragraph({ children: [new PageBreak()] }));
  return elements;
}

function createDedicationPage(config, i18n) {
  if (!config.dedication) return [];
  const elements = [];

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 400 },
    children: [
      new TextRun({
        text: i18n.dedication,
        font: FONT_FAMILY,
        size: FONT.BODY,
        bold: true,
      }),
    ],
  }));

  elements.push(new Paragraph({ children: [] }));

  const paragraphs = config.dedication.split('\n').filter(p => p.trim());
  for (const para of paragraphs) {
    elements.push(new Paragraph({
      alignment: AlignmentType.BOTH,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: para.trim(),
          font: FONT_FAMILY,
          size: FONT.BODY,
        }),
      ],
    }));
  }

  elements.push(new Paragraph({ children: [new PageBreak()] }));
  return elements;
}

function createTableOfContents(config, i18n) {
  const elements = [];

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: i18n.tableOfContents,
        font: FONT_FAMILY,
        size: FONT.TITLE,
        bold: true,
      }),
    ],
  }));

  elements.push(new Paragraph({ children: [] }));

  if (config.chapters) {
    for (const chapter of config.chapters) {
      let tocText = '';

      if (chapter.type === 'preface' || chapter.type === 'prefacio') {
        tocText = i18n.preface;
      } else if (chapter.type === 'foreword') {
        tocText = i18n.foreword;
      } else if (chapter.type === 'introduction') {
        tocText = i18n.introduction;
      } else if (chapter.type === 'conclusion' || chapter.type === 'conclusao') {
        tocText = i18n.conclusion;
      } else if (chapter.type === 'epilogue') {
        tocText = i18n.epilogue;
      } else if (chapter.type === 'about' || chapter.type === 'aboutAuthor') {
        tocText = i18n.aboutAuthor;
      } else if (chapter.type === 'acknowledgments') {
        tocText = i18n.acknowledgments;
      } else if (chapter.type === 'bibliography') {
        tocText = i18n.bibliography;
      } else if (chapter.type === 'part' || chapter.type === 'parte') {
        tocText = `${i18n.part} ${chapter.number || ''}: ${chapter.title || ''}`.trim();
      } else if (chapter.type === 'chapter' || chapter.type === 'capitulo') {
        tocText = `${i18n.chapter} ${chapter.number || ''} - ${chapter.title || ''}`.trim();
      } else {
        tocText = chapter.title || '';
      }

      elements.push(new Paragraph({
        tabStops: [
          { type: TabStopType.RIGHT, position: TabStopPosition.MAX, leader: 'dot' },
        ],
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: tocText + '\t',
            font: FONT_FAMILY,
            size: FONT.BODY,
          }),
          new TextRun({
            text: i18n.pageNumberPlaceholder,
            font: FONT_FAMILY,
            size: FONT.BODY,
          }),
        ],
      }));
    }
  }

  elements.push(new Paragraph({ children: [new PageBreak()] }));
  return elements;
}

// --- Chapter Content Processing ---

/**
 * Process legacy inline content (array of paragraph strings with formatting markers).
 */
function processInlineContent(content) {
  const elements = [];
  if (!content || !Array.isArray(content)) return elements;

  for (let index = 0; index < content.length; index++) {
    const para = content[index];

    if (para.startsWith('***') && para.endsWith('***')) {
      elements.push(new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { before: SPACING.PARAGRAPH_BEFORE, after: SPACING.PARAGRAPH_AFTER, line: 240, lineRule: 'auto' },
        children: [
          new TextRun({
            text: para.slice(3, -3),
            font: FONT_FAMILY,
            size: FONT.BODY,
            bold: true,
            italics: true,
          }),
        ],
      }));
    } else if (para.startsWith('**') && para.endsWith('**')) {
      elements.push(new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { before: SPACING.PARAGRAPH_BEFORE, after: SPACING.PARAGRAPH_AFTER, line: 240, lineRule: 'auto' },
        children: [
          new TextRun({
            text: para.slice(2, -2),
            font: FONT_FAMILY,
            size: FONT.BODY,
            bold: true,
          }),
        ],
      }));
    } else if (para.startsWith('*') && para.endsWith('*')) {
      elements.push(new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { before: SPACING.PARAGRAPH_BEFORE, after: SPACING.PARAGRAPH_AFTER, line: 240, lineRule: 'auto' },
        children: [
          new TextRun({
            text: para.slice(1, -1),
            font: FONT_FAMILY,
            size: FONT.BODY,
            italics: true,
          }),
        ],
      }));
    } else if (para.startsWith('##')) {
      elements.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: para.slice(2).trim(),
            font: FONT_FAMILY,
            size: FONT.SUBHEADING,
            bold: true,
          }),
        ],
      }));
    } else if (para.startsWith('> ')) {
      elements.push(new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { before: 200, after: 200 },
        indent: { left: 720, right: 720 },
        children: [
          new TextRun({
            text: para.slice(2),
            font: FONT_FAMILY,
            size: FONT.BODY,
            italics: true,
          }),
        ],
      }));
    } else if (para === '---') {
      elements.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
        children: [
          new TextRun({
            text: '* * *',
            font: FONT_FAMILY,
            size: FONT.BODY,
          }),
        ],
      }));
    } else if (para.trim() === '') {
      elements.push(new Paragraph({ children: [] }));
    } else {
      elements.push(createBodyParagraph(para));
    }
  }

  return elements;
}

/**
 * Process a markdown file into docx elements.
 *
 * Note: We only use md-to-docx's parseMarkdown() to get block tokens (plain data),
 * then rebuild Paragraph/TextRun objects using THIS module's docx import.
 * This avoids the "dual module instance" problem where Paragraph objects from
 * md-to-docx's docx installation are silently dropped by book-formatter's Document.
 */
function processMarkdownFile(filePath, configDir, chapterTitle) {
  if (!mdConverter) {
    throw new Error('md-to-docx skill not available. Cannot process markdown files.');
  }

  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(configDir, filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Chapter file not found: ${resolvedPath}`);
  }

  const md = fs.readFileSync(resolvedPath, 'utf8');
  let blocks = mdConverter.parseMarkdown(md);

  // Skip the first block if it's a heading or paragraph that duplicates the chapter title
  // (many markdown files start with "# Capítulo X — Title" or "Capítulo X — Title")
  if (blocks.length > 0 && chapterTitle) {
    const first = blocks[0];
    if (first.type === 'heading' && first.level === 1) {
      blocks = blocks.slice(1);
    } else if (first.type === 'paragraph') {
      const normalized = first.text.toLowerCase().replace(/[—–-]/g, '').replace(/\s+/g, ' ').trim();
      const titleNormalized = chapterTitle.toLowerCase().replace(/[—–-]/g, '').replace(/\s+/g, ' ').trim();
      if (normalized.includes(titleNormalized) || /^cap[ií]tulo\s+\d+/.test(normalized)) {
        blocks = blocks.slice(1);
      }
    }
  }

  // Merge short single-sentence paragraphs with the following paragraph.
  // In non-fiction, short standalone sentences like "Esse efeito é observável."
  // read better when joined with the explanatory paragraph that follows.
  blocks = mergeShortParagraphs(blocks);

  return blocksToBookElements(blocks);
}

/**
 * Merge short single-sentence paragraphs into the next paragraph.
 * A "short" paragraph is one that is a single sentence (ends with one terminal
 * punctuation) and is under ~100 characters. It gets prepended to the next
 * paragraph block if one follows.
 */
function mergeShortParagraphs(blocks) {
  const MAX_SHORT = 100;
  const merged = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = blocks[i + 1];

    if (
      block.type === 'paragraph' &&
      next && next.type === 'paragraph' &&
      block.text.length <= MAX_SHORT &&
      isSingleSentence(block.text)
    ) {
      // Merge: prepend short paragraph text to the next paragraph
      next.text = block.text + ' ' + next.text;
      // Skip this block; the merged text will be picked up with `next`
    } else {
      merged.push(block);
    }
  }

  return merged;
}

/**
 * Check if text is a single sentence (one terminal punctuation mark at the end).
 */
function isSingleSentence(text) {
  const trimmed = text.trim();
  // Count sentence-ending punctuation (. ! ?) not inside abbreviations
  const endings = trimmed.match(/[.!?]+/g);
  // Single sentence: only one terminal punctuation group, and it's at the end
  return endings && endings.length === 1 && /[.!?]$/.test(trimmed);
}

/**
 * Convert parsed markdown blocks into docx elements using THIS module's docx classes.
 */
function blocksToBookElements(blocks) {
  const elements = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading': {
        // Skip chapter-level headings (H1) since createChapterHeading already adds them
        if (block.level === 1) break;
        elements.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          heading: HeadingLevel[`HEADING_${block.level}`],
          spacing: { before: 400, after: 200 },
          children: parseBookInline(block.text, { bold: true }),
        }));
        break;
      }

      case 'paragraph': {
        elements.push(new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: {
            before: SPACING.PARAGRAPH_BEFORE,
            after: SPACING.PARAGRAPH_AFTER,
            line: 240,
            lineRule: 'auto',
          },
          children: parseBookInline(block.text, {}),
        }));
        break;
      }

      case 'blockquote': {
        elements.push(new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { before: 200, after: 200 },
          indent: { left: 720, right: 720 },
          children: parseBookInline(block.text, { italics: true }),
        }));
        isFirstParagraph = false;
        break;
      }

      case 'unordered-list': {
        for (const item of block.items) {
          elements.push(new Paragraph({
            indent: { left: 720 },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: '\u2022  ', font: FONT_FAMILY, size: FONT.BODY }),
              ...parseBookInline(item, {}),
            ],
          }));
        }
        isFirstParagraph = false;
        break;
      }

      case 'ordered-list': {
        block.items.forEach((item, idx) => {
          elements.push(new Paragraph({
            indent: { left: 720 },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: `${idx + 1}.  `, font: FONT_FAMILY, size: FONT.BODY }),
              ...parseBookInline(item, {}),
            ],
          }));
        });
        isFirstParagraph = false;
        break;
      }

      case 'hr': {
        elements.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
          children: [
            new TextRun({ text: '* * *', font: FONT_FAMILY, size: FONT.BODY }),
          ],
        }));
        isFirstParagraph = true;
        break;
      }

      case 'code': {
        for (const codeLine of block.text.split('\n')) {
          elements.push(new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({ text: codeLine || ' ', font: 'Courier New', size: 20 }),
            ],
          }));
        }
        isFirstParagraph = false;
        break;
      }
    }
  }

  return elements;
}

/**
 * Parse inline markdown (bold, italic, bold-italic, code) into TextRun objects
 * using THIS module's docx TextRun class.
 */
function parseBookInline(text, baseOpts) {
  const runs = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({
        text: text.slice(lastIndex, match.index),
        font: FONT_FAMILY,
        size: FONT.BODY,
        bold: baseOpts.bold || false,
        italics: baseOpts.italics || false,
      }));
    }

    if (match[2]) {
      runs.push(new TextRun({ text: match[2], font: FONT_FAMILY, size: FONT.BODY, bold: true, italics: true }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[3], font: FONT_FAMILY, size: FONT.BODY, bold: true, italics: baseOpts.italics || false }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4], font: FONT_FAMILY, size: FONT.BODY, bold: baseOpts.bold || false, italics: true }));
    } else if (match[5]) {
      runs.push(new TextRun({ text: match[5], font: 'Courier New', size: 20 }));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({
      text: text.slice(lastIndex),
      font: FONT_FAMILY,
      size: FONT.BODY,
      bold: baseOpts.bold || false,
      italics: baseOpts.italics || false,
    }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({
      text: text,
      font: FONT_FAMILY,
      size: FONT.BODY,
      bold: baseOpts.bold || false,
      italics: baseOpts.italics || false,
    }));
  }

  return runs;
}

// --- Chapter Assembly ---

function createChapterHeading(chapter, i18n) {
  const elements = [];

  if (chapter.type === 'part' || chapter.type === 'parte') {
    for (let i = 0; i < 8; i++) {
      elements.push(new Paragraph({ children: [] }));
    }

    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: `${i18n.part} ${chapter.number || ''}`,
          font: FONT_FAMILY,
          size: FONT.TITLE,
          bold: true,
        }),
      ],
    }));

    if (chapter.title) {
      elements.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: chapter.title,
            font: FONT_FAMILY,
            size: FONT.SUBTITLE,
            italics: true,
          }),
        ],
      }));
    }

    elements.push(new Paragraph({ children: [new PageBreak()] }));
  } else {
    let headingText = '';

    if (chapter.type === 'preface' || chapter.type === 'prefacio') {
      headingText = i18n.preface;
    } else if (chapter.type === 'foreword') {
      headingText = i18n.foreword;
    } else if (chapter.type === 'introduction') {
      headingText = i18n.introduction;
    } else if (chapter.type === 'conclusion' || chapter.type === 'conclusao') {
      headingText = i18n.conclusion;
    } else if (chapter.type === 'epilogue') {
      headingText = i18n.epilogue;
    } else if (chapter.type === 'about' || chapter.type === 'aboutAuthor') {
      headingText = i18n.aboutAuthor;
    } else if (chapter.type === 'acknowledgments') {
      headingText = i18n.acknowledgments;
    } else if (chapter.type === 'bibliography') {
      headingText = i18n.bibliography;
    } else {
      headingText = `${i18n.chapter} ${chapter.number || ''}`;
    }

    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: SPACING.CHAPTER_BEFORE, after: 200 },
      children: [
        new TextRun({
          text: headingText,
          font: FONT_FAMILY,
          size: FONT.TITLE,
          bold: true,
        }),
      ],
    }));

    // Chapter title (for numbered chapters)
    const showTitle = chapter.title &&
      chapter.type !== 'preface' && chapter.type !== 'prefacio' &&
      chapter.type !== 'foreword' && chapter.type !== 'introduction';

    if (showTitle) {
      elements.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: SPACING.CHAPTER_AFTER },
        children: [
          new TextRun({
            text: chapter.title,
            font: FONT_FAMILY,
            size: FONT.CHAPTER_TITLE,
          }),
        ],
      }));
    }

    if (chapter.subtitle) {
      elements.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: SPACING.CHAPTER_AFTER },
        children: [
          new TextRun({
            text: chapter.subtitle,
            font: FONT_FAMILY,
            size: FONT.BODY,
            italics: true,
          }),
        ],
      }));
    }
  }

  return elements;
}

/**
 * Create chapter heading elements (for the title page section).
 * Content is returned separately so each can be its own section.
 */
function createChapterContent(chapter, i18n, configDir) {
  const elements = [];

  if (chapter.file) {
    elements.push(...processMarkdownFile(chapter.file, configDir, chapter.title));
  } else if (chapter.content) {
    elements.push(...processInlineContent(chapter.content));
  }

  return elements;
}

// --- Book Assembly ---

function assembleBook(config, configDir) {
  const language = config.language || 'en-US';
  const i18n = loadI18n(language);
  const pageSize = config.pageSize || 'trade-6x9';
  const pageDims = PAGE_SIZES[pageSize] || PAGE_SIZES['trade-6x9'];
  const margins = DEFAULT_MARGINS[pageSize] || DEFAULT_MARGINS['trade-6x9'];
  const langCode = language || 'en-US';

  // Common page properties for all sections
  const pageProps = {
    page: {
      size: { width: pageDims.width, height: pageDims.height },
      margin: {
        top: margins.top,
        bottom: margins.bottom,
        left: margins.left,
        right: margins.right,
        gutter: margins.gutter,
      },
    },
  };

  // Common footers for body sections (even/odd page numbers)
  const bodyFooters = {
    default: new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ children: [PageNumber.CURRENT], font: FONT_FAMILY, size: FONT.PAGE_NUMBER }),
          ],
        }),
      ],
    }),
    even: new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({ children: [PageNumber.CURRENT], font: FONT_FAMILY, size: FONT.PAGE_NUMBER }),
          ],
        }),
      ],
    }),
  };

  // Empty footer for chapter title pages (no page number on the title page)
  const emptyFooters = {
    default: new Footer({ children: [new Paragraph({ children: [] })] }),
    even: new Footer({ children: [new Paragraph({ children: [] })] }),
  };

  const sections = [];

  // --- Front matter (single section) ---
  const frontMatterChildren = [];
  const frontMatter = config.frontMatter || ['halfTitle', 'titlePage', 'copyright', 'dedication', 'toc'];

  for (const fm of frontMatter) {
    switch (fm) {
      case 'halfTitle': frontMatterChildren.push(...createHalfTitlePage(config)); break;
      case 'titlePage': frontMatterChildren.push(...createTitlePage(config)); break;
      case 'copyright': frontMatterChildren.push(...createCopyrightPage(config, i18n)); break;
      case 'dedication': frontMatterChildren.push(...createDedicationPage(config, i18n)); break;
      case 'toc': frontMatterChildren.push(...createTableOfContents(config, i18n)); break;
    }
  }

  sections.push({
    properties: { ...pageProps },
    footers: bodyFooters,
    children: frontMatterChildren,
  });

  // --- Body chapters: each chapter = title section (odd page) + content section (odd page) ---
  if (config.chapters) {
    let chapterNum = 1;
    for (const chapter of config.chapters) {
      if (chapter.type === 'chapter' || chapter.type === 'capitulo') {
        chapter.number = chapter.number || chapterNum;
        chapterNum++;
      }

      // Section 1: Chapter title page (starts on odd page, no page number)
      // Includes explicit blank verso page so Word always renders it
      const titleElements = createChapterHeading(chapter, i18n);
      titleElements.push(
        new Paragraph({
          children: [new PageBreak()],
        }),
        new Paragraph({
          children: [],
        }),
      );
      sections.push({
        properties: { ...pageProps, type: SectionType.ODD_PAGE },
        footers: emptyFooters,
        children: titleElements,
      });

      // Section 2: Chapter content (next page, with page numbers)
      const contentElements = createChapterContent(chapter, i18n, configDir);
      if (contentElements.length > 0) {
        sections.push({
          properties: { ...pageProps, type: SectionType.NEXT_PAGE },
          footers: bodyFooters,
          children: contentElements,
        });
      }
    }
  }

  // Create document with styles and multiple sections
  const doc = new Document({
    evenAndOddHeaderAndFooters: true,
    language: { value: langCode },
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: FONT.BODY,
            language: { value: langCode },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: FONT_FAMILY, size: FONT.BODY },
          paragraph: {
            spacing: {
              before: SPACING.PARAGRAPH_BEFORE,
              after: SPACING.PARAGRAPH_AFTER,
              line: 240,
              lineRule: 'auto',
            },
            alignment: AlignmentType.BOTH,
          },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: FONT_FAMILY, size: FONT.TITLE, bold: true },
          paragraph: {
            spacing: { before: 240, after: 240 },
            alignment: AlignmentType.CENTER,
            outlineLevel: 0,
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: FONT_FAMILY, size: FONT.CHAPTER_TITLE },
          paragraph: {
            spacing: { before: 200, after: 200 },
            alignment: AlignmentType.LEFT,
            outlineLevel: 1,
          },
        },
      ],
    },
    sections,
  });

  return { doc, mirrorMargins: margins.mirror || false, langCode };
}

// --- Main ---

/**
 * Post-process the generated DOCX buffer to inject settings the docx library
 * doesn't support natively (mirror margins, document language).
 */
async function postProcessDocx(buffer, options) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);

  // 1. Inject mirror margins into settings.xml
  if (options.mirrorMargins) {
    let settingsXml = await zip.file('word/settings.xml').async('string');
    // Add <w:mirrorMargins/> before the closing </w:settings> tag
    if (!settingsXml.includes('w:mirrorMargins')) {
      settingsXml = settingsXml.replace('</w:settings>', '  <w:mirrorMargins/>\n</w:settings>');
    }
    zip.file('word/settings.xml', settingsXml);
  }

  // 2. Set document language in styles.xml default run properties
  if (options.langCode) {
    let stylesXml = await zip.file('word/styles.xml').async('string');
    // Add w:lang to the default run properties if not already present
    if (!stylesXml.includes('w:lang')) {
      // Find <w:rPrDefault><w:rPr> and add w:lang inside
      stylesXml = stylesXml.replace(
        /(<w:rPrDefault>\s*<w:rPr>)/,
        `$1<w:lang w:val="${options.langCode}"/>`
      );
    }
    zip.file('word/styles.xml', stylesXml);
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node assemble-book.js <config.json> <output.docx> [--pdf]');
    process.exit(1);
  }

  const configPath = args[0];
  const outputPath = args[1];
  const exportPdf = args.includes('--pdf');

  const configDir = path.dirname(path.resolve(configPath));
  const configData = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configData);

  const { doc, mirrorMargins, langCode } = assembleBook(config, configDir);
  let buffer = await Packer.toBuffer(doc);

  // Post-process for mirror margins and language
  buffer = await postProcessDocx(buffer, { mirrorMargins, langCode });
  fs.writeFileSync(outputPath, buffer);

  console.log(`Book assembled: ${outputPath}`);
  console.log(`  Title: ${config.title}`);
  console.log(`  Author: ${config.author}`);
  console.log(`  Language: ${config.language || 'en-US'}`);
  console.log(`  Page size: ${config.pageSize || 'trade-6x9'}`);
  console.log(`  Chapters: ${config.chapters ? config.chapters.length : 0}`);

  if (exportPdf) {
    try {
      const pdfOutput = outputPath.replace(/\.docx$/i, '.pdf');
      execSync(`soffice --headless --convert-to pdf "${outputPath}" --outdir "${path.dirname(outputPath)}"`, {
        stdio: 'pipe',
      });
      console.log(`  PDF exported: ${pdfOutput}`);
    } catch (err) {
      console.error('  PDF export failed. Is LibreOffice installed?');
      console.error('  Install with: brew install libreoffice');
    }
  }
}

// Exports
module.exports = { assembleBook, createChapterHeading, createChapterContent, createTitlePage, createCopyrightPage, createDedicationPage, createTableOfContents };

if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
