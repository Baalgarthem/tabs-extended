/**
 * Extracts reference-style link definitions and footnote definitions from Markdown source text.
 * Skips code blocks and handles multi-line indented footnote content.
 * 
 * @param {string} markdown - The raw markdown text
 * @returns {string[]} Array of extracted definition lines/blocks
 */
export function extractReferenceDefinitions(markdown) {
  if (!markdown) return [];
  const lines = String(markdown).split(/\r?\n/);
  const defs = [];
  let inCodeBlock = false;
  let currentFootnote = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track fenced code blocks (~~~ or ```) to prevent capturing definitions inside code
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      if (currentFootnote) {
        defs.push(currentFootnote.join('\n'));
        currentFootnote = null;
      }
      continue;
    }

    if (inCodeBlock) continue;

    // Footnote definition: [^id]: text
    const fnMatch = line.match(/^[ \t]{0,3}\[\^([^\]]+)\]:[ \t]*(.*)$/);
    if (fnMatch) {
      if (currentFootnote) {
        defs.push(currentFootnote.join('\n'));
      }
      currentFootnote = [line];
      continue;
    }

    // Continuation line of multi-line footnote (indented by 4 spaces / tab or empty line)
    if (currentFootnote && (line.startsWith('    ') || line.startsWith('\t') || trimmed === '')) {
      currentFootnote.push(line);
      continue;
    } else if (currentFootnote) {
      defs.push(currentFootnote.join('\n'));
      currentFootnote = null;
    }

    // Reference link definition: [id]: url "optional title"
    const refMatch = line.match(/^[ \t]{0,3}\[(?!\^)([^\]]+)\]:[ \t]*(.+)$/);
    if (refMatch) {
      defs.push(line);
    }
  }

  if (currentFootnote) {
    defs.push(currentFootnote.join('\n'));
  }

  return defs;
}

/**
 * Injects missing document-level and block-level reference links and footnote definitions
 * into a single tab's markdown content before passing to MarkdownRenderer.
 * 
 * @param {string} content - Tab markdown content
 * @param {App} app - Obsidian App instance
 * @param {Object} context - MarkdownPostProcessorContext
 * @param {Object} ownerTabs - Owner Tabs instance
 * @returns {string} Augmented markdown content with definitions appended
 */
export function augmentContentWithDocumentDefinitions(content, app, context, ownerTabs) {
  const safeContent = String(content == null ? "" : content);
  const tabDefs = new Set(extractReferenceDefinitions(safeContent));

  const rawTabsText = (ownerTabs && ownerTabs.rawText) || "";
  const tabsDefs = extractReferenceDefinitions(rawTabsText);

  let docText = "";
  try {
    const sourcePath = (context && typeof context.sourcePath === "string") ? context.sourcePath : "";
    const view = app && app.workspace
      ? (typeof app.workspace.getActiveViewOfType === "function" ? (app.workspace.getActiveViewOfType("markdown") || (app.workspace.activeLeaf && app.workspace.activeLeaf.view)) : (app.workspace.activeLeaf && app.workspace.activeLeaf.view))
      : null;
    if (view && view.file && (!sourcePath || view.file.path === sourcePath) && view.editor) {
      docText = view.editor.getValue();
    }
  } catch (err) {}

  const docDefs = extractReferenceDefinitions(docText);

  const missingDefs = [];
  for (const def of [...tabsDefs, ...docDefs]) {
    if (!tabDefs.has(def)) {
      tabDefs.add(def);
      missingDefs.push(def);
    }
  }

  if (missingDefs.length === 0) return safeContent;
  return safeContent + "\n\n" + missingDefs.join("\n");
}
