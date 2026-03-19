/**
 * Markdown to DOCX Converter
 *
 * Converts markdown files to properly formatted DOCX documents using Word styles.
 * Supports style presets and custom configurations.
 *
 * Usage:
 *   node convert.js <input.md> <output.docx> [--preset book|report|academic|business] [--config custom.json]
 *
 * As library:
 *   const { convert, convertMarkdown } = require('./convert.js');
 *   await convert('input.md', 'output.docx', { preset: 'book' });
 *   const buffer = await convertMarkdown(mdString, { preset: 'report' });
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
  LevelFormat,
} = require('docx');
const fs = require('fs');
const path = require('path');

// --- Preset Loading ---

const PRESETS_DIR = path.join(__dirname, '..', 'assets', 'presets');

function loadPreset(name) {
  const presetPath = path.join(PRESETS_DIR, `${name}.json`);
  if (!fs.existsSync(presetPath)) {
    throw new Error(`Preset "${name}" not found at ${presetPath}`);
  }
  return JSON.parse(fs.readFileSync(presetPath, 'utf8'));
}

function getDefaultPreset() {
  return {
    name: 'default',
    page: {
      width: 12240,   // 8.5" letter
      height: 15840,  // 11" letter
      margins: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
    },
    styles: {
      default: { font: 'Calibri', size: 22 },
      Heading1: { size: 36, bold: true, alignment: 'LEFT', spaceBefore: 360, spaceAfter: 200 },
      Heading2: { size: 30, bold: true, alignment: 'LEFT', spaceBefore: 240, spaceAfter: 160 },
      Heading3: { size: 26, bold: true, alignment: 'LEFT', spaceBefore: 200, spaceAfter: 120 },
      Heading4: { size: 24, bold: true, alignment: 'LEFT', spaceBefore: 160, spaceAfter: 100 },
      Heading5: { size: 24, bold: true, italics: true, alignment: 'LEFT', spaceBefore: 120, spaceAfter: 80 },
      Heading6: { size: 22, italics: true, alignment: 'LEFT', spaceBefore: 120, spaceAfter: 80 },
      Normal: { alignment: 'LEFT', spaceBefore: 0, spaceAfter: 200 },
      Quote: { italics: true, indentLeft: 720, indentRight: 720, spaceBefore: 200, spaceAfter: 200 },
      ListParagraph: { indentLeft: 720, spaceBefore: 60, spaceAfter: 60 },
      Code: { font: 'Courier New', size: 20, spaceBefore: 120, spaceAfter: 120 },
    },
    footer: { pageNumbers: true, size: 20, alignment: 'CENTER' },
  };
}

function mergePresets(base, override) {
  const merged = JSON.parse(JSON.stringify(base));
  if (override.page) {
    Object.assign(merged.page, override.page);
    if (override.page.margins) {
      Object.assign(merged.page.margins, override.page.margins);
    }
  }
  if (override.styles) {
    for (const [key, val] of Object.entries(override.styles)) {
      merged.styles[key] = { ...(merged.styles[key] || {}), ...val };
    }
  }
  if (override.footer) {
    Object.assign(merged.footer, override.footer);
  }
  return merged;
}

function resolveConfig(options = {}) {
  let config = getDefaultPreset();
  if (options.preset) {
    const preset = loadPreset(options.preset);
    config = mergePresets(config, preset);
  }
  if (options.config) {
    const custom = typeof options.config === 'string'
      ? JSON.parse(fs.readFileSync(options.config, 'utf8'))
      : options.config;
    config = mergePresets(config, custom);
  }
  return config;
}

// --- Alignment helper ---

function getAlignment(str) {
  if (!str) return undefined;
  const map = {
    LEFT: AlignmentType.LEFT,
    CENTER: AlignmentType.CENTER,
    RIGHT: AlignmentType.RIGHT,
    BOTH: AlignmentType.BOTH,
    JUSTIFIED: AlignmentType.BOTH,
  };
  return map[str.toUpperCase()] || AlignmentType.LEFT;
}

// --- Heading level map ---

const HEADING_LEVELS = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

// --- Inline Markdown Parsing ---

/**
 * Parse inline markdown (bold, italic, bold-italic, code) into TextRun objects.
 */
