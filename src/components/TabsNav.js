import { setIcon, Notice, MarkdownView } from 'obsidian';
import { TabItem } from './TabItem.js';
import { TabContextMenu } from './TabContextMenu.js';
import { $ } from '../i18n/index.js';

export class TabsButton {
    constructor(t, e, i) {
      this.tabnav = t;
      this.sectioninfo = i;
      this.buttonEl = this.createTabNavButtonEl(e);
      if (this.buttonEl) {
        this.buttonEl.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        });
        this.buttonEl.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const tabs = this.tabnav && this.tabnav.tabs;
          if (!tabs) return;
          tabs.activeView = (tabs.app && tabs.app.workspace && tabs.app.workspace.getActiveViewOfType(MarkdownView)) || (typeof tabs.getWritableView === "function" ? tabs.getWritableView() : null) || tabs.activeView;
          if (e === "action-edit") {
            if (tabs.plugin && tabs.plugin.tabsEditorModal) {
              tabs.plugin.tabsEditorModal.startEditing(tabs);
            }
          } else if (e === "action-add") {
            let title = tabs.isVertical
              ? (tabs.plugin.settings.defaultTabNavItemVertical || "New vertical tab")
              : (tabs.plugin.settings.defaultTabNavItem || "New tab");
            let content = tabs.plugin.settings.defaultTabContent || "New tab content";
            TabContextMenu.updateBlockWithNewTab(tabs, title, content);
          }
        });
      }
    }
    createTabNavButtonEl(t) {
      if (t === "action-none") return null;
      let e = document.createElement("div");
      e.className = "tabs-nav-button";
      if (t === "action-add") {
        (0, setIcon)(e, "plus");
        const addLabel = $("menu.addNewTab") || "Add new tab";
        e.setAttribute("aria-label", addLabel);
        e.setAttribute("title", addLabel);
      } else if (t === "action-edit") {
        (0, setIcon)(e, "pencil");
        if (!e.firstElementChild) (0, setIcon)(e, "lucide-pencil");
        const editLabel = $("editBlockButton") || $("menu.renameTab") || "Edit tabs";
        e.setAttribute("aria-label", editLabel);
        e.setAttribute("title", editLabel);
      }
      return e;
    }
  };

