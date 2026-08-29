import { setIcon, Notice } from 'obsidian';
import { TabItem } from './TabItem.js';
import { $ } from '../i18n/index.js';

export class TabsButton {
    constructor(t, e, i) {
      ((this.tabnav = t),
        (this.sectioninfo = i),
        (this.buttonEl = this.createTabNavButtonEl(e)));
    }
    createTabNavButtonEl(t) {
      if (t === "action-none") return null;
      let e = document.createElement("div");
      return (
        (e.className = "tabs-nav-button"),
        t === "action-add"
          ? (0, setIcon)(e, "plus")
          : t === "action-edit" && ((0, setIcon)(e, "pencil"), e.firstElementChild || (0, setIcon)(e, "lucide-pencil")),
        e
      );
    }
  };

export class TabsNav {
  constructor(t, e, i, n) {
    this.currentTab = 0;
    this.titleRefreshFrame = null;
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
    if (this.tabsButton && this.tabsButton.buttonEl) {
      this.navEl.appendChild(this.tabsButton.buttonEl);
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
