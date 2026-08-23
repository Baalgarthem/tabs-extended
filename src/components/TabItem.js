import { MarkdownRenderer, MarkdownRenderChild, Notice } from 'obsidian';
import { cleanVirtualLinksFromElement } from '../core/model.js';
import { tabsExtendedAnalyzeTabSections } from '../core/parser.js';
import { TabContextMenu } from './TabContextMenu.js';
import { RenameTabModal } from '../modals/RenameTabModal.js';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal.js';
import { $ } from '../i18n/index.js';

export class TabItem {
  constructor(t, e, i, n = !0) {
    this.isActiveed = !1;
    this.isDisposed = false;
    this.titleBehaviorFrame = null;
    this.virtualLinkObserver = null;
    ((this.index = e),
      (this.title = i.trim()),
      (this.tabnav = t),
      (this.tabs = t.tabs),
      (this.tabitemEl = createDiv()),
      (this.tabitemEl.className = "tabs-nav-item"),
      n && this.tabitemEl.setAttr("draggable", "true"),
      (this.tabitemMDEl = this.tabitemEl.createDiv()),
      (this.tabitemMDEl.className = "tabs-nav-item-md no-virtual-link virtual-linker-ignore"));
    this.tabs.register(() => {
      this.isDisposed = true;
      if (this.virtualLinkObserver) {
        this.virtualLinkObserver.disconnect();
        this.virtualLinkObserver = null;
      }
      if (this.titleBehaviorFrame != null) {
        window.cancelAnimationFrame(this.titleBehaviorFrame);
        this.titleBehaviorFrame = null;
      }
    });
    let r = new MarkdownRenderChild(this.tabitemMDEl);
    MarkdownRenderer.render(
      this.tabs.app,
      this.title,
      this.tabitemMDEl,
      (this.tabs && this.tabs.context && this.tabs.context.sourcePath) || "",
      r,
    ).then(() => {
      if (this.isDisposed) return;
      cleanVirtualLinksFromElement(this.tabitemMDEl);
      this.scheduleTitleBehavior();
    }).catch((error) => {
      console.error("Tabs Extended could not render a tab title:", error);
    });
    if (this.tabs && this.tabs.context && typeof this.tabs.context.addChild === 'function') {
      try {
        this.tabs.context.addChild(r);
      } catch (err) {}
    }
    this.setupVirtualLinkExemption();
    this.setupTitleHoverScroll();
  }
  scheduleTitleBehavior() {
    if (this.isDisposed) return;
    if (this.titleBehaviorFrame != null) {
      window.cancelAnimationFrame(this.titleBehaviorFrame);
    }
    this.titleBehaviorFrame = window.requestAnimationFrame(() => {
      this.titleBehaviorFrame = null;
      if (this.isDisposed) return;
      this.applyTitleBehavior();
    });
  }
  applyTitleBehavior() {
    if (!this.tabitemEl || !this.tabitemMDEl) return;
    let container = this.tabs ? this.tabs.tabsEl : null;
    if (!container) return;

    let mdEl = this.tabitemMDEl;
    let isHoverScroll = container.classList.contains("tabs-nav-v-behavior-hover-scroll") || container.classList.contains("tabs-nav-v-hover-scroll");
    let isAutoScroll = container.classList.contains("tabs-nav-v-behavior-auto-scroll");
    let isShrink = container.classList.contains("tabs-nav-v-behavior-shrink");
    let isMultiLine = container.classList.contains("tabs-nav-v-behavior-multi-line");

    if (isShrink) {
      mdEl.classList.remove("is-scrolling-title");
      mdEl.style.removeProperty("--title-scroll-offset");
      mdEl.style.removeProperty("--title-scroll-duration");
      
      const itemWidth = this.tabitemEl.clientWidth;
      const overflow = mdEl.scrollWidth - itemWidth;
      if (overflow > 2 && itemWidth > 0 && mdEl.scrollWidth > 0) {
        const scale = Math.max(0.6, (itemWidth - 8) / mdEl.scrollWidth);
        mdEl.style.transform = `scale(${scale})`;
        mdEl.style.transformOrigin = "left center";
      } else {
        mdEl.style.transform = "none";
      }
    } else if (isAutoScroll) {
      mdEl.style.transform = "none";
      const availWidth = Math.min(mdEl.clientWidth || 9999, (this.tabitemEl.clientWidth || 8) - 4);
      const overflow = Math.max(mdEl.scrollWidth - mdEl.clientWidth, mdEl.scrollWidth - availWidth);
      if (overflow > 1) {
        mdEl.style.setProperty("--title-scroll-offset", `-${overflow + 14}px`);
        const duration = Math.max(2.5, Math.min(8, overflow / 20));
        mdEl.style.setProperty("--title-scroll-duration", `${duration}s`);
        mdEl.classList.add("is-scrolling-title");
        mdEl.style.animationPlayState = "running";
      } else {
        mdEl.classList.remove("is-scrolling-title");
      }
    } else if (isHoverScroll) {
      mdEl.style.transform = "none";
      const availWidth = Math.min(mdEl.clientWidth || 9999, (this.tabitemEl.clientWidth || 8) - 4);
      const overflow = Math.max(mdEl.scrollWidth - mdEl.clientWidth, mdEl.scrollWidth - availWidth);
      let isActive = this.isActiveed || this.tabitemEl.classList.contains("tabs-nav-item-active");
      if (overflow > 1 && isActive) {
        mdEl.style.setProperty("--title-scroll-offset", `-${overflow + 14}px`);
        const duration = Math.max(2.5, Math.min(8, overflow / 20));
        mdEl.style.setProperty("--title-scroll-duration", `${duration}s`);
        mdEl.classList.add("is-scrolling-title");
        mdEl.style.animationPlayState = "running";
      } else if (!isActive) {
        mdEl.classList.remove("is-scrolling-title");
      }
    } else if (isMultiLine) {
      mdEl.style.transform = "none";
      mdEl.classList.remove("is-scrolling-title");
      mdEl.style.removeProperty("--title-scroll-offset");
      mdEl.style.removeProperty("--title-scroll-duration");

      mdEl.style.whiteSpace = "nowrap";
      let childNodes = mdEl.querySelectorAll("*");
      childNodes.forEach((el) => (el.style.whiteSpace = "nowrap"));

      const singleLineWidth = mdEl.scrollWidth;

      let availWidth = this.tabitemEl ? this.tabitemEl.clientWidth : 0;
      if (!availWidth || availWidth < 20) {
        let tabNav = this.tabs && this.tabs.tabsEl ? this.tabs.tabsEl.querySelector(".tabs-nav") : null;
        availWidth = tabNav ? tabNav.clientWidth : 0;
      }
      if (!availWidth || availWidth < 20) {
        const containerWidth = container.clientWidth || 800;
        availWidth = Math.floor(containerWidth * 0.2);
      }

      const maxAllowedWidth = Math.max(30, availWidth - 8);

      if (singleLineWidth > maxAllowedWidth) {
        mdEl.style.whiteSpace = "normal";
        mdEl.style.wordBreak = "break-word";
        mdEl.style.overflowWrap = "anywhere";
        childNodes.forEach((el) => {
          el.style.whiteSpace = "normal";
          el.style.wordBreak = "break-word";
          el.style.overflowWrap = "anywhere";
        });
      } else {
        mdEl.style.whiteSpace = "nowrap";
        mdEl.style.wordBreak = "normal";
        mdEl.style.overflowWrap = "normal";
        childNodes.forEach((el) => {
          el.style.whiteSpace = "nowrap";
          el.style.wordBreak = "normal";
          el.style.overflowWrap = "normal";
        });
      }
    } else {
      mdEl.style.transform = "none";
    }
  }
  setupTitleHoverScroll() {
    if (!this.tabitemEl || !this.tabitemMDEl) return;
    this.tabs.registerDomEvent(this.tabitemEl, "mouseenter", () => {
      let container = this.tabs ? this.tabs.tabsEl : null;
      if (!container) return;
      let isHoverScroll = container.classList.contains("tabs-nav-v-behavior-hover-scroll") || container.classList.contains("tabs-nav-v-hover-scroll");
      if (!isHoverScroll) return;

      const mdEl = this.tabitemMDEl;
      if (!mdEl) return;
      const availWidth = Math.min(mdEl.clientWidth || 9999, (this.tabitemEl.clientWidth || 8) - 4);
      const overflow = Math.max(mdEl.scrollWidth - mdEl.clientWidth, mdEl.scrollWidth - availWidth);
      if (overflow > 1) {
        mdEl.style.setProperty("--title-scroll-offset", `-${overflow + 14}px`);
        const duration = Math.max(2.5, Math.min(8, overflow / 20));
        mdEl.style.setProperty("--title-scroll-duration", `${duration}s`);
        mdEl.classList.add("is-scrolling-title");
        mdEl.style.animationPlayState = "running";
      }
    });
    this.tabs.registerDomEvent(this.tabitemEl, "mouseleave", () => {
      let container = this.tabs ? this.tabs.tabsEl : null;
      if (!container) return;
      let isAutoScroll = container.classList.contains("tabs-nav-v-behavior-auto-scroll");
      if (isAutoScroll) {
        this.applyTitleBehavior();
        return;
      }
      let isHoverScroll = container.classList.contains("tabs-nav-v-behavior-hover-scroll") || container.classList.contains("tabs-nav-v-hover-scroll");
      if (isHoverScroll && this.tabitemMDEl) {
        let isActive = this.isActiveed || this.tabitemEl.classList.contains("tabs-nav-item-active");
        if (!isActive) {
          this.tabitemMDEl.classList.remove("is-scrolling-title");
          this.tabitemMDEl.style.removeProperty("--title-scroll-offset");
          this.tabitemMDEl.style.removeProperty("--title-scroll-duration");
        }
      }
    });
  }
  setupVirtualLinkExemption() {
    if (!this.tabitemMDEl) return;
    try {
      const observer = new MutationObserver((mutations) => {
        let needsClean = false;
        for (const m of mutations) {
          for (const added of m.addedNodes) {
            if (added.nodeType === 1) {
              const el = added;
              if (
                el.classList.contains("virtual-link") ||
                el.classList.contains("virtual-link-a") ||
                el.classList.contains("virtual-link-span") ||
                el.classList.contains("glossary-entry") ||
                el.querySelector(".virtual-link, .virtual-link-a, .glossary-entry")
              ) {
                needsClean = true;
                break;
              }
            }
          }
          if (needsClean) break;
        }
        if (needsClean) {
          cleanVirtualLinksFromElement(this.tabitemMDEl);
        }
      });
      observer.observe(this.tabitemMDEl, { childList: true, subtree: true });
      this.virtualLinkObserver = observer;
    } catch (error) {
      console.warn("Tabs Extended could not observe a rendered tab title:", error);
    }
  }
  clearDragState() {
    if (!this.tabs || !this.tabs.tabsNav) return;
    this.tabs.tabsNav.navItems.forEach((item) => {
      item.tabitemEl.classList.remove("tabs-nav-item-dragover");
      item.tabitemEl.classList.remove("tabs-nav-item-dragover-before");
      item.tabitemEl.classList.remove("tabs-nav-item-dragover-after");
      item.tabitemEl.style.opacity = "";
      item.tabitemEl.setAttr("aria-grabbed", "false");
    });
  }
  acceptsCurrentDrag() {
    const dragger = this.tabs.plugin.tabDragger;
    return !!(
      dragger &&
      dragger.draggedTab &&
      dragger.fromTabs === this.tabs &&
      dragger.draggedTab !== this
    );
  }
  updateDropIndicator(event) {
    const rect = this.tabitemEl.getBoundingClientRect();
    const horizontal =
      this.tabs.tabsConfig.titlePosition === "top" ||
      this.tabs.tabsConfig.titlePosition === "bottom";
    const after = horizontal
      ? event.clientX - rect.left >= rect.width / 2
      : event.clientY - rect.top >= rect.height / 2;
    this.tabitemEl.classList.add("tabs-nav-item-dragover");
    this.tabitemEl.classList.toggle(
      "tabs-nav-item-dragover-before",
      !after,
    );
    this.tabitemEl.classList.toggle(
      "tabs-nav-item-dragover-after",
      after,
    );
    return after;
  }
  registerdndEvents() {
    this.tabs.registerDomEvent(this.tabitemEl, "dragstart", (event) => {
      const draggedIndex = this.tabs.tabsNav.navItems.indexOf(this);
      if (
        draggedIndex < 0 ||
        this.tabs.tabsNav.navItems.length < 2 ||
        !this.tabs.canPersistTabOrder()
      ) {
        event.preventDefault();
        return;
      }
      const analyzed = tabsExtendedAnalyzeTabSections(
        this.tabs.rawText,
        this.tabs.split,
        this.tabs.plugin.settings,
      );
      const section = analyzed && analyzed.sections[draggedIndex];
      const transferText = section
        ? this.tabs.rawText.slice(section.from, section.to)
        : this.title + "\n" + this.tabs.tabsContents.tabcontents[draggedIndex].content;
      if (event.dataTransfer) {
        event.dataTransfer.setData("text/plain", transferText);
        event.dataTransfer.effectAllowed = "move";
      }
      this.tabs.plugin.tabDragger = {
        fromTabs: this.tabs,
        draggedTab: this,
        draggedIndex,
      };
      this.tabitemEl.style.opacity = "0.55";
      this.tabitemEl.setAttr("aria-grabbed", "true");
    });

    this.tabs.registerDomEvent(this.tabitemEl, "dragenter", (event) => {
      const internalDrag = this.tabs.plugin.tabDragger;
      if (!this.acceptsCurrentDrag()) {
        if (internalDrag) {
          event.preventDefault();
          event.stopPropagation();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.updateDropIndicator(event);
    });

    this.tabs.registerDomEvent(this.tabitemEl, "dragover", (event) => {
      const internalDrag = this.tabs.plugin.tabDragger;
      if (!this.acceptsCurrentDrag()) {
        if (internalDrag) {
          event.preventDefault();
          event.stopPropagation();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      this.updateDropIndicator(event);
    });

    this.tabs.registerDomEvent(this.tabitemEl, "dragleave", () => {
      this.tabitemEl.classList.remove("tabs-nav-item-dragover");
      this.tabitemEl.classList.remove("tabs-nav-item-dragover-before");
      this.tabitemEl.classList.remove("tabs-nav-item-dragover-after");
    });

    this.tabs.registerDomEvent(this.tabitemEl, "drop", (event) => {
      const internalDrag = this.tabs.plugin.tabDragger;
      if (!this.acceptsCurrentDrag()) {
        if (internalDrag) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const dragger = this.tabs.plugin.tabDragger;
      try {
        const draggedIndex = this.tabs.tabsNav.navItems.indexOf(
          dragger.draggedTab,
        );
        const targetIndex = this.tabs.tabsNav.navItems.indexOf(this);
        const insertAfter = this.updateDropIndicator(event);
        let insertionIndex = targetIndex + (insertAfter ? 1 : 0);
        if (insertionIndex > draggedIndex) insertionIndex -= 1;
        const finalIndex = Math.max(
          0,
          Math.min(this.tabs.tabsNav.navItems.length - 1, insertionIndex),
        );
        if (draggedIndex !== finalIndex) {
          const moved = this.tabs.reorderTab(draggedIndex, finalIndex);
          if (!moved) {
            console.warn(
              "Tabs Extended cancelled an unsafe tab reorder operation.",
            );
          }
        }
      } catch (error) {
        console.error("Error during drag and drop operation:", error);
      } finally {
        this.clearDragState();
        this.tabs.plugin.tabDragger = null;
      }
    });

    this.tabs.registerDomEvent(this.tabitemEl, "dragend", () => {
      this.clearDragState();
      const dragger = this.tabs.plugin.tabDragger;
      if (dragger && dragger.fromTabs === this.tabs) {
        this.tabs.plugin.tabDragger = null;
      }
    });
  }
};
