import { Modal, Notice } from 'obsidian';
import { TabsModalEditorEngine } from './engine.js';
import { $ } from '../i18n/index.js';

export class TabsEditorModal extends Modal {
  constructor(t, e) {
    super(e);
    ((this.app = e),
      (this.plugin = t),
      this.modalEl.addClass("tabs-editor-modal"));
  }
  startEditing(t, targetBlockInfo = null) {
    try {
      this.contentEl.empty();
      this.tabs = t;
      if (targetBlockInfo && typeof targetBlockInfo.tabIndex === "number") {
        t.currentIndex = targetBlockInfo.tabIndex;
      }
      const maxIndex = (t.tabsNav && Array.isArray(t.tabsNav.navItems) && t.tabsNav.navItems.length > 0)
        ? t.tabsNav.navItems.length - 1
        : ((t.tabsContents && Array.isArray(t.tabsContents.tabcontents) && t.tabsContents.tabcontents.length > 0)
          ? t.tabsContents.tabcontents.length - 1
          : 0);
      if (typeof t.currentIndex !== "number" || t.currentIndex < 0 || t.currentIndex > maxIndex) {
        t.currentIndex = 0;
      }

      let titleStr = "";
      if (t.tabsNav && t.tabsNav.navItems && t.tabsNav.navItems[t.currentIndex]) {
          titleStr = t.tabsNav.navItems[t.currentIndex].title;
      }
      let contentStr = "";
      if (t.tabsContents && t.tabsContents.tabcontents && t.tabsContents.tabcontents[t.currentIndex]) {
          contentStr = t.tabsContents.tabcontents[t.currentIndex].content.replace(/[\r\n]+$/, "");
      }
      const sourceSection =
        typeof t.getTabSourceSection === "function"
          ? t.getTabSourceSection(t.currentIndex)
          : null;
      let e = sourceSection != null
        ? sourceSection
        : ((titleStr || contentStr) ? ((t.split || "") + titleStr + "\n" + contentStr) : (t.rawText || ""));
      this.initialEditorText = e;
      
      let s = this.plugin.settings;
      if (s.nestedTabsHighlight && this.modalEl) {
          this.modalEl.style.setProperty("--nested-tab-delimiter-text-start", '"' + (s.nestedTabsDelimiterTextStart || "") + '"');
          this.modalEl.style.setProperty("--nested-tab-delimiter-text-end", '"' + (s.nestedTabsDelimiterTextEnd || "") + '"');
          this.modalEl.style.setProperty("--nested-tab-delimiter-color-light", s.nestedTabsDelimiterColorLight || "transparent");
          this.modalEl.style.setProperty("--nested-tab-item-color-light", s.nestedTabsItemColorLight || "transparent");
          this.modalEl.style.setProperty("--nested-tab-delimiter-color-dark", s.nestedTabsDifferentDarkColor ? s.nestedTabsDelimiterColorDark : s.nestedTabsDelimiterColorLight);
          this.modalEl.style.setProperty("--nested-tab-item-color-dark", s.nestedTabsDifferentDarkColor ? s.nestedTabsItemColorDark : s.nestedTabsItemColorLight);
          
          this.modalEl.style.setProperty("--nested-tab-item-font-weight", "bold");
          this.modalEl.style.setProperty("--nested-tab-item-underline-thickness", (s.nestedTabsItemUnderlineThickness || 2) + "px");
          this.modalEl.style.setProperty("--nested-tab-item-underline-offset", (s.nestedTabsItemUnderlineOffset || 2) + "px");
          this.modalEl.style.setProperty("--nested-tab-item-underline-style", s.nestedTabsItemUnderlineStyle || "solid");
          this.modalEl.style.setProperty("--nested-tab-item-underline-opacity", (s.nestedTabsItemUnderlineOpacity || 100) + "%");
          this.modalEl.style.setProperty("--nested-tab-separator-font-size", (s.tabsSeparatorFontSize || 14) + "px");
          this.modalEl.style.setProperty("--nested-tab-separator-bg-opacity", (s.tabsSeparatorBgOpacity || 30) + "%");
          
          this.modalEl.style.setProperty("--nested-tab-color-level-0", s.nestedTabsColorLevel0 || "#4a90e2");
          this.modalEl.style.setProperty("--nested-tab-color-level-1", s.nestedTabsColorLevel1 || "#50e3c2");
          this.modalEl.style.setProperty("--nested-tab-color-level-2", s.nestedTabsColorLevel2 || "#f5a623");
          this.modalEl.style.setProperty("--nested-tab-color-level-3", s.nestedTabsColorLevel3 || "#b8e986");
          this.modalEl.style.setProperty("--nested-tab-color-level-4", s.nestedTabsColorLevel4 || "#bd10e0");
          this.modalEl.style.setProperty("--nested-tab-color-level-5plus", s.nestedTabsColorLevel5Plus || "#888888");
          
          this.modalEl.classList.add("nested-tabs-style-text");
          if (!this.styleObserver && typeof MutationObserver !== "undefined") {
              this.styleObserver = new MutationObserver(() => {
                  if (this.modalEl && !this.modalEl.classList.contains("nested-tabs-style-text")) {
                      this.modalEl.classList.add("nested-tabs-style-text");
                  }
              });
              this.styleObserver.observe(this.modalEl, { attributes: true, attributeFilter: ["class"] });
          }
      }
      
      this.editor = new TabsModalEditorEngine(this.plugin, this.contentEl, e, targetBlockInfo);
      this.open();
    } catch (err) {
      console.error("Error in startEditing:", err);
      // fallback if Notice doesn't exist
      try { new Notice("Error opening modal editor: " + err.message); } catch(e){}
    }
  }
  onOpen() {
    // Polling removed in favor of debounceSave
  }
  debounceSave() {
    if (this.plugin.settings.editorAutoSaveInterval === 0) return;
    if (this.saveTimeout) activeWindow.clearTimeout(this.saveTimeout);
    this.saveTimeout = activeWindow.setTimeout(() => {
      this.saveEditorData();
    }, this.plugin.settings.editorAutoSaveInterval);
  }
  onClose() {
    if (this.styleObserver) {
      this.styleObserver.disconnect();
      this.styleObserver = null;
    }
    if (this.saveTimeout) activeWindow.clearTimeout(this.saveTimeout);
    this.saveTimeout = null;
    if (this.editor && (this.editor.docChange || (this.editor.view && this.editor.view.state.doc.toString() !== this.initialEditorText))) {
      this.saveEditorData();
    }
    if (this.editor && this.editor.view) {
      if (window.tabsExtActiveViews) {
        let idx = window.tabsExtActiveViews.indexOf(this.editor.view);
        if (idx >= 0) window.tabsExtActiveViews.splice(idx, 1);
      }
      this.editor.view.destroy();
    }
    this.editor = null;
    this.tabs = null;
    this.initialEditorText = null;
    if (this.contentEl && typeof this.contentEl.empty === "function") {
      this.contentEl.empty();
    }
  }
  saveEditorData() {
    if (!this.editor || !this.editor.view || !this.tabs) return false;
    const editorText = this.editor.view.state.doc.toString();
    if (editorText === this.initialEditorText && !this.editor.docChange) {
      this.editor.docChange = false;
      return true;
    }
    if (typeof this.tabs.replaceTabSourceSection !== "function") return false;

    const saved = this.tabs.replaceTabSourceSection(
      this.tabs.currentIndex,
      editorText,
    );
    if (saved) {
      this.initialEditorText = editorText;
      this.editor.docChange = false;
    } else {
      console.warn(
        "Tabs Extended cancelled an unsafe modal save; the source was not modified.",
      );
    }
    return saved;
  }
}