export class TabsNav {
  constructor(t, e, i, n) {
    this.currentTab = 0;
    this.titleRefreshFrame = null;
    this.overflowCheckFrame = null;
    this.overflowResizeObserver = null;
    this.lastBlinkingItem = null;
    this.overflowArrowEl = null;

    ((this.tabs = t),
      (this.navItems = new Array()),
      e.length > 0 &&
        ((this.navItems = new Array(e.length)),
        (this.tabsButton = new TabsButton(this, i, n)),
        this.createTabNavEl(e),
        (this.currentTab = 0)));
    this.tabs.register(() => {
      if (this.titleRefreshFrame != null) {
        window.cancelAnimationFrame(this.titleRefreshFrame);
        this.titleRefreshFrame = null;
      }
      if (this.overflowCheckFrame != null) {
        window.cancelAnimationFrame(this.overflowCheckFrame);
        this.overflowCheckFrame = null;
      }
      if (this.overflowResizeObserver) {
        this.overflowResizeObserver.disconnect();
        this.overflowResizeObserver = null;
      }
      this.clearOverflowIndicators();
    });
  }
  createTabNavEl(t) {
    for (let e = 0; e < t.length; e++) this.navItems[e] = new TabItem(this, e, t[e]);
    if (this.navItems.length > 0) {
      this.navItems[0].isActiveed = !0;
      this.navItems[0].tabitemEl.classList.add("tabs-nav-item-active");
    }
    this.navEl = document.createElement("div");
    this.navEl.classList.add("tabs-nav");
    this.navWrapperEl = this.navEl.createDiv("tabs-nav-item-wrapper");
    if (this.navItems.length > 0) {
      this.navItems.forEach((e) => {
        this.navWrapperEl.appendChild(e.tabitemEl);
      });
    }

    // Ghost overflow arrow (discreet right arrow indicator)
    this.overflowArrowEl = document.createElement("div");
    this.overflowArrowEl.className = "tabs-nav-overflow-arrow-right";
    this.overflowArrowEl.setAttribute("aria-hidden", "true");
    const nextLabel = $("menu.nextTab") || "More tabs to the right";
    this.overflowArrowEl.setAttribute("aria-label", nextLabel);
    this.overflowArrowEl.setAttribute("title", nextLabel);
    this.overflowArrowEl.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    this.overflowArrowEl.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (this.navWrapperEl && typeof this.navWrapperEl.scrollBy === "function") {
        this.navWrapperEl.scrollBy({ left: 140, behavior: "smooth" });
      }
    });
    this.navEl.appendChild(this.overflowArrowEl);

    if (this.tabsButton && this.tabsButton.buttonEl) {
      this.navEl.appendChild(this.tabsButton.buttonEl);
    }

    this.setupOverflowIndicator();
  }
  setupOverflowIndicator() {
    if (!this.navWrapperEl) return;

    this.navWrapperEl.addEventListener("scroll", () => {
      this.scheduleOverflowCheck();
    }, { passive: true });

    if (typeof window !== "undefined" && typeof window.ResizeObserver !== "undefined") {
      try {
        this.overflowResizeObserver = new ResizeObserver(() => {
          this.scheduleOverflowCheck();
        });
        this.overflowResizeObserver.observe(this.navWrapperEl);
        if (this.navEl) this.overflowResizeObserver.observe(this.navEl);
      } catch (err) {}
    }

    this.scheduleOverflowCheck();
    if (typeof window !== "undefined") {
      window.setTimeout(() => this.scheduleOverflowCheck(), 50);
    }
  }
  scheduleOverflowCheck() {
    if (this.overflowCheckFrame != null) {
      window.cancelAnimationFrame(this.overflowCheckFrame);
    }
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      this.overflowCheckFrame = window.requestAnimationFrame(() => {
        this.overflowCheckFrame = null;
        this.checkOverflowState();
      });
    } else {
      this.checkOverflowState();
    }
  }
  checkOverflowState() {
    const isHorizontal = this.tabs && !this.tabs.isVertical &&
      (!this.tabs.tabsConfig || (this.tabs.tabsConfig.titlePosition !== "left" && this.tabs.tabsConfig.titlePosition !== "right"));
    const isEnabled = this.tabs?.plugin?.settings?.horizontalTabsOverflowIndicator !== false;

    if (!isHorizontal || !isEnabled || !this.navWrapperEl) {
      this.clearOverflowIndicators();
      return;
    }

    const wrapper = this.navWrapperEl;
    const scrollWidth = wrapper.scrollWidth || 0;
    const clientWidth = wrapper.clientWidth || 0;
    const scrollLeft = wrapper.scrollLeft || 0;

    // Overflow exists to the right when scrollWidth > clientWidth + scrollLeft + 2px tolerance
    const hasOverflowRight = (scrollWidth - (scrollLeft + clientWidth)) > 2;

    if (!hasOverflowRight) {
      this.clearOverflowIndicators();
      return;
    }

    if (this.overflowArrowEl && this.overflowArrowEl.classList) {
      this.overflowArrowEl.classList.add("is-visible");
    }

    // Find the last visible tab item in navItems
    let lastVisibleEl = null;
    const wrapperRect = typeof wrapper.getBoundingClientRect === "function"
      ? wrapper.getBoundingClientRect()
      : null;
    const visibleRight = scrollLeft + clientWidth;

    if (Array.isArray(this.navItems)) {
      for (let i = 0; i < this.navItems.length; i++) {
        const item = this.navItems[i];
        if (!item || !item.tabitemEl) continue;
        const el = item.tabitemEl;

        if (wrapperRect && wrapperRect.width > 0 && typeof el.getBoundingClientRect === "function") {
          const rect = el.getBoundingClientRect();
          // Tab starts before wrapper right boundary and has at least 8px showing
          if (rect.left < wrapperRect.right - 8 && rect.right > wrapperRect.left + 5) {
            lastVisibleEl = el;
          }
        } else {
          // Fallback via offsetLeft
          const left = el.offsetLeft || 0;
          if (left < visibleRight - 8) {
            lastVisibleEl = el;
          }
        }
      }
    }

    if (this.lastBlinkingItem !== lastVisibleEl) {
      if (this.lastBlinkingItem && this.lastBlinkingItem.classList) {
        this.lastBlinkingItem.classList.remove("tabs-separator-overflow-blink");
      }
      this.lastBlinkingItem = lastVisibleEl;
      if (lastVisibleEl && lastVisibleEl.classList) {
        lastVisibleEl.classList.add("tabs-separator-overflow-blink");
      }
    } else if (lastVisibleEl && lastVisibleEl.classList && !lastVisibleEl.classList.contains("tabs-separator-overflow-blink")) {
      lastVisibleEl.classList.add("tabs-separator-overflow-blink");
    }
  }
  clearOverflowIndicators() {
    if (this.overflowArrowEl && this.overflowArrowEl.classList) {
      this.overflowArrowEl.classList.remove("is-visible");
    }
    if (this.lastBlinkingItem && this.lastBlinkingItem.classList) {
      this.lastBlinkingItem.classList.remove("tabs-separator-overflow-blink");
      this.lastBlinkingItem = null;
    }
    if (Array.isArray(this.navItems)) {
      this.navItems.forEach((item) => {
        if (item && item.tabitemEl && item.tabitemEl.classList && item.tabitemEl.classList.contains("tabs-separator-overflow-blink")) {
          item.tabitemEl.classList.remove("tabs-separator-overflow-blink");
        }
      });
    }
  }
  refreshActiveTabNav(t) {
    if (!Array.isArray(this.navItems) || this.navItems.length === 0) return;
    const targetIndex = Math.max(0, Math.min(this.navItems.length - 1, t));
    for (let i = 0; i < this.navItems.length; i++) {
      const item = this.navItems[i];
      if (!item || !item.tabitemEl) continue;
      const isActive = i === targetIndex;
      item.isActiveed = isActive;
      if (isActive) {
        item.tabitemEl.classList.add("tabs-nav-item-active");
      } else {
        item.tabitemEl.classList.remove("tabs-nav-item-active");
      }
    }
    this.currentTab = targetIndex;

    this.scheduleOverflowCheck();

    if (this.titleRefreshFrame != null) {
      window.cancelAnimationFrame(this.titleRefreshFrame);
    }
    this.titleRefreshFrame = window.requestAnimationFrame(() => {
      this.titleRefreshFrame = null;
      if (this.navItems && Array.isArray(this.navItems)) {
        this.navItems.forEach((item) => {
          if (item && typeof item.applyTitleBehavior === 'function') {
            item.applyTitleBehavior();
          }
        });
      }
    });
  }
  registerDragEvents() {
    this.navItems.forEach((t) => {
      t.registerdndEvents();
    });
  }
};