function parseInlineMarkdown(text, baseStyle) {
  const runs = [];
  // Regex for inline formatting: ***bold italic***, **bold**, *italic*, `code`
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      runs.push(new TextRun({
        text: text.slice(lastIndex, match.index),
        font: baseStyle.font,
        size: baseStyle.size,
        bold: baseStyle.bold || false,
        italics: baseStyle.italics || false,
        color: baseStyle.color,
      }));
    }

    if (match[2]) {
      // ***bold italic***
      runs.push(new TextRun({
        text: match[2],
        font: baseStyle.font,
        size: baseStyle.size,
        bold: true,
        italics: true,
        color: baseStyle.color,
      }));
    } else if (match[3]) {
      // **bold**
      runs.push(new TextRun({
        text: match[3],
        font: baseStyle.font,
        size: baseStyle.size,
        bold: true,
        italics: baseStyle.italics || false,
        color: baseStyle.color,
      }));
    } else if (match[4]) {
      // *italic*
      runs.push(new TextRun({
        text: match[4],
        font: baseStyle.font,
        size: baseStyle.size,
        bold: baseStyle.bold || false,
        italics: true,
        color: baseStyle.color,
      }));
    } else if (match[5]) {
      // `code`
      runs.push(new TextRun({
        text: match[5],
        font: baseStyle.codeFont || 'Courier New',
        size: baseStyle.codeSize || baseStyle.size,
        bold: false,
        italics: false,
        color: baseStyle.color,
      }));
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({
      text: text.slice(lastIndex),
      font: baseStyle.font,
      size: baseStyle.size,
      bold: baseStyle.bold || false,
      italics: baseStyle.italics || false,
      color: baseStyle.color,
    }));
  }

  // If nothing matched, return single run
  if (runs.length === 0) {
    runs.push(new TextRun({
      text: text,
      font: baseStyle.font,
      size: baseStyle.size,
      bold: baseStyle.bold || false,
      italics: baseStyle.italics || false,
      color: baseStyle.color,
    }));
  }

  return runs;
}

// --- Markdown Parsing ---

/**
 * Parse markdown string into an array of block tokens.
 */
function parseMarkdown(md) {
  const lines = md.split('\n');
  const blocks = [];
  let i = 0;
  let paragraphBuffer = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(' ').trim();
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      paragraphBuffer = [];
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      flushParagraph();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      i++; // skip closing ```
      continue;
    }

    // Horizontal rule
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      flushParagraph();
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ') || line === '>') {
      flushParagraph();
      const quoteLines = [];
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ').trim() });
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      flushParagraph();
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'unordered-list', items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'ordered-list', items });
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      flushParagraph();
      i++;
      continue;
    }

    // Regular text — accumulate into paragraph
    paragraphBuffer.push(line);
    i++;
  }

  flushParagraph();
  return blocks;
}

// --- Document Generation ---

/**
 * Build Word document styles from config.
 */
function buildDocStyles(config) {
  const def = config.styles.default || {};
  const styles = {
    default: {
      document: {
        run: {
          font: def.font || 'Calibri',
          size: def.size || 22,
        },
      },
    },
    paragraphStyles: [],
  };

  // Normal style
  const normalConf = config.styles.Normal || {};
  styles.paragraphStyles.push({
    id: 'Normal',
    name: 'Normal',
    run: {
      font: normalConf.font || def.font,
      size: normalConf.size || def.size,
      bold: normalConf.bold,
      italics: normalConf.italics,
      color: normalConf.color,
    },
    paragraph: {
      spacing: {
        before: normalConf.spaceBefore || 0,
        after: normalConf.spaceAfter || 200,
        line: normalConf.lineSpacing || 240,
        lineRule: 'auto',
      },
      alignment: getAlignment(normalConf.alignment),
      indent: normalConf.firstLineIndent ? { firstLine: normalConf.firstLineIndent } : undefined,
    },
  });

  // Heading styles
  for (let level = 1; level <= 6; level++) {
    const key = `Heading${level}`;
    const hConf = config.styles[key] || {};
    styles.paragraphStyles.push({
      id: key,
      name: `Heading ${level}`,
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: {
        font: hConf.font || def.font,
        size: hConf.size || def.size,
        bold: hConf.bold !== undefined ? hConf.bold : (level <= 4),
        italics: hConf.italics,
        color: hConf.color,
      },
      paragraph: {
        spacing: {
          before: hConf.spaceBefore || 240,
          after: hConf.spaceAfter || 120,
        },
        alignment: getAlignment(hConf.alignment),
        outlineLevel: level - 1,
      },
    });
  }

  // Quote style
  const quoteConf = config.styles.Quote || {};
  styles.paragraphStyles.push({
    id: 'Quote',
    name: 'Quote',
    basedOn: 'Normal',
    next: 'Normal',
    run: {
      font: quoteConf.font || def.font,
      size: quoteConf.size || def.size,
      italics: quoteConf.italics !== undefined ? quoteConf.italics : true,
      color: quoteConf.color,
    },
    paragraph: {
      spacing: {
        before: quoteConf.spaceBefore || 200,
        after: quoteConf.spaceAfter || 200,
      },
      indent: {
        left: quoteConf.indentLeft || 720,
        right: quoteConf.indentRight || 720,
      },
      alignment: getAlignment(quoteConf.alignment || 'BOTH'),
    },
  });

  // ListParagraph style
  const listConf = config.styles.ListParagraph || {};
  styles.paragraphStyles.push({
    id: 'ListParagraph',
    name: 'List Paragraph',
    basedOn: 'Normal',
    run: {
      font: listConf.font || def.font,
      size: listConf.size || def.size,
    },
    paragraph: {
      spacing: {
        before: listConf.spaceBefore || 60,
        after: listConf.spaceAfter || 60,
      },
      indent: {
        left: listConf.indentLeft || 720,
      },
    },
  });

  // Code style
  const codeConf = config.styles.Code || {};
  styles.paragraphStyles.push({
    id: 'Code',
    name: 'Code',
    basedOn: 'Normal',
    run: {
      font: codeConf.font || 'Courier New',
      size: codeConf.size || 20,
    },
    paragraph: {
      spacing: {
        before: codeConf.spaceBefore || 120,
        after: codeConf.spaceAfter || 120,
      },
    },
  });

  return styles;
}

