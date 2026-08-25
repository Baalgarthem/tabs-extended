import { Plugin, MarkdownView, Notice } from 'obsidian';
import { Tabs } from './core/model.js';
import { TabsExtendedSettingTab } from './settings/SettingTab.js';
import { DEFAULT_SETTINGS } from './settings/defaultSettings.js';
import { ChangelogModal } from './modals/ChangelogModal.js';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal.js';
import { TabsEditorModal } from './editor/modal.js';
import { tabsExtendedCorePreviewStyles } from './styles/previewStyles.js';
import { $ } from './i18n/index.js';

export default class TabsExtendedPlugin extends Plugin {
  async onload() {
    // Dependencies used by TabsRenderer must exist before registering processors or
    // requesting a view rebuild. onLayoutReady may call back synchronously
    // when Obsidian's workspace is already open.
    this.lastTabsCache = new Map();
    this.lastTabsCache.set("/", 0);

    this.registerMarkdownPostProcessor((el, ctx) => {
      const pres = el.querySelectorAll('.tabs-container pre, .tabs-content pre');
      pres.forEach(pre => {
        if (pre.parentElement && !pre.parentElement.classList.contains('tabs-codeblock-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'tabs-codeblock-wrapper';
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(pre);
        }
      });
    });

    if (typeof window !== "undefined" && !window.hasTabsExtGlobalDeleteListener) {
      window.hasTabsExtGlobalDeleteListener = true;
      window.tabsExtActiveViews = [];

      const handleGlobalClick = (evt) => {
        const btn = evt.target.closest(".tabs-ext-delete-button");
        if (!btn) return;

        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();

        const from = parseInt(btn.dataset.from, 10);
        const to = parseInt(btn.dataset.to, 10);
        const type = btn.dataset.type || "tab";

        if (Array.isArray(window.tabsExtActiveViews)) {
          window.tabsExtActiveViews = window.tabsExtActiveViews.filter(
            (v) => v && !v.destroyed && v.dom && v.dom.isConnected
          );
        }

        let activeEditor = null;
        for (let view of (window.tabsExtActiveViews || [])) {
          if (view && view.dom && view.dom.contains(btn)) {
            activeEditor = view;
            break;
          }
        }
        if (!activeEditor && window.tabsExtActiveViews && window.tabsExtActiveViews.length > 0) {
          activeEditor = window.tabsExtActiveViews[window.tabsExtActiveViews.length - 1];
        }

        if (!activeEditor || !activeEditor.state || !activeEditor.dispatch) {
          try {
            new Notice("TabsExt: Botón clickeado pero no se encontró la vista del editor.");
          } catch(err) {}
          return;
        }

        let label = "la pestaña";
        if (type === "fence") label = "el bloque de pestañas anidadas";
        else if (type === "separator") label = "la subpestaña";

        const confirmMessage = `¿Estás seguro de que deseas eliminar ${label}?`;

        try {
          const doc = activeEditor.state.doc;
          let deleteFrom = from;
          let deleteTo = to;

          if (type === "fence") {
            const startLineObj = doc.lineAt(from);
            deleteFrom = startLineObj.from;
            const endLineObj = doc.lineAt(to);
            deleteTo = endLineObj.to;
            if (deleteTo < doc.length) {
              const nextChar = doc.sliceString(deleteTo, deleteTo + 1);
              if (nextChar === "\n") deleteTo += 1;
            }
          } else {
            const lineObj = doc.lineAt(from);
            deleteFrom = lineObj.from;
            deleteTo = lineObj.to;
            if (deleteTo < doc.length) {
              const nextChar = doc.sliceString(deleteTo, deleteTo + 1);
              if (nextChar === "\n") deleteTo += 1;
            }
          }

          let deletedContent = doc.sliceString(deleteFrom, deleteTo).trim();
          let isEmpty = false;

          if (type === "fence") {
            let lines = deletedContent.split("\n");
            if (lines.length <= 3) {
              let nonFenceLines = lines.slice(1, -1);
              let joined = nonFenceLines.join("").trim();
              if (joined.length === 0 || /^tema:[^\n]*$/i.test(joined)) {
                isEmpty = true;
              }
            }
          } else {
            let nextSectionMatch = doc.sliceString(deleteTo).match(/^(?:~~~|```|tema:)/m);
            let contentEnd = nextSectionMatch ? deleteTo + nextSectionMatch.index : doc.length;
            let sectionBody = doc.sliceString(deleteTo, contentEnd).trim();
            if (sectionBody.length === 0) {
              isEmpty = true;
            }
          }

          if (isEmpty) {
            let tr = activeEditor.state.update({
              changes: { from: deleteFrom, to: deleteTo },
              effects: []
            });
            activeEditor.dispatch(tr);
            return;
          }

          new ConfirmDeleteModal(this.app, confirmMessage, () => {
            let tr = activeEditor.state.update({
              changes: { from: deleteFrom, to: deleteTo },
              effects: []
            });
            activeEditor.dispatch(tr);
          }).open();
        } catch (err) {
          try {
            new Notice("Tabs Ext Error: " + err.message);
          } catch(e) {}
        }
      };

      this.globalClickHandler = handleGlobalClick;
      if (typeof document !== "undefined") {
        document.addEventListener("mousedown", handleGlobalClick, { capture: true });
        document.addEventListener("pointerdown", handleGlobalClick, { capture: true });
        document.addEventListener("click", handleGlobalClick, { capture: true });
      }
    }

    await this.loadSettings();

    // Register the feature's core processor before optional UI and stylesheet
    // recovery work. A failure in either auxiliary path must not prevent tabs
    // blocks from being recognized.
    this.registerCodeBlockProcessors();
    this.tabsEditorModal = new TabsEditorModal(this, this.app);
    this.addSettingTab(new TabsExtendedSettingTab(this.app, this));
    this.registerCommands();
    await this.ensurePreviewStylesLoaded();
    this.app.workspace.onLayoutReady(() => {
      this.settings.autorefreshMarkdownView && this.refreshActiveView();
    });
  }

  clearTabsCache() {
    if (this.lastTabsCache instanceof Map) {
      this.lastTabsCache.clear();
      this.lastTabsCache.set("/", 0);
    }
  }

  setTabCache(id, index) {
    if (!(this.lastTabsCache instanceof Map)) {
      this.lastTabsCache = new Map();
    }
    if (this.lastTabsCache.size > 1000) {
      const keysToDelete = Array.from(this.lastTabsCache.keys()).slice(0, 500);
      for (const k of keysToDelete) {
        if (k !== "/") this.lastTabsCache.delete(k);
      }
    }
    this.lastTabsCache.set(id, index);
  }

  async ensurePreviewStylesLoaded() {
    if (typeof document === "undefined" || !document.body || !document.head) return;

    const runtimeStyleId = "tabs-extended-runtime-styles";
    if (document.getElementById(runtimeStyleId)) return;

    const probe = document.createElement("div");
    probe.className = "tabs-container";
    probe.style.cssText = "position:fixed;left:-10000px;top:-10000px;visibility:hidden;";
    const nav = document.createElement("div");
    nav.className = "tabs-nav";
    const item = document.createElement("div");
    item.className = "tabs-nav-item";
    nav.appendChild(item);
    probe.appendChild(nav);
    document.body.appendChild(probe);

    let previewStylesActive = false;
    try {
      if (typeof window !== "undefined" && window.getComputedStyle) {
        const navStyle = window.getComputedStyle(nav);
        const itemStyle = window.getComputedStyle(item);
        previewStylesActive =
          navStyle.display === "inline-flex" &&
          Math.round(parseFloat(itemStyle.paddingLeft) || 0) >= 15;
      }
    } finally {
      if (probe.remove) probe.remove();
    }

    if (previewStylesActive) return;

    let cssText = "";
    let styleSource = "embedded-core";
    try {
      const pluginDir = this.manifest && this.manifest.dir
        ? this.manifest.dir
        : `.obsidian/plugins/${(this.manifest && this.manifest.id) || "tabs-extended"}`;
      cssText = await this.app.vault.adapter.read(`${pluginDir}/styles.css`);
      if (!cssText || !cssText.trim()) throw new Error("styles.css está vacío");
      styleSource = "styles.css";
    } catch (err) {
      cssText = tabsExtendedCorePreviewStyles;
    }

    const styleEl = document.createElement("style");
    styleEl.id = runtimeStyleId;
    styleEl.dataset.tabsExtendedFallback = styleSource;
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);
    this.runtimeStylesEl = styleEl;
    this.register(() => {
      if (styleEl && styleEl.isConnected) styleEl.remove();
      if (this.runtimeStylesEl === styleEl) this.runtimeStylesEl = null;
    });
  }

  registerCodeBlockProcessors() {
    let mainKw = (this.settings.tabsKeyword || "tabs").trim();
    if (!mainKw) mainKw = "tabs";

    let keywords = new Set([mainKw, mainKw + "-v", "tabs", "tabs-v"]);

    keywords.forEach((kw) => {
      let isVertical = kw.endsWith("-v");
      try {
        this.registerMarkdownCodeBlockProcessor(kw, (t, e, i) => {
          try {
            const tabsInstance = new Tabs(t, e, i, this.app, this, isVertical);
            if (i && typeof i.addChild === 'function') {
              i.addChild(tabsInstance);
            }
          } catch (procErr) {
            console.error(`Tabs Extended error in ${kw} processor:`, procErr);
          }
        });
      } catch (err) {
        console.error(`Tabs Extended could not register the ${kw} preview processor:`, err);
      }
    });
  }

  onunload() {
    if (this.globalClickHandler) {
      if (typeof document !== "undefined") {
        document.removeEventListener("mousedown", this.globalClickHandler, { capture: true });
        document.removeEventListener("pointerdown", this.globalClickHandler, { capture: true });
        document.removeEventListener("click", this.globalClickHandler, { capture: true });
      }
      this.globalClickHandler = null;
    }
    if (typeof window !== "undefined") {
      window.hasTabsExtGlobalDeleteListener = false;
      window.tabsExtActiveViews = [];
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.updateGlobalCssVariables();
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateGlobalCssVariables();
  }

  updateGlobalCssVariables() {
    let s = this.settings || {};
    let rawLeftSpacing = (s.verticalTabsLeftSpacing !== undefined && s.verticalTabsLeftSpacing !== null) ? s.verticalTabsLeftSpacing : 4;
    let leftSpacing = Math.max(0, rawLeftSpacing);
    let rawRightSpacing = (s.verticalTabsRightSpacing !== undefined && s.verticalTabsRightSpacing !== null) ? s.verticalTabsRightSpacing : 8;
    let rightSpacing = Math.max(0, rawRightSpacing);
    let horizontalFontSize = (s.horizontalTabTitleFontSize !== undefined && s.horizontalTabTitleFontSize !== null) ? s.horizontalTabTitleFontSize : 13;
    let verticalFontSize = (s.verticalTabTitleFontSize !== undefined && s.verticalTabTitleFontSize !== null) ? s.verticalTabTitleFontSize : 13;
    let padding = s.defaultTabsContentsPadding || "1em 2em";
    let maxHeight = s.defaultTabsContentsMaxHeight || "none";
    let borderColor = s.defaultTabsBorderColor || "#e0e0e0";
    let vBehavior = s.verticalTitleBehavior || "hover-scroll";
    if (vBehavior === "truncate" || vBehavior === "double-line") {
      vBehavior = "multi-line";
    }

    let vAlign = s.verticalTitleAlignment || "left";
    if (vAlign !== "left" && vAlign !== "center" && vAlign !== "right") {
      vAlign = "left";
    }
    let cAlign = s.tabContentAlignment || "left";
    let cHyphen = s.tabContentHyphenation || "none";

    let vAlignCss = vAlign;
    let vJustifyCss = vAlign === "center" ? "center" : vAlign === "right" ? "flex-end" : "flex-start";
    let cAlignCss = cAlign === "soft-justify" ? "justify" : cAlign === "inherit" ? "inherit" : cAlign;

    let paddingParts = (padding || "1em 2em").trim().split(/\s+/);
    let leftPad = paddingParts.length >= 2 ? paddingParts[1] : (paddingParts[0] || "2em");

    const targets = [typeof document !== "undefined" ? document.body : null, typeof document !== "undefined" ? document.documentElement : null].filter(Boolean);
    targets.forEach(targetEl => {
      if (targetEl && targetEl.style) {
        targetEl.style.setProperty("--vertical-tabs-left-spacing", leftSpacing + "px");
        targetEl.style.setProperty("--vertical-tabs-right-spacing", rightSpacing + "px");
        targetEl.style.setProperty("--horizontal-tab-font-size", horizontalFontSize + "px");
        targetEl.style.setProperty("--vertical-tab-font-size", verticalFontSize + "px");
        targetEl.style.setProperty("--tabs-contents-padding", padding);
        targetEl.style.setProperty("--tabs-contents-padding-left", leftPad);
        targetEl.style.setProperty("--tabs-max-height", maxHeight);
        targetEl.style.setProperty("--tabs-border-color", borderColor);
        targetEl.style.setProperty("--vertical-title-align", vAlignCss);
        targetEl.style.setProperty("--vertical-title-justify", vJustifyCss);
        targetEl.style.setProperty("--tab-content-align", cAlignCss);
      }
    });

    try {
      if (typeof document !== "undefined" && document.querySelectorAll) {
        document.querySelectorAll(".tabs-container").forEach((el) => {
          if (el && el.style) {
            el.style.setProperty("--horizontal-tab-font-size", horizontalFontSize + "px");
            el.style.setProperty("--vertical-tab-font-size", verticalFontSize + "px");
            el.style.setProperty("--tabs-contents-padding", padding);
            el.style.setProperty("--tabs-contents-padding-left", leftPad);
            el.style.setProperty("--tabs-max-height", maxHeight);
            el.style.setProperty("--tabs-border-color", borderColor);
            el.style.setProperty("--vertical-title-align", vAlignCss);
            el.style.setProperty("--vertical-title-justify", vJustifyCss);
            el.style.setProperty("--tab-content-align", cAlignCss);

            // Content alignment classes
            el.classList.remove(
              "tabs-content-align-left",
              "tabs-content-align-center",
              "tabs-content-align-right",
              "tabs-content-align-justify",
              "tabs-content-align-soft-justify",
              "tabs-content-align-inherit"
            );
            el.classList.add("tabs-content-align-" + cAlign);

            // Content hyphenation classes
            el.classList.remove("tabs-content-hyphens-none", "tabs-content-hyphens-auto");
            el.classList.add("tabs-content-hyphens-" + cHyphen);

            if (el.classList.contains("tabs-nav-left") || el.classList.contains("tabs-nav-right")) {
              el.classList.remove(
                "tabs-nav-v-align-left",
                "tabs-nav-v-align-center",
                "tabs-nav-v-align-right",
                "tabs-nav-v-align-soft-justify",
                "tabs-nav-v-behavior-hover-scroll",
                "tabs-nav-v-behavior-auto-scroll",
                "tabs-nav-v-behavior-multi-line",
                "tabs-nav-v-behavior-shrink",
                "tabs-nav-v-behavior-truncate",
                "tabs-nav-v-behavior-double-line",
                "tabs-nav-v-hover-scroll"
              );
              el.classList.add("tabs-nav-v-align-" + vAlign);
              el.classList.add("tabs-nav-v-behavior-" + vBehavior);
              if (vBehavior === "hover-scroll") {
                el.classList.add("tabs-nav-v-hover-scroll");
              }
            }
          }
        });
      }
    } catch (e) {
      // Ignored if DOM query fails
    }
  }

  updateVerticalTabsLeftSpacingCss(val) {
    if (val !== undefined && val !== null && this.settings) {
      this.settings.verticalTabsLeftSpacing = Math.max(0, val);
    }
    this.updateGlobalCssVariables();
  }

  updateVerticalTabsRightSpacingCss(val) {
    if (val !== undefined && val !== null && this.settings) {
      this.settings.verticalTabsRightSpacing = Math.max(0, val);
    }
    this.updateGlobalCssVariables();
  }

  updateHorizontalTabTitleFontSizeCss(val) {
    if (val !== undefined && val !== null && this.settings) {
      this.settings.horizontalTabTitleFontSize = Math.max(8, val);
    }
    this.updateGlobalCssVariables();
  }

  updateVerticalTabTitleFontSizeCss(val) {
    if (val !== undefined && val !== null && this.settings) {
      this.settings.verticalTabTitleFontSize = Math.max(8, val);
    }
    this.updateGlobalCssVariables();
  }

  updateVerticalTitleBehaviorCss(val) {
    if (val && this.settings) {
      this.settings.verticalTitleBehavior = val;
    }
    this.updateGlobalCssVariables();
  }

  async registerCommands() {
    this.addCommand({
      id: "convert-to-tabs",
      name: $("commands.convertToTabs"),
      editorCallback: (editor, view) => {
        let cmView = view?.editor?.cm;
        let cursorDepth = 0;
        let parentFenceLen = 3;

        if (cmView) {
          let doc = cmView.state.doc;
          let cursorPos = cmView.state.selection.main.head;
          let cursorLine = doc.lineAt(cursorPos).number;
          let fenceStack = [];

          for (let p = 1; p < cursorLine; p++) {
            let text = doc.line(p).text.trim();
            let match = text.match(/^(`{3,}|~{3,})(.*)/);
            if (!match) continue;

            let fenceStr = match[1];
            let info = match[2].trim();
            let current = fenceStack.length > 0 ? fenceStack[fenceStack.length - 1] : null;

            if (current && current.type === "code") {
              if (fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && info === "")
                fenceStack.pop();
              continue;
            }

            if (current && fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && info === "") {
              fenceStack.pop();
            } else {
              fenceStack.push({ fence: fenceStr, type: info === "tabs" ? "tabs" : "code" });
            }
          }

          cursorDepth = fenceStack.filter(f => f.type === "tabs").length;
          let parent = [...fenceStack].reverse().find(f => f.type === "tabs");
          parentFenceLen = parent ? parent.fence.length : 3;
        }

        let newFenceLen = cursorDepth === 0 ? 3 : Math.max(3, parentFenceLen - 1);
        let fence = "`".repeat(newFenceLen);

        let selection = editor.getSelection();
        let split = this.settings.split;
        let defaultNav = this.settings.defaultTabNavItem;
        let defaultContent = this.settings.defaultTabContent;
        let kw = (this.settings.tabsKeyword || "tabs").trim();

        let headingConverted = this.convertHeadingTextToTabs(selection, split, kw, newFenceLen);
        if (headingConverted) {
          editor.replaceSelection(headingConverted);
          return;
        }

        if (selection.trim() === "") {
          editor.replaceSelection(fence + kw + "\n" + split + defaultNav + "\n" + defaultContent + "\n" + fence);
        } else if (selection.includes("`") || selection.includes("~")) {
          let maxRun = 0, run = 0;
          for (let ch of selection) {
            if (ch === "`" || ch === "~") { run++; maxRun = Math.max(maxRun, run); } else run = 0;
          }
          let wrapFence = "`".repeat(Math.max(newFenceLen, maxRun + 1));
          if (selection.startsWith(split))
            editor.replaceSelection(wrapFence + kw + "\n" + selection + "\n" + wrapFence);
          else
            editor.replaceSelection(wrapFence + kw + "\n" + split + defaultNav + "\n" + selection + "\n" + wrapFence);
        } else {
          if (selection.startsWith(split))
            editor.replaceSelection(fence + kw + "\n" + selection + "\n" + fence);
          else
            editor.replaceSelection(fence + kw + "\n" + split + defaultNav + "\n" + selection + "\n" + fence);
        }
      },
    });

    this.addCommand({
      id: "refresh-all-tabs",
      name: $("commands.refreshAllTabs"),
      callback: () => {
        this.refreshOpenViews();
      },
    });
  }

