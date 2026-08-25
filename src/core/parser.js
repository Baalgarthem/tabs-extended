// Core AST parsing, fence detection, and tab segmentation utilities

function tabsExtendedSourceLines(text) {
  const source = String(text == null ? "" : text);
  const lines = [];
  const linePattern = /([^\r\n]*)(\r\n|\n|\r|$)/g;
  let match;
  while ((match = linePattern.exec(source)) !== null) {
    if (match[0] === "" && match.index === source.length) break;
    const start = match.index;
    const lineText = match[1];
    const lineBreak = match[2];
    lines.push({
      text: lineText,
      start,
      end: start + lineText.length,
      fullEnd: start + match[0].length,
      lineBreak,
    });
    if (!lineBreak) break;
  }
  return lines;
}

function tabsExtendedFenceInfo(lineText) {
  const match = String(lineText == null ? "" : lineText)
    .trim()
    .match(/^(`{3,}|~{3,})(.*)$/);
  if (!match) return null;
  const fence = match[1];
  return {
    fence,
    char: fence[0],
    length: fence.length,
    info: match[2].trim(),
  };
}

function tabsExtendedMaxFenceLength(rawText, fenceChar) {
  let maxLength = 0;
  for (const line of tabsExtendedSourceLines(rawText)) {
    const fence = tabsExtendedFenceInfo(line.text);
    if (fence && fence.char === fenceChar) {
      maxLength = Math.max(maxLength, fence.length);
    }
  }
  return maxLength;
}

function tabsExtendedUpdateFenceStack(stack, fence, keywords) {
  if (!fence) return;
  if (stack.length === 0) {
    if (fence.info !== "") {
      const keyword = fence.info.split(/\s+/)[0].toLowerCase();
      stack.push({
        char: fence.char,
        length: fence.length,
        isTabs: keywords.has(keyword),
      });
    }
    return;
  }
  const closingIndex = tabsExtendedClosingFenceIndex(stack, fence);
  if (closingIndex >= 0) {
    // A fence that exactly matches an ancestor is an explicit boundary for
    // that ancestor. Recover malformed descendants by closing them together.
    stack.splice(closingIndex);
    return;
  }
  const current = stack[stack.length - 1];
  if (fence.info !== "" && current.isTabs) {
    // Any fenced block with an info string starts a protected descendant scope.
    // Its contents cannot expose separators belonging to the current tab level.
    const keyword = fence.info.split(/\s+/)[0].toLowerCase();
    stack.push({
      char: fence.char,
      length: fence.length,
      isTabs: keywords.has(keyword),
    });
  }
}

function tabsExtendedClosingFenceIndex(stack, fence) {
  if (!fence || fence.info !== "" || stack.length === 0) return -1;
  for (let index = stack.length - 1; index >= 0; index--) {
    const candidate = stack[index];
    if (
      candidate.char === fence.char &&
      candidate.length === fence.length
    ) {
      return index;
    }
  }
  const current = stack[stack.length - 1];
  return current.char === fence.char && fence.length >= current.length
    ? stack.length - 1
    : -1;
}

function tabsExtendedAnalyzeTabSections(rawText, split, settings = null) {
  const source = String(rawText == null ? "" : rawText);
  const separator = String(split == null ? "" : split);
  if (!separator) return null;
  const cleanSep = separator.trim();
  const lines = tabsExtendedSourceLines(source);
  const keywords = tabsExtendedTabKeywords(settings);
  const fenceStack = [];
  const separatorLines = [];

  for (const line of lines) {
    const isTableLine =
      line.text.includes("|") || /^\s*:?-{2,}:?/.test(line.text);
    const trimmedStart = line.text.trimStart();
    const isSeparatorLine =
      trimmedStart.startsWith(separator) ||
      (cleanSep && (trimmedStart.startsWith(cleanSep + ":") || trimmedStart.startsWith(cleanSep + " ")));

    if (
      fenceStack.length === 0 &&
      isSeparatorLine &&
      !isTableLine
    ) {
      separatorLines.push(line);
      continue;
    }
    tabsExtendedUpdateFenceStack(
      fenceStack,
      tabsExtendedFenceInfo(line.text),
      keywords,
    );
  }

  if (separatorLines.length === 0) return null;
  const sections = separatorLines.map((line, index) => ({
    from: line.start,
    to:
      index + 1 < separatorLines.length
        ? separatorLines[index + 1].start
        : source.length,
    separatorFrom: line.start,
    separatorTo: line.end,
    contentFrom: line.fullEnd,
  }));
  return {
    prefix: source.slice(0, separatorLines[0].start),
    sections,
  };
}

function tabsExtendedNormalizeTabTitle(value) {
  const rawTitle = String(value == null ? "" : value);
  if (
    /[\r\n\u2028\u2029]/.test(rawTitle) ||
    /[\u0000-\u001f\u007f]/.test(rawTitle)
  ) {
    return null;
  }
  const title = rawTitle.trim();
  return title === "" ? null : title;
}

function tabsExtendedTabTitleSourceRange(
  rawText,
  split,
  analysis,
  tabIndex,
) {
  const source = String(rawText == null ? "" : rawText);
  const separator = String(split == null ? "" : split);
  if (
    !analysis ||
    !separator ||
    !Number.isInteger(tabIndex) ||
    tabIndex < 0 ||
    tabIndex >= analysis.sections.length
  ) {
    return null;
  }
  const section = analysis.sections[tabIndex];
  const separatorLine = source.slice(
    section.separatorFrom,
    section.separatorTo,
  );
  if (!separatorLine.startsWith(separator)) return null;
  const from = section.separatorFrom + separator.length;
  return {
    from,
    to: section.separatorTo,
    title: source.slice(from, section.separatorTo),
  };
}

function tabsExtendedJoinTabSections(prefix, sections, sourceText) {
  const source = String(sourceText == null ? "" : sourceText);
  const lineBreakMatch = source.match(/\r\n|\n|\r/);
  const lineBreak = lineBreakMatch ? lineBreakMatch[0] : "\n";
  let result = String(prefix == null ? "" : prefix);

  sections.forEach((section, index) => {
    const sectionText = String(section == null ? "" : section);
    // The final source section may end exactly at the closing fence and thus
    // have no trailing newline. If it is moved before a sibling, restore only
    // the structural boundary needed to keep both separators on their own lines.
    if (
      index > 0 &&
      result.length > 0 &&
      sectionText.length > 0 &&
      !/(?:\r\n|\n|\r)$/.test(result) &&
      !/^(?:\r\n|\n|\r)/.test(sectionText)
    ) {
      result += lineBreak;
    }
    result += sectionText;
  });

  return result;
}

let tabsExtendedCachedKeyword = null;
let tabsExtendedCachedKeywords = null;

function tabsExtendedConfiguredKeyword(settings) {
  return String(
    settings && settings.tabsKeyword ? settings.tabsKeyword : "tabs",
  )
    .trim()
    .toLowerCase();
}

function tabsExtendedTabKeywords(settings) {
  const configured = tabsExtendedConfiguredKeyword(settings);
  if (
    configured !== tabsExtendedCachedKeyword ||
    !tabsExtendedCachedKeywords
  ) {
    tabsExtendedCachedKeyword = configured;
    tabsExtendedCachedKeywords = new Set([
      configured,
      configured + "-v",
      "tabs",
      "tabs-v",
    ]);
  }
  return tabsExtendedCachedKeywords;
}

function tabsExtendedFindDirectNestedBlocks(rawText, settings) {
  const source = String(rawText == null ? "" : rawText);
  const lines = tabsExtendedSourceLines(source);
  const keywords = tabsExtendedTabKeywords(settings);
  const stack = [];
  const blocks = [];

  for (const line of lines) {
    const fence = tabsExtendedFenceInfo(line.text);
    if (!fence) continue;

    if (stack.length === 0) {
      if (fence.info === "") continue;
      const keyword = fence.info.split(/\s+/)[0].toLowerCase();
      stack.push({
        char: fence.char,
        length: fence.length,
        keyword,
        isTabs: keywords.has(keyword),
        blockFrom: line.start,
        bodyFrom: line.fullEnd,
      });
      continue;
    }

    const closingIndex = tabsExtendedClosingFenceIndex(stack, fence);
    if (closingIndex >= 0) {
      const closed = stack[closingIndex];
      stack.splice(closingIndex);
      if (closingIndex === 0 && closed.isTabs) {
        blocks.push({
          blockFrom: closed.blockFrom,
          blockTo: line.fullEnd,
          bodyFrom: closed.bodyFrom,
          bodyTo: line.start,
          keyword: closed.keyword,
          isVertical: closed.keyword.endsWith("-v"),
          implicitClose: false,
        });
      }
    } else if (fence.info !== "" && stack[stack.length - 1].isTabs) {
      const keyword = fence.info.split(/\s+/)[0].toLowerCase();
      stack.push({
        char: fence.char,
        length: fence.length,
        keyword,
        isTabs: keywords.has(keyword),
        blockFrom: line.start,
        bodyFrom: line.fullEnd,
      });
    }
  }

  if (stack.length > 0 && stack[0].isTabs) {
    const unclosed = stack[0];
    blocks.push({
      blockFrom: unclosed.blockFrom,
      blockTo: source.length,
      bodyFrom: unclosed.bodyFrom,
      bodyTo: source.length,
      keyword: unclosed.keyword,
      isVertical: unclosed.keyword.endsWith("-v"),
      implicitClose: true,
    });
  }

  return blocks;
}

function tabsExtendedCompleteDanglingTabFences(sectionText, settings) {
  const source = String(sectionText == null ? "" : sectionText);
  const stack = [];
  const keywords = tabsExtendedTabKeywords(settings);
  for (const line of tabsExtendedSourceLines(source)) {
    tabsExtendedUpdateFenceStack(
      stack,
      tabsExtendedFenceInfo(line.text),
      keywords,
    );
  }
  if (stack.length === 0) return source;
  if (stack.some((fence) => !fence.isTabs)) return null;

  const lineBreakMatch = source.match(/\r\n|\n|\r/);
  const lineBreak = lineBreakMatch ? lineBreakMatch[0] : "\n";
  let completed = source;
  for (let index = stack.length - 1; index >= 0; index--) {
    if (completed.length > 0 && !/(?:\r\n|\n|\r)$/.test(completed)) {
      completed += lineBreak;
    }
    completed += stack[index].char.repeat(stack[index].length);
  }
  return completed;
}

function tabsExtendedNormalizeSource(text) {
  return String(text == null ? "" : text)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function tabsExtendedTabCacheIdentity(titles, index) {
  const title = String(titles[index] == null ? "" : titles[index]);
  let occurrence = 0;
  for (let previous = 1; previous < index; previous++) {
    if (String(titles[previous] == null ? "" : titles[previous]) === title) {
      occurrence += 1;
    }
  }
  return encodeURIComponent(title) + "#" + occurrence;
}

function tabsExtendedStableTextHash(text) {
  const source = String(text == null ? "" : text);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index++) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export {
  tabsExtendedSourceLines,
  tabsExtendedFenceInfo,
  tabsExtendedMaxFenceLength,
  tabsExtendedUpdateFenceStack,
  tabsExtendedClosingFenceIndex,
  tabsExtendedAnalyzeTabSections,
  tabsExtendedNormalizeTabTitle,
  tabsExtendedTabTitleSourceRange,
  tabsExtendedJoinTabSections,
  tabsExtendedConfiguredKeyword,
  tabsExtendedTabKeywords,
  tabsExtendedFindDirectNestedBlocks,
  tabsExtendedCompleteDanglingTabFences,
  tabsExtendedNormalizeSource,
  tabsExtendedTabCacheIdentity,
  tabsExtendedStableTextHash
};