/**
 * Convert parsed blocks into docx Paragraph objects.
 */
function blocksToElements(blocks, config) {
  const elements = [];
  const def = config.styles.default || {};
  const codeConf = config.styles.Code || {};
  let isFirstParagraph = true;

  for (const block of blocks) {
    switch (block.type) {
      case 'heading': {
        const hConf = config.styles[`Heading${block.level}`] || {};
        const baseStyle = {
          font: hConf.font || def.font,
          size: hConf.size || def.size,
          bold: hConf.bold !== undefined ? hConf.bold : true,
          italics: hConf.italics,
          color: hConf.color,
          codeFont: codeConf.font || 'Courier New',
          codeSize: codeConf.size || 20,
        };
        elements.push(new Paragraph({
          heading: HEADING_LEVELS[block.level],
          children: parseInlineMarkdown(block.text, baseStyle),
        }));
        isFirstParagraph = true;
        break;
      }

      case 'paragraph': {
        const normalConf = config.styles.Normal || {};
        const baseStyle = {
          font: normalConf.font || def.font,
          size: normalConf.size || def.size,
          bold: normalConf.bold,
          italics: normalConf.italics,
          color: normalConf.color,
          codeFont: codeConf.font || 'Courier New',
          codeSize: codeConf.size || 20,
        };

        // For book preset: first paragraph in section has no indent
        const indent = normalConf.firstLineIndent
          ? (isFirstParagraph ? {} : { firstLine: normalConf.firstLineIndent })
          : undefined;

        elements.push(new Paragraph({
          style: 'Normal',
          indent,
          children: parseInlineMarkdown(block.text, baseStyle),
        }));
        isFirstParagraph = false;
        break;
      }

      case 'blockquote': {
        const quoteConf = config.styles.Quote || {};
        const baseStyle = {
          font: quoteConf.font || def.font,
          size: quoteConf.size || def.size,
          italics: quoteConf.italics !== undefined ? quoteConf.italics : true,
          color: quoteConf.color,
          codeFont: codeConf.font || 'Courier New',
          codeSize: codeConf.size || 20,
        };
        elements.push(new Paragraph({
          style: 'Quote',
          children: parseInlineMarkdown(block.text, baseStyle),
        }));
        isFirstParagraph = false;
        break;
      }

      case 'unordered-list': {
        const listConf = config.styles.ListParagraph || {};
        for (const item of block.items) {
          const baseStyle = {
            font: listConf.font || def.font,
            size: listConf.size || def.size,
            codeFont: codeConf.font || 'Courier New',
            codeSize: codeConf.size || 20,
          };
          elements.push(new Paragraph({
            style: 'ListParagraph',
            numbering: { reference: 'bullet-list', level: 0 },
            children: parseInlineMarkdown(item, baseStyle),
          }));
        }
        isFirstParagraph = false;
        break;
      }

      case 'ordered-list': {
        const listConf = config.styles.ListParagraph || {};
        for (const item of block.items) {
          const baseStyle = {
            font: listConf.font || def.font,
            size: listConf.size || def.size,
            codeFont: codeConf.font || 'Courier New',
            codeSize: codeConf.size || 20,
          };
          elements.push(new Paragraph({
            style: 'ListParagraph',
            numbering: { reference: 'numbered-list', level: 0 },
            children: parseInlineMarkdown(item, baseStyle),
          }));
        }
        isFirstParagraph = false;
        break;
      }

      case 'hr': {
        elements.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
          children: [
            new TextRun({
              text: '* * *',
              font: def.font || 'Calibri',
              size: def.size || 22,
            }),
          ],
        }));
        isFirstParagraph = true;
        break;
      }

      case 'code': {
        const codeFont = codeConf.font || 'Courier New';
        const codeSize = codeConf.size || 20;
        const codeLines = block.text.split('\n');
        for (const codeLine of codeLines) {
          elements.push(new Paragraph({
            style: 'Code',
            children: [
              new TextRun({
                text: codeLine || ' ',
                font: codeFont,
                size: codeSize,
              }),
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
 * Convert markdown string to a Document object.
 */
function markdownToDocument(md, config) {
  const blocks = parseMarkdown(md);
  const elements = blocksToElements(blocks, config);
  const docStyles = buildDocStyles(config);

  const sectionProps = {
    page: {
      size: {
        width: config.page.width,
        height: config.page.height,
      },
      margin: {
        top: config.page.margins.top,
        bottom: config.page.margins.bottom,
        left: config.page.margins.left,
        right: config.page.margins.right,
        ...(config.page.margins.gutter ? { gutter: config.page.margins.gutter } : {}),
      },
    },
  };

  const footers = {};
  if (config.footer && config.footer.pageNumbers) {
    footers.default = new Footer({
      children: [
        new Paragraph({
          alignment: getAlignment(config.footer.alignment || 'CENTER'),
          children: [
            new TextRun({
              children: [PageNumber.CURRENT],
              font: config.styles.default.font || 'Calibri',
              size: config.footer.size || 20,
            }),
          ],
        }),
      ],
    });
  }

  const doc = new Document({
    styles: docStyles,
    numbering: {
      config: [
        {
          reference: 'bullet-list',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '\u2022',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
        {
          reference: 'numbered-list',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: sectionProps,
        footers,
        children: elements,
      },
    ],
  });

  return doc;
}

// --- Public API ---

/**
 * Convert markdown string to DOCX buffer.
 * @param {string} md - Markdown content
 * @param {object} options - { preset?: string, config?: string|object }
 * @returns {Promise<Buffer>}
 */
async function convertMarkdown(md, options = {}) {
  const config = resolveConfig(options);
  const doc = markdownToDocument(md, config);
  return Packer.toBuffer(doc);
}

/**
 * Convert a markdown file to a DOCX file.
 * @param {string} inputPath - Path to .md file
 * @param {string} outputPath - Path to .docx output
 * @param {object} options - { preset?: string, config?: string|object }
 */
async function convert(inputPath, outputPath, options = {}) {
  const md = fs.readFileSync(inputPath, 'utf8');
  const buffer = await convertMarkdown(md, options);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

/**
 * Get the resolved config (useful for book-formatter integration).
 */
function getConfig(options = {}) {
  return resolveConfig(options);
}

/**
 * Parse markdown and return block tokens (useful for book-formatter integration).
 */
function parse(md) {
  return parseMarkdown(md);
}

/**
 * Convert blocks to docx elements using a config (useful for book-formatter integration).
 */
function toElements(blocks, options = {}) {
  const config = resolveConfig(options);
  return blocksToElements(blocks, config);
}

// --- Exports ---

module.exports = {
  convert,
  convertMarkdown,
  getConfig,
  parse,
  toElements,
  parseInlineMarkdown,
  parseMarkdown,
  blocksToElements,
  markdownToDocument,
  resolveConfig,
  loadPreset,
};

// --- CLI ---

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node convert.js <input.md> <output.docx> [--preset book|report|academic|business] [--config custom.json]');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];
  const options = {};

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--preset' && args[i + 1]) {
      options.preset = args[i + 1];
      i++;
    } else if (args[i] === '--config' && args[i + 1]) {
      options.config = args[i + 1];
      i++;
    }
  }

  convert(inputPath, outputPath, options)
    .then(() => {
      console.log(`Converted: ${inputPath} -> ${outputPath}`);
      if (options.preset) console.log(`  Preset: ${options.preset}`);
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