  convertHeadingTextToTabs(selection, split, kw, minFenceLen = 3) {
    if (!selection || !/^#{1,6}\s+/m.test(selection)) return null;

    let maxRun = 0, run = 0;
    for (let ch of selection) {
      if (ch === "`" || ch === "~") { run++; maxRun = Math.max(maxRun, run); } else run = 0;
    }

    let lines = selection.split(/\r?\n/);
    let root = { level: 0, title: "root", ownContent: [], children: [] };
    let stack = [root];

    let insideCodeBlock = false;
    let codeBlockFenceChar = null;
    let codeBlockFenceLen = 0;

    for (let line of lines) {
      let trimmed = line.trim();
      let fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

      if (!insideCodeBlock) {
        if (fenceMatch) {
          insideCodeBlock = true;
          codeBlockFenceChar = fenceMatch[1][0];
          codeBlockFenceLen = fenceMatch[1].length;
          stack[stack.length - 1].ownContent.push(line);
          continue;
        }

        let match = line.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
          let level = match[1].length;
          let title = match[2].trim();
          let node = { level, title, ownContent: [], children: [] };

          while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
          }
          stack[stack.length - 1].children.push(node);
          stack.push(node);
          continue;
        }

        stack[stack.length - 1].ownContent.push(line);
      } else {
        stack[stack.length - 1].ownContent.push(line);
        if (fenceMatch) {
          let fChar = fenceMatch[1][0];
          let fLen = fenceMatch[1].length;
          if (fChar === codeBlockFenceChar && fLen >= codeBlockFenceLen) {
            insideCodeBlock = false;
          }
        }
      }
    }

