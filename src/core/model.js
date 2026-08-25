import { MarkdownRenderChild, MarkdownView, Notice, setIcon } from 'obsidian';
import { TabItem } from '../components/TabItem.js';
import { TabsNav, TabsButton } from '../components/TabsNav.js';
import { TabContentItem, TabsContents } from '../components/TabsContent.js';
import { TabContextMenu } from '../components/TabContextMenu.js';
import { TabsConfig } from './config.js';
import {
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
} from './parser.js';
import { $ } from '../i18n/index.js';

export 
function cleanVirtualLinksFromElement(el) {
  if (!el) return;
  try {
    const virtualLinks = el.querySelectorAll(".virtual-link, .virtual-link-a, .virtual-link-span, .glossary-entry");
    if (virtualLinks && virtualLinks.length > 0) {
      virtualLinks.forEach((vl) => {
        const icon = vl.querySelector(".linker-suffix-icon, sup");
        if (icon) icon.remove();
        const textNode = document.createTextNode(vl.textContent || "");
        vl.replaceWith(textNode);
      });
      el.normalize();
    }
  } catch (err) {}
}


export class Tabs extends MarkdownRenderChild {
  constructor(t, e, i, n, r, isVertical = false) {
    super(e);
    this.currentIndex = 0;
    this.tabsType = "outertabs";
    this.backquote = "`";
    this.backquoteCount = 3;
    this.isVertical = isVertical;
    this.rawText = String(t == null ? "" : t);
    this.parentTabContent = null;
    this.sourceOrdinal = -1;
    this.sourceAnalysisCache = null;
    this.scrollAnchorFrame = null;
    this.scrollAnchorTimers = [];
    this.register(() => this.cancelScrollAnchorSchedule());
    (e.classList.add("tabs-container"),
      (this.plugin = r),
      (this.tabsEl = e),
      (this.split = this.plugin.settings.split),
      (this.app = n),
      (this.activeView = n.workspace.getActiveViewOfType(MarkdownView)),
      (this.sectionInfo = i == null ? void 0 : i.getSectionInfo(e)),
      (this.context = i),
      this.updateBackquote(t),
      this.sectionInfo ||
        ((this.tabsType = "innertabs"),
        this.tabsEl.classList.add("tabs-innertabs"),
        this.plugin.settings.nestedTabsNoBorders && this.tabsEl.classList.add("tabs-innertabs-no-borders")));
    const parentContentEl = this.tabsEl.closest
      ? this.tabsEl.closest(".tabs-content")
      : null;
    const parentContentModel = parentContentEl
      ? parentContentEl.tabsExtendedContentModel
      : null;
    if (
      this.tabsType === "innertabs" &&
      parentContentModel &&
      parentContentModel.ownerTabs
    ) {
      this.parentTabContent = parentContentModel;
      this.sourceOrdinal = parentContentModel.claimNestedBlock(t, isVertical);
    }
    if (this.tabsType === "outertabs") {
      const sourceBody = this.readOuterSourceBody();
      if (sourceBody != null) t = sourceBody;
    }
    this.rawText = String(t == null ? "" : t);
    let defaultTitle = isVertical
      ? (this.plugin.settings.defaultTabNavItemVertical || "New vertical tab")
      : (this.plugin.settings.defaultTabNavItem || "New tab");
    let [o, a] = this.parseTabs(
      t,
      defaultTitle,
      this.plugin.settings.defaultTabContent,
    );
    this.tabsId = this.buildStableTabsId();
    // Initialize the cache before rendering child contents. Nested processors
    // can run immediately and need their parent's stable identity available.
    if (!(this.plugin.lastTabsCache instanceof Map)) {
      this.plugin.lastTabsCache = new Map();
      this.plugin.lastTabsCache.set("/", 0);
    }
    if (!this.plugin.lastTabsCache.has(this.tabsId)) {
      if (typeof this.plugin.setTabCache === "function") {
        this.plugin.setTabCache(this.tabsId, 0);
      } else {
        this.plugin.lastTabsCache.set(this.tabsId, 0);
      }
    }
    this.tabsConfig = new TabsConfig(a[0], this.tabsEl, this.plugin.settings, isVertical);
    this.tabsNav = new TabsNav(
      this,
      o.slice(1),
      this.tabsType === "innertabs"
        ? "action-none"
        : this.tabsConfig.actionButton,
      this.sectionInfo,
    );
    this.tabsContents = new TabsContents(
      r,
      a
        .map(
          (l, h) =>
            new TabContentItem(
              h,
              o[h],
              l,
              n,
              i,
              this,
              tabsExtendedTabCacheIdentity(o, h),
            ),
        )
        .slice(1),
    );
    this.registerEventHandlers();
    e.appendChild(this.tabsNav.navEl);
    e.appendChild(this.tabsContents.tabcontentsEl);
    this.tabsConfig.decorate(
      this.tabsEl,
      this.tabsNav.navEl,
      this.tabsContents.tabcontentsEl,
    );
    let cachedIndex = this.plugin.lastTabsCache.get(this.tabsId);
    if (typeof cachedIndex !== "number" || isNaN(cachedIndex) || cachedIndex < 0 || cachedIndex >= this.tabsNav.navItems.length) {
      cachedIndex = 0;
    }
    this.currentIndex = cachedIndex;
    this.plugin.lastTabsCache.set(this.tabsId, this.currentIndex);
    
    if (this.tabsNav.navItems.length > 0) {
      this.tabsNav.refreshActiveTabNav(this.currentIndex);
      this.tabsContents.refreshActiveTabContent(this.currentIndex);
    }
  }
  buildStableTabsId() {
    const sourcePath = this.context && this.context.sourcePath
      ? this.context.sourcePath
      : "";
    if (this.sectionInfo) {
      return sourcePath + this.sectionInfo.lineStart;
    }
    if (this.parentTabContent && this.parentTabContent.ownerTabs) {
      const parentId = this.parentTabContent.ownerTabs.tabsId || sourcePath;
      const contentId = this.parentTabContent.cacheIdentity ||
        "index-" + this.parentTabContent.index;
      const nestedId = this.sourceOrdinal >= 0
        ? String(this.sourceOrdinal)
        : "unresolved-" + tabsExtendedStableTextHash(this.rawText);
      return (
        parentId +
        "/tab-" + contentId +
        "/nested-" + nestedId +
        (this.isVertical ? "-vertical" : "-horizontal")
      );
    }
    return (
      sourcePath +
      "-inner-" +
      tabsExtendedStableTextHash(this.rawText) +
      (this.isVertical ? "-vertical" : "-horizontal")
    );
  }
  parseTabs(rawText, defaultTitle, defaultContent) {
    const source = String(rawText == null ? "" : rawText);
    const analyzed = tabsExtendedAnalyzeTabSections(
      source,
      this.split,
      this.plugin.settings,
    );
    if (!analyzed) {
      return [
        ["", defaultTitle],
        ["", source.trim() === "" ? defaultContent : source],
      ];
    }

    const titles = [""];
    const contents = [analyzed.prefix];
    analyzed.sections.forEach((section) => {
      titles.push(
        source.slice(
          section.separatorFrom + this.split.length,
          section.separatorTo,
        ),
      );
      contents.push(source.slice(section.contentFrom, section.to));
    });
    return [titles, contents];
  }
  findOuterBlockRange(editor, expectedRawText = this.rawText) {
    if (!editor) return { startLine: -1, closingLine: -1 };
    const lineCount = typeof editor.lineCount === "function"
      ? editor.lineCount()
      : 0;
    if (lineCount <= 0) return { startLine: -1, closingLine: -1 };

    const expectedBody = tabsExtendedNormalizeSource(expectedRawText);
    const keywords = ['tabs', 'tabs-v'];
    const isTabsOpening = (lineText) => {
      const trimmed = String(lineText || "").trim();
      const match = trimmed.match(/^(`{3,}|~{3,})(.*)$/);
      if (!match) return null;
      const fenceChar = match[1][0];
      const fenceLen = match[1].length;
      const info = match[2].trim().toLowerCase();
      const isTab = info === "" || keywords.some((kw) => info.startsWith(kw));
      return { fenceChar, fenceLen, isTab, info };
    };

    const candidateMatches = (startLine, closingLine) => {
      if (closingLine <= startLine || closingLine >= lineCount) return false;
      const candidateBodyWithBoundary = editor.getRange(
        { line: startLine + 1, ch: 0 },
        { line: closingLine, ch: 0 },
      );
      const candidateBody = String(candidateBodyWithBoundary).replace(
        /(?:\r\n|\n|\r)$/,
        "",
      );
      return tabsExtendedNormalizeSource(candidateBody) === expectedBody;
    };

    // 1. Fast Path: Check sectionInfo if present
    if (this.sectionInfo && this.sectionInfo.lineStart >= 0 && this.sectionInfo.lineStart < lineCount) {
      const startLine = this.sectionInfo.lineStart;
      const opening = isTabsOpening(editor.getLine(startLine));
      if (opening && opening.isTab) {
        const expectedEnd = this.sectionInfo.lineEnd;
        if (expectedEnd > startLine && expectedEnd < lineCount) {
          const fence = tabsExtendedFenceInfo(editor.getLine(expectedEnd));
          if (fence && fence.info === "" && fence.char === opening.fenceChar && fence.length >= opening.fenceLen) {
            if (candidateMatches(startLine, expectedEnd)) {
              return { startLine, closingLine: expectedEnd };
            }
          }
        }
        for (let lineNo = startLine + 1; lineNo < lineCount; lineNo++) {
          const fence = tabsExtendedFenceInfo(editor.getLine(lineNo));
          if (fence && fence.info === "" && fence.char === opening.fenceChar && fence.length >= opening.fenceLen) {
            if (candidateMatches(startLine, lineNo)) {
              this.sectionInfo.lineEnd = lineNo;
              return { startLine, closingLine: lineNo };
            }
          }
        }
      }
    }

    // 2. Document-wide Recovery Scan: Find matching tabs block anywhere in document
    for (let lineNo = 0; lineNo < lineCount; lineNo++) {
      const opening = isTabsOpening(editor.getLine(lineNo));
      if (!opening || !opening.isTab || opening.info === "") continue;

      for (let closeNo = lineNo + 1; closeNo < lineCount; closeNo++) {
        const fence = tabsExtendedFenceInfo(editor.getLine(closeNo));
        if (fence && fence.info === "" && fence.char === opening.fenceChar && fence.length >= opening.fenceLen) {
          if (candidateMatches(lineNo, closeNo)) {
            if (this.sectionInfo) {
              this.sectionInfo.lineStart = lineNo;
              this.sectionInfo.lineEnd = closeNo;
            } else {
              this.sectionInfo = { lineStart: lineNo, lineEnd: closeNo };
            }
            return { startLine: lineNo, closingLine: closeNo };
          }
        }
      }
    }

    return { startLine: -1, closingLine: -1 };
  }
  findOuterClosingLine(editor, expectedRawText = this.rawText) {
    const range = this.findOuterBlockRange(editor, expectedRawText);
    return range.closingLine;
  }
  getWritableView() {
    const expectedPath = this.context && this.context.sourcePath
      ? this.context.sourcePath
      : "";
    const currentView = this.app && this.app.workspace
      ? this.app.workspace.getActiveViewOfType(MarkdownView)
      : null;
    const candidates = [currentView, this.activeView];
    if (this.app && this.app.workspace && typeof this.app.workspace.getLeavesOfType === "function") {
      try {
        const leaves = this.app.workspace.getLeavesOfType("markdown");
        if (Array.isArray(leaves)) {
          for (const leaf of leaves) {
            if (leaf && leaf.view) candidates.push(leaf.view);
          }
        }
      } catch (err) {}
    }
    const visited = new Set();
    for (const view of candidates) {
      if (!view || visited.has(view) || !view.editor) continue;
      visited.add(view);
      const viewPath = view.file && view.file.path ? view.file.path : "";
      if (!expectedPath || !viewPath || expectedPath === viewPath) return view;
    }
    return null;
  }
  readOuterSourceBody() {
    const view = this.getWritableView();
    if (!view) return null;
    const blockRange = this.findOuterBlockRange(view.editor);
    if (blockRange.startLine < 0 || blockRange.closingLine < 0) return null;
    const bodyWithBoundary = view.editor.getRange(
      { line: blockRange.startLine + 1, ch: 0 },
      { line: blockRange.closingLine, ch: 0 },
    );
    this.sectionInfo = {
      lineStart: blockRange.startLine,
      lineEnd: blockRange.closingLine
    };
    return String(bodyWithBoundary).replace(/(?:\r\n|\n|\r)$/, "");
  }
  canPersistTabOrder() {
    let current = this;
    const visited = new Set();
    while (current && current.parentTabContent) {
      if (visited.has(current) || current.sourceOrdinal < 0) return false;
      visited.add(current);
      current = current.parentTabContent.ownerTabs;
    }
    const writableView = current ? current.getWritableView() : null;
    return !!(
      current &&
      current.sectionInfo &&
      writableView &&
      current.findOuterClosingLine(writableView.editor) >= 0
    );
  }
  buildReorderedRawText(fromIndex, toIndex) {
    const analyzed = this.analyzeCurrentTabSections();
    if (
      !analyzed ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= analyzed.sections.length ||
      toIndex >= analyzed.sections.length
    ) {
      return null;
    }
    const sections = analyzed.sections.map((section) =>
      this.rawText.slice(section.from, section.to),
    );
    const moved = sections.splice(fromIndex, 1)[0];
    sections.splice(toIndex, 0, moved);
    return tabsExtendedJoinTabSections(
      analyzed.prefix,
      sections,
      this.rawText,
    );
  }
  analyzeSourceTabSections() {
    const keyword = tabsExtendedConfiguredKeyword(this.plugin.settings);
    const cached = this.sourceAnalysisCache;
    if (
      cached &&
      cached.rawText === this.rawText &&
      cached.split === this.split &&
      cached.keyword === keyword
    ) {
      return cached.analysis;
    }
    const analysis = tabsExtendedAnalyzeTabSections(
      this.rawText,
      this.split,
      this.plugin.settings,
    );
    this.sourceAnalysisCache = {
      rawText: this.rawText,
      split: this.split,
      keyword,
      analysis,
    };
    return analysis;
  }
  analyzeCurrentTabSections() {
    const analyzed = this.analyzeSourceTabSections();
    if (
      !analyzed ||
      !this.tabsNav ||
      analyzed.sections.length !== this.tabsNav.navItems.length
    ) {
      return null;
    }
    return analyzed;
  }
  getTabSourceSection(tabIndex) {
    const analyzed = this.analyzeCurrentTabSections();
    if (
      !analyzed ||
      tabIndex < 0 ||
      tabIndex >= analyzed.sections.length
    ) {
      return null;
    }
    const section = analyzed.sections[tabIndex];
    return this.rawText.slice(section.from, section.to);
  }
  getTabTitleSourceRange(
    tabIndex,
    analyzed = this.analyzeCurrentTabSections(),
  ) {
    return tabsExtendedTabTitleSourceRange(
      this.rawText,
      this.split,
      analyzed,
      tabIndex,
    );
  }
  getTabRenameSnapshot(tabIndex) {
    const analyzed = this.analyzeCurrentTabSections();
    const tabcontents = this.tabsContents && this.tabsContents.tabcontents;
    if (
      !analyzed ||
      !Array.isArray(tabcontents) ||
      tabcontents.length !== analyzed.sections.length
    ) {
      return null;
    }
    const titleRange = this.getTabTitleSourceRange(tabIndex, analyzed);
    if (!titleRange) return null;
    return Object.freeze({
      tabIndex,
      rawText: this.rawText,
      rawTitle: titleRange.title,
      title: titleRange.title.trim(),
      tabsId: this.tabsId || "",
    });
  }
  getRootTabsInstance() {
    const visited = new Set();
    let current = this;
    while (current && current.parentTabContent) {
      if (visited.has(current)) return null;
      visited.add(current);
      current = current.parentTabContent.ownerTabs;
    }
    return current || null;
  }
  hasConflictingTabsEditorModal() {
    const modal = this.plugin ? this.plugin.tabsEditorModal : null;
    if (
      !modal ||
      !modal.tabs ||
      !modal.modalEl ||
      !modal.modalEl.isConnected
    ) {
      return false;
    }
    const currentRoot = this.getRootTabsInstance();
    const modalRoot = typeof modal.tabs.getRootTabsInstance === "function"
      ? modal.tabs.getRootTabsInstance()
      : modal.tabs;
    if (!currentRoot || !modalRoot) return true;
    if (currentRoot === modalRoot) return true;
    const currentPath = currentRoot.context && currentRoot.context.sourcePath;
    const modalPath = modalRoot.context && modalRoot.context.sourcePath;
    return !!(
      currentRoot.tabsId &&
      currentRoot.tabsId === modalRoot.tabsId &&
      (!currentPath || !modalPath || currentPath === modalPath)
    );
  }
  stageRenameCacheIdentityTransition(
    currentAnalysis,
    nextAnalysis,
    nextRawText,
  ) {
    const cache = this.plugin ? this.plugin.lastTabsCache : null;
    const tabcontents = this.tabsContents && this.tabsContents.tabcontents;
    if (
      !(cache instanceof Map) ||
      !this.tabsId ||
      !Array.isArray(tabcontents) ||
      tabcontents.length !== currentAnalysis.sections.length ||
      nextAnalysis.sections.length !== currentAnalysis.sections.length
    ) {
      return { commit() {}, rollback() {} };
    }

    const readTitles = (rawText, analysis) => [""].concat(
      analysis.sections.map((section, index) => {
        const range = tabsExtendedTabTitleSourceRange(
          rawText,
          this.split,
          analysis,
          index,
        );
        return range ? range.title : "";
      }),
    );
    const currentTitles = readTitles(this.rawText, currentAnalysis);
    const nextTitles = readTitles(nextRawText, nextAnalysis);
    const transitions = [];

    for (let index = 0; index < tabcontents.length; index++) {
      const contentItem = tabcontents[index];
      const oldIdentity = contentItem && contentItem.cacheIdentity
        ? contentItem.cacheIdentity
        : tabsExtendedTabCacheIdentity(currentTitles, index + 1);
      const newIdentity = tabsExtendedTabCacheIdentity(
        nextTitles,
        index + 1,
      );
      if (oldIdentity === newIdentity) continue;
      transitions.push({
        contentItem,
        oldIdentity,
        newIdentity,
        oldPrefix: this.tabsId + "/tab-" + oldIdentity + "/",
        newPrefix: this.tabsId + "/tab-" + newIdentity + "/",
      });
    }
    if (transitions.length === 0) {
      return { commit() {}, rollback() {} };
    }

    const existingEntries = Array.from(cache.entries());
    const assignments = new Map();
    const sourceKeys = new Set();
    for (const [key, value] of existingEntries) {
      if (typeof key !== "string") continue;
      const transition = transitions.find((item) =>
        key.startsWith(item.oldPrefix),
      );
      if (!transition) continue;
      sourceKeys.add(key);
      assignments.set(
        transition.newPrefix + key.slice(transition.oldPrefix.length),
        value,
      );
    }

    const targetSnapshots = new Map();
    assignments.forEach((value, key) => {
      targetSnapshots.set(key, {
        existed: cache.has(key),
        value: cache.get(key),
      });
      cache.set(key, value);
    });

    return {
      rollback() {
        targetSnapshots.forEach((snapshot, key) => {
          if (snapshot.existed) cache.set(key, snapshot.value);
          else cache.delete(key);
        });
      },
      commit() {
        const newPrefixes = transitions.map((item) => item.newPrefix);
        for (const key of sourceKeys) {
          if (!newPrefixes.some((prefix) => key.startsWith(prefix))) {
            cache.delete(key);
          }
        }
        transitions.forEach((item) => {
          if (item.contentItem) {
            item.contentItem.cacheIdentity = item.newIdentity;
          }
        });
      },
    };
  }
  renameTabAt(tabIndex, requestedTitle, snapshot = null) {
    const nextTitle = tabsExtendedNormalizeTabTitle(requestedTitle);
    if (
      nextTitle == null ||
      (this.tabsEl && !this.tabsEl.isConnected) ||
      this.hasConflictingTabsEditorModal()
    ) {
      return false;
    }
    if (
      snapshot &&
      (snapshot.tabIndex !== tabIndex ||
        snapshot.rawText !== this.rawText ||
        snapshot.tabsId !== (this.tabsId || ""))
    ) {
      return false;
    }

    const currentAnalysis = this.analyzeCurrentTabSections();
    const titleRange = this.getTabTitleSourceRange(tabIndex, currentAnalysis);
    const tabcontents = this.tabsContents && this.tabsContents.tabcontents;
    if (
      !currentAnalysis ||
      !titleRange ||
      !Array.isArray(tabcontents) ||
      tabcontents.length !== currentAnalysis.sections.length ||
      !Number.isInteger(this.currentIndex) ||
      this.currentIndex < 0 ||
      this.currentIndex >= currentAnalysis.sections.length
    ) {
      return false;
    }
    if (snapshot && snapshot.rawTitle !== titleRange.title) return false;
    if (titleRange.title.trim() === nextTitle) return true;

    const nextRawText =
      this.rawText.slice(0, titleRange.from) +
      nextTitle +
      this.rawText.slice(titleRange.to);
    const nextAnalysis = tabsExtendedAnalyzeTabSections(
      nextRawText,
      this.split,
      this.plugin.settings,
    );
    const nextTitleRange = tabsExtendedTabTitleSourceRange(
      nextRawText,
      this.split,
      nextAnalysis,
      tabIndex,
    );
    if (
      !nextAnalysis ||
      !nextTitleRange ||
      nextAnalysis.prefix !== currentAnalysis.prefix ||
      nextAnalysis.sections.length !== currentAnalysis.sections.length ||
      nextTitleRange.title !== nextTitle ||
      this.rawText.slice(0, titleRange.from) !==
        nextRawText.slice(0, nextTitleRange.from) ||
      this.rawText.slice(titleRange.to) !==
        nextRawText.slice(nextTitleRange.to)
    ) {
      return false;
    }

    const cacheTransition = this.stageRenameCacheIdentityTransition(
      currentAnalysis,
      nextAnalysis,
      nextRawText,
    );
    let renamed = false;
    try {
      renamed = this.persistRawTextUpdate(nextRawText, this.currentIndex);
    } catch (error) {
      cacheTransition.rollback();
      console.error("Tabs Extended aborted an unsafe tab rename:", error);
      return false;
    }
    if (!renamed) {
      cacheTransition.rollback();
      return false;
    }
    try {
      cacheTransition.commit();
    } catch (error) {
      // The source write already succeeded. Cache cleanup is best-effort and
      // must never turn a valid structural rename into a second source write.
      console.warn("Tabs Extended could not finish rename cache cleanup:", error);
    }
    return true;
  }
  replaceTabSourceSection(tabIndex, replacementText) {
    const analyzed = this.analyzeCurrentTabSections();
    const replacement = String(replacementText == null ? "" : replacementText);
    const replacementAnalysis = tabsExtendedAnalyzeTabSections(
      replacement,
      this.split,
      this.plugin.settings,
    );

    // If the tabs block originally had NO separator lines (e.g. single tab block without separator)
    if (!analyzed) {
      return this.persistRawTextUpdate(replacement, 0);
    }

    if (
      tabIndex < 0 ||
      tabIndex >= analyzed.sections.length
    ) {
      return false;
    }

    // If replacement has non-whitespace prefix before the first separator, reject unsafe structure
    if (
      replacementAnalysis &&
      replacementAnalysis.prefix.trim() !== ""
    ) {
      return false;
    }

    const sections = analyzed.sections.map((section) =>
      this.rawText.slice(section.from, section.to),
    );
    sections.splice(tabIndex, 1, replacement);
    const nextRawText = tabsExtendedJoinTabSections(
      analyzed.prefix,
      sections,
      this.rawText,
    );
    return this.persistRawTextUpdate(nextRawText, tabIndex);
  }
  buildNewTabSource(title, content) {
    const lineBreakMatch = this.rawText.match(/\r\n|\n|\r/);
    const lineBreak = lineBreakMatch ? lineBreakMatch[0] : "\n";
    const safeTitle = String(title == null ? "" : title)
      .replace(/\r\n|\n|\r/g, " ")
      .trim();
    const body = String(content == null ? "" : content);
    return this.split + safeTitle + (body.length > 0 ? lineBreak + body : "");
  }
  insertTabSourceSections(newSections) {
    // Appending does not depend on a visual tab index. The source is the
    // authority here because Obsidian may still expose the previous DOM for a
    // short interval after a modal save changed the number of separators.
    const analyzed = this.analyzeSourceTabSections();
    if (!analyzed || !Array.isArray(newSections) || newSections.length === 0) {
      return false;
    }
    const safeSections = [];
    for (const sourceSection of newSections) {
      const sectionText = String(sourceSection == null ? "" : sourceSection);
      const sectionAnalysis = tabsExtendedAnalyzeTabSections(
        sectionText,
        this.split,
        this.plugin.settings,
      );
      if (
        !sectionAnalysis ||
        sectionAnalysis.prefix !== "" ||
        sectionAnalysis.sections.length !== 1
      ) {
        return false;
      }
      safeSections.push(sectionText);
    }

    const currentSections = analyzed.sections.map((section) =>
      this.rawText.slice(section.from, section.to),
    );
    const lastSectionIndex = currentSections.length - 1;
    const completedLastSection = tabsExtendedCompleteDanglingTabFences(
      currentSections[lastSectionIndex],
      this.plugin.settings,
    );
    if (completedLastSection == null) return false;
    currentSections[lastSectionIndex] = completedLastSection;
    const firstInsertedIndex = currentSections.length;
    const nextRawText = tabsExtendedJoinTabSections(
      analyzed.prefix,
      currentSections.concat(safeSections),
      this.rawText,
    );
    const nextAnalysis = tabsExtendedAnalyzeTabSections(
      nextRawText,
      this.split,
      this.plugin.settings,
    );
    if (
      !nextAnalysis ||
      nextAnalysis.sections.length !== currentSections.length + safeSections.length
    ) {
      return false;
    }
    return this.persistRawTextUpdate(nextRawText, firstInsertedIndex);
  }
  insertNewTab(title, content) {
    return this.insertTabSourceSections([
      this.buildNewTabSource(title, content),
    ]);
  }
  insertClipboardTabs(clipboardText) {
    const source = String(clipboardText == null ? "" : clipboardText);
    if (source.trim() === "" || source.trim() === this.split) return false;
    const clipboardAnalysis = tabsExtendedAnalyzeTabSections(
      source,
      this.split,
      this.plugin.settings,
    );
    if (clipboardAnalysis && clipboardAnalysis.prefix === "") {
      const copiedSections = clipboardAnalysis.sections.map((section) =>
        source.slice(section.from, section.to),
      );
      return this.insertTabSourceSections(copiedSections);
    }

    const defaultTitle = this.isVertical
      ? this.plugin.settings.defaultTabNavItemVertical || "New vertical tab"
      : this.plugin.settings.defaultTabNavItem || "New tab";
    return this.insertNewTab(defaultTitle, source);
  }
  deleteTabAt(tabIndex) {
    const analyzed = this.analyzeCurrentTabSections();
    if (
      !analyzed ||
      analyzed.sections.length <= 1 ||
      tabIndex < 0 ||
      tabIndex >= analyzed.sections.length
    ) {
      return false;
    }
    const sections = analyzed.sections.map((section) =>
      this.rawText.slice(section.from, section.to),
    );
    sections.splice(tabIndex, 1);
    const nextRawText = tabsExtendedJoinTabSections(
      analyzed.prefix,
      sections,
      this.rawText,
    );
    let nextActiveIndex = this.currentIndex;
    if (tabIndex === this.currentIndex) {
      nextActiveIndex = Math.min(tabIndex, sections.length - 1);
    } else if (tabIndex < this.currentIndex) {
      nextActiveIndex -= 1;
    }
    return this.persistRawTextUpdate(nextRawText, nextActiveIndex);
  }
  resolveNestedSourceBlock(contentText, childTabs) {
    const parentContent = childTabs && childTabs.parentTabContent;
    const blocks = parentContent &&
      typeof parentContent.getDirectNestedBlocks === "function"
      ? parentContent.getDirectNestedBlocks(contentText)
      : tabsExtendedFindDirectNestedBlocks(contentText, this.plugin.settings);
    const expectedBody = tabsExtendedNormalizeSource(childTabs.rawText);
    const isMatch = (block) =>
      block &&
      block.isVertical === !!childTabs.isVertical &&
      tabsExtendedNormalizeSource(
        contentText.slice(block.bodyFrom, block.bodyTo),
      ) === expectedBody;

    const ordinalBlock = blocks[childTabs.sourceOrdinal];
    if (isMatch(ordinalBlock)) {
      return { block: ordinalBlock, index: childTabs.sourceOrdinal };
    }

    const matches = [];
    for (let index = 0; index < blocks.length; index++) {
      if (isMatch(blocks[index])) matches.push({ block: blocks[index], index });
    }
    return matches.length === 1 ? matches[0] : null;
  }
  buildSourceUpdate(nextRawText) {
    const tabsUpdates = new Map([[this, nextRawText]]);
    const contentUpdates = new Map();
    const visited = new Set();
    let childTabs = this;

    while (childTabs.parentTabContent) {
      if (visited.has(childTabs)) return null;
      visited.add(childTabs);
      const parentContent = childTabs.parentTabContent;
      const parentTabs = parentContent.ownerTabs;
      if (!parentTabs) return null;

      const currentContent = contentUpdates.has(parentContent)
        ? contentUpdates.get(parentContent)
        : parentContent.content;
      const resolvedBlock = parentTabs.resolveNestedSourceBlock(
        currentContent,
        childTabs,
      );
      if (!resolvedBlock) return null;
      childTabs.sourceOrdinal = resolvedBlock.index;
      const childRaw = tabsUpdates.get(childTabs);
      const currentNestedBody = currentContent.slice(
        resolvedBlock.block.bodyFrom,
        resolvedBlock.block.bodyTo,
      );
      const boundaryMatch = currentNestedBody.match(/(\r\n|\n|\r)$/);
      const boundaryLineBreak = boundaryMatch ? boundaryMatch[1] : "\n";
      const updatedContent =
        currentContent.slice(0, resolvedBlock.block.bodyFrom) +
        childRaw +
        boundaryLineBreak +
        currentContent.slice(resolvedBlock.block.bodyTo);
      contentUpdates.set(parentContent, updatedContent);

      const parentRaw = tabsUpdates.has(parentTabs)
        ? tabsUpdates.get(parentTabs)
        : parentTabs.rawText;
      const analyzedParent = tabsExtendedAnalyzeTabSections(
        parentRaw,
        parentTabs.split,
        parentTabs.plugin.settings,
      );
      const contentIndex = parentTabs.tabsContents.tabcontents.indexOf(
        parentContent,
      );
      if (
        !analyzedParent ||
        contentIndex < 0 ||
        contentIndex >= analyzedParent.sections.length
      ) {
        return null;
      }
      const parentSection = analyzedParent.sections[contentIndex];
      const updatedParentRaw =
        parentRaw.slice(0, parentSection.contentFrom) +
        updatedContent +
        parentRaw.slice(parentSection.to);
      tabsUpdates.set(parentTabs, updatedParentRaw);
      childTabs = parentTabs;
    }

    return {
      rootTabs: childTabs,
      rootRawText: tabsUpdates.get(childTabs),
      tabsUpdates,
      contentUpdates,
    };
  }
  writeRootRawText(rootTabs, nextRawText) {
    if (!rootTabs || rootTabs.parentTabContent) {
      return false;
    }
    const view = rootTabs.getWritableView();
    if (!view) return false;
    const blockRange = rootTabs.findOuterBlockRange(
      view.editor,
      rootTabs.rawText,
    );
    if (blockRange.startLine < 0 || blockRange.closingLine < 0) return false;
    const startLine = blockRange.startLine;
    const closingLine = blockRange.closingLine;

    const currentBodyWithBoundary = view.editor.getRange(
      { line: startLine + 1, ch: 0 },
      { line: closingLine, ch: 0 },
    );
    const currentBody = String(currentBodyWithBoundary).replace(
      /(?:\r\n|\n|\r)$/,
      "",
    );

    const nextBody = String(nextRawText);
    const openingLine = String(
      view.editor.getLine(startLine) || "",
    );
    const openingMatch = openingLine.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (!openingMatch) return false;
    const fenceChar = openingMatch[2][0];
    const currentFenceLength = openingMatch[2].length;
    const maxInnerFenceLength = tabsExtendedMaxFenceLength(
      nextBody,
      fenceChar,
    );
    const requiredFenceLength = Math.max(
      currentFenceLength,
      maxInnerFenceLength >= currentFenceLength
        ? maxInnerFenceLength + 1
        : currentFenceLength,
    );

    if (requiredFenceLength > currentFenceLength) {
      const closingLineText = String(view.editor.getLine(closingLine) || "");
      const closingMatch = closingLineText.match(
        /^(\s*)(`{3,}|~{3,})(\s*)$/,
      );
      if (!closingMatch || closingMatch[2][0] !== fenceChar) return false;
      const nextFence = fenceChar.repeat(requiredFenceLength);
      const nextOpeningLine =
        openingMatch[1] + nextFence + openingMatch[3];
      const nextClosingLine =
        closingMatch[1] + nextFence + closingMatch[3];
      const nextBlock =
        nextOpeningLine + "\n" + nextBody + "\n" + nextClosingLine;
      view.editor.replaceRange(
        nextBlock,
        { line: startLine, ch: 0 },
        { line: closingLine, ch: closingLineText.length },
      );
      rootTabs.backquote = fenceChar;
      rootTabs.backquoteCount = requiredFenceLength;
      rootTabs.sectionInfo = {
        lineStart: startLine,
        lineEnd: startLine + nextBlock.split("\n").length - 1
      };
    } else {
      view.editor.replaceRange(
        nextBody + "\n",
        { line: startLine + 1, ch: 0 },
        { line: closingLine, ch: 0 },
      );
      const oldLineCount = currentBody.split(/\r?\n/).length;
      const newLineCount = nextBody.split(/\r?\n/).length;
      rootTabs.sectionInfo = {
        lineStart: startLine,
        lineEnd: closingLine + newLineCount - oldLineCount
      };
    }
    return true;
  }
  stageSourceMutationFocus(nextActiveIndex) {
    const cache = this.plugin.lastTabsCache;
    if (!(cache instanceof Map)) return () => {};
    const snapshots = [];
    const visited = new Set();
    let currentTabs = this;
    let isDraggedBlock = true;

    while (currentTabs && !visited.has(currentTabs)) {
      visited.add(currentTabs);
      const cacheId = currentTabs.tabsId;
      if (cacheId) {
        snapshots.push({
          cacheId,
          existed: cache.has(cacheId),
          value: cache.get(cacheId),
        });
        cache.set(
          cacheId,
          isDraggedBlock ? nextActiveIndex : currentTabs.currentIndex,
        );
      }
      isDraggedBlock = false;
      currentTabs = currentTabs.parentTabContent
        ? currentTabs.parentTabContent.ownerTabs
        : null;
    }

    return () => {
      snapshots.forEach((snapshot) => {
        if (snapshot.existed) cache.set(snapshot.cacheId, snapshot.value);
        else cache.delete(snapshot.cacheId);
      });
    };
  }
  persistRawTextUpdate(nextRawText, nextActiveIndex) {
    const sourceUpdate = this.buildSourceUpdate(nextRawText);
    if (!sourceUpdate) return false;
    // Prepare the complete active ancestry before touching the editor because
    // Obsidian may synchronously rebuild nested processors during replaceRange.
    const rollbackFocus = this.stageSourceMutationFocus(nextActiveIndex);
    if (!this.writeRootRawText(
      sourceUpdate.rootTabs,
      sourceUpdate.rootRawText,
    )) {
      rollbackFocus();
      return false;
    }
    sourceUpdate.tabsUpdates.forEach((rawText, tabs) => {
      tabs.rawText = rawText;
      tabs.sourceAnalysisCache = null;
    });
    sourceUpdate.contentUpdates.forEach((content, contentItem) => {
      contentItem.content = content;
      contentItem.nestedBlocksCache = null;
    });
    this.currentIndex = nextActiveIndex;
    return true;
  }
  reorderTab(fromIndex, toIndex) {
    if (
      fromIndex === toIndex ||
      !this.canPersistTabOrder() ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.tabsNav.navItems.length ||
      toIndex >= this.tabsNav.navItems.length
    ) {
      return false;
    }
    const reorderedRawText = this.buildReorderedRawText(fromIndex, toIndex);
    if (reorderedRawText == null) return false;
    if (!this.persistRawTextUpdate(reorderedRawText, toIndex)) return false;

    const movedNav = this.tabsNav.navItems.splice(fromIndex, 1)[0];
    this.tabsNav.navItems.splice(toIndex, 0, movedNav);
    const movedContent = this.tabsContents.tabcontents.splice(fromIndex, 1)[0];
    this.tabsContents.tabcontents.splice(toIndex, 0, movedContent);

    this.tabsNav.navWrapperEl.removeChild(movedNav.tabitemEl);
    this.tabsContents.tabcontentsEl.removeChild(movedContent.contentEl);
    const nextNav = this.tabsNav.navItems[toIndex + 1];
    const nextContent = this.tabsContents.tabcontents[toIndex + 1];
    if (nextNav) {
      this.tabsNav.navWrapperEl.insertBefore(
        movedNav.tabitemEl,
        nextNav.tabitemEl,
      );
      this.tabsContents.tabcontentsEl.insertBefore(
        movedContent.contentEl,
        nextContent.contentEl,
      );
    } else {
      this.tabsNav.navWrapperEl.appendChild(movedNav.tabitemEl);
      this.tabsContents.tabcontentsEl.appendChild(movedContent.contentEl);
    }

    for (let index = 0; index < this.tabsNav.navItems.length; index++) {
      this.tabsNav.navItems[index].index = index;
      this.tabsContents.tabcontents[index].index = index + 1;
      const isDraggedTab = index === toIndex;
      this.tabsNav.navItems[index].isActiveed = isDraggedTab;
      this.tabsNav.navItems[index].tabitemEl.classList.toggle(
        "tabs-nav-item-active",
        isDraggedTab,
      );
      this.tabsContents.tabcontents[index].isActiveed = isDraggedTab;
      this.tabsContents.tabcontents[index].contentEl.classList.toggle(
        "tabs-content-active",
        isDraggedTab,
      );
    }
    this.currentIndex = toIndex;
    this.tabsNav.currentTab = toIndex;
    this.tabsContents.currentTab = toIndex;
    return true;
  }
  cancelScrollAnchorSchedule() {
    if (this.scrollAnchorFrame != null) {
      window.cancelAnimationFrame(this.scrollAnchorFrame);
      this.scrollAnchorFrame = null;
    }
    for (const timer of this.scrollAnchorTimers) {
      window.clearTimeout(timer);
    }
    this.scrollAnchorTimers.length = 0;
  }
  lockScrollPosition(anchorEl, action) {
    this.cancelScrollAnchorSchedule();
    if (!anchorEl) {
      action();
      return;
    }
    const scroller = anchorEl.closest(".cm-scroller, .markdown-preview-view, .markdown-reading-view") || document.scrollingElement || document.documentElement;
    const targetEl = anchorEl.closest(".cm-embed-block, .cm-line, .tabs-container") || anchorEl;
    
    const initialBoundingTop = targetEl ? targetEl.getBoundingClientRect().top : 0;
    const desiredBoundingTop = initialBoundingTop < 0 ? 8 : initialBoundingTop;

    action();

    if (!scroller) return;

    const enforceAnchor = () => {
      const currentEl = (targetEl && targetEl.isConnected) ? targetEl : ((anchorEl && anchorEl.isConnected) ? anchorEl : null);
      if (!currentEl || !currentEl.isConnected) return;

      const currentBoundingTop = currentEl.getBoundingClientRect().top;
      const diff = currentBoundingTop - desiredBoundingTop;

      if (Math.abs(diff) > 1) {
        const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const newScrollTop = Math.max(0, Math.min(maxScroll, scroller.scrollTop + diff));
        scroller.scrollTop = newScrollTop;
      }
    };

    enforceAnchor();
    this.scrollAnchorFrame = window.requestAnimationFrame(() => {
      this.scrollAnchorFrame = null;
      enforceAnchor();
    });
  }
  registerEventHandlers() {
    const dragEnabled =
      !!this.plugin.settings.dragAndDrop && this.canPersistTabOrder();
    this.tabsNav.navItems.forEach((item) => {
      item.tabitemEl.setAttr("draggable", dragEnabled ? "true" : "false");
      item.tabitemEl.setAttr("aria-grabbed", "false");
    });
    if (this.tabsEl) {
      this.registerDomEvent(
        this.tabsEl,
        "wheel",
        (ev) => {
          let isVert =
            this.isVertical ||
            (this.tabsConfig &&
              (this.tabsConfig.titlePosition === "left" ||
                this.tabsConfig.titlePosition === "right"));
          if (!isVert) return;
          if (!ev.shiftKey) return;
          if (!this.tabsNav || !this.tabsNav.navItems || this.tabsNav.navItems.length <= 1) return;

          ev.preventDefault();
          ev.stopPropagation();

          let now = Date.now();
          if (this._lastWheelTime && now - this._lastWheelTime < 140) return;
          this._lastWheelTime = now;

          let delta = (ev.deltaY > 0 || ev.deltaX > 0) ? 1 : -1;
          let newIndex =
            (this.currentIndex + delta + this.tabsNav.navItems.length) %
            this.tabsNav.navItems.length;

          this.lockScrollPosition(this.tabsEl, () => {
            this.tabsNav.refreshActiveTabNav(newIndex);
            this.tabsContents.refreshActiveTabContent(newIndex);
            this.currentIndex = newIndex;
            this.plugin.lastTabsCache.set(this.tabsId, newIndex);
          });
        },
        { passive: false }
      );
    }
    this.tabsNav.navItems.forEach((t) => {
      this.registerDomEvent(t.tabitemEl, "mousedown", (ev) => {
        if (!(dragEnabled && ev.button === 0)) ev.preventDefault();
        ev.stopPropagation();
      });
      this.registerDomEvent(t.tabitemEl, "click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        let e = this.tabsNav.navItems.indexOf(t);
        this.lockScrollPosition(t.tabitemEl, () => {
          this.tabsNav.refreshActiveTabNav(e);
          this.tabsContents.refreshActiveTabContent(e);
          this.currentIndex = e;
          this.plugin.lastTabsCache.set(
            this.tabsId,
            e,
          );
        });
      });
    });
    if (this.tabsType === "outertabs" && this.plugin.settings.doubleClickToEdit) {
      this.registerDomEvent(
        this.tabsContents.tabcontentsEl,
        "dblclick",
        (t) => {
          t.preventDefault();
          if (this.activeView && !this.isPreviewMode()) {
            this.plugin.tabsEditorModal.startEditing(this);
          }
        },
      );
    }
    switch (this.tabsConfig.actionButton) {
      case "action-none":
        break;
      case "action-edit":
        if (this.activeView && !this.isPreviewMode() && this.tabsType !== "innertabs" && this.tabsNav.tabsButton && this.tabsNav.tabsButton.buttonEl) {
          this.registerDomEvent(
            this.tabsNav.tabsButton.buttonEl,
            "click",
            () => {
              this.plugin.tabsEditorModal.startEditing(this);
            },
          );
        }
        break;
      case "action-add":
        if (this.activeView && !this.isPreviewMode() && this.tabsType !== "innertabs" && this.tabsNav.tabsButton && this.tabsNav.tabsButton.buttonEl) {
          this.registerDomEvent(
            this.tabsNav.tabsButton.buttonEl,
            "click",
            () => {
              let title = this.isVertical
                ? (this.plugin.settings.defaultTabNavItemVertical || "New vertical tab")
                : (this.plugin.settings.defaultTabNavItem || "New tab");
              let content = this.plugin.settings.defaultTabContent || "New tab content";
              TabContextMenu.updateBlockWithNewTab(this, title, content);
            },
          );
        }
        break;
      default:
        this.plugin.settings.actionButtonType = "action-none";
        this.plugin.saveSettings();
        new Notice($("notice.invalidActionButtonType"));
    }
    if (this.activeView && !this.isPreviewMode()) {
      this.registerDomEvent(this.tabsNav.navEl, "contextmenu", (t) => {
        t.preventDefault();
        t.stopPropagation();
        new TabContextMenu(this, t).showAtMouseEvent(t);
      });
    }
    if (dragEnabled) {
      this.tabsNav.registerDragEvents();
    }
  }
  isPreviewMode() {
    var t;
    return (
      ((t = this.activeView) == null
        ? void 0
        : t.leaf.getViewState().state.mode) === "preview"
    );
  }
  updateBackquote(rawText) {
    // The source opening line is the only authority for the current outer
    // fence. Collision growth is calculated atomically by writeRootRawText().
    if (this.activeView && this.sectionInfo && this.activeView.editor) {
      const openLine = this.activeView.editor
        .getLine(this.sectionInfo.lineStart)
        .trim();
      const openMatch = openLine.match(/^(`{3,}|~{3,})\s*(.*)$/);
      if (openMatch) {
        const openFence = openMatch[1];
        this.backquote = openFence[0];          // '`' or '~'
        this.backquoteCount = openFence.length; // exact fence length
        this.headerTag = openMatch[2].trim() || (this.isVertical ? "tabs-v" : "tabs");
      }
    }
  }
};