    if (root.children.length === 0) return null;

    function cleanLines(arr) {
      let res = [...arr];
      while (res.length > 0 && res[0].trim() === "") res.shift();
      while (res.length > 0 && res[res.length - 1].trim() === "") res.pop();
      return res;
    }

    function hasChildWithChildren(nodes) {
      return nodes.some(n => n.children && n.children.length > 0);
    }

    function renderNodes(nodes, depth) {
      let result = [];
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        let headerLine = (split || "tema:") + node.title;
        result.push(headerLine);

        let own = cleanLines(node.ownContent);
        if (own.length > 0) {
          result.push(own.join("\n"));
        }

        if (node.children && node.children.length > 0) {
          let childFenceStr = (depth === 0) ? "~~~" : "```";
          result.push("");
          result.push(childFenceStr + (kw || "tabs"));
          let childContent = renderNodes(node.children, depth + 1);
          result.push(childContent);
          result.push(childFenceStr);
          result.push("");
        } else {
          if (i < nodes.length - 1) {
            result.push("");
          }
        }
      }
      return result.join("\n");
    }

    let requiredFenceLen = hasChildWithChildren(root.children) ? 4 : 3;
    let finalFenceLen = Math.max(minFenceLen || 3, requiredFenceLen, maxRun + 1);
    let outerFence = "`".repeat(finalFenceLen);
    let body = renderNodes(root.children, 0);

    let preContent = cleanLines(root.ownContent);
    let preStr = preContent.length > 0 ? preContent.join("\n") + "\n\n" : "";

    return preStr + outerFence + (kw || "tabs") + "\n" + body + "\n" + outerFence;
  }

  refreshOpenViews() {
    try {
      return (
        this.app.workspace
          .getLeavesOfType("markdown")
          .forEach((t) => t.rebuildView()),
        !0
      );
    } catch (t) {
      return (console.error(t), !1);
    }
  }

  refreshActiveView() {
    try {
      let t = this.app.workspace.getActiveViewOfType(MarkdownView);
      return (t && t.leaf && t.leaf.rebuildView(), !0);
    } catch (t) {
      return (console.error(t), !1);
    }
  }
}
