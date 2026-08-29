import { Menu, Notice } from 'obsidian';
import { RenameTabModal } from '../modals/RenameTabModal.js';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal.js';
import { $ } from '../i18n/index.js';

export class TabContextMenu extends Menu {
  constructor(t, e) {
    super();
    const contextTabIndex = TabContextMenu.findTabIndex(t, e.target);
    this.addItem((i) => {
      i.setTitle($("menu.addNewTab"));
      i.setIcon("plus");
      i.onClick(() => {
        let newTitle = t.isVertical
          ? (t.plugin.settings.defaultTabNavItemVertical || "New vertical tab")
          : (t.plugin.settings.defaultTabNavItem || "New tab");
        let newContent = t.plugin.settings.defaultTabContent || "New tab content";
        TabContextMenu.updateBlockWithNewTab(t, newTitle, newContent);
      });
    });
    this.addItem((i) => {
      i.setTitle($("menu.renameTab"));
      i.setIcon("pencil");
      i.setDisabled(contextTabIndex < 0 && (!t.tabsNav || !t.tabsNav.navItems || t.tabsNav.navItems.length === 0));
      i.onClick(() => {
        const targetIndex = contextTabIndex >= 0
          ? contextTabIndex
          : (typeof t.currentIndex === "number" && t.currentIndex >= 0 ? t.currentIndex : 0);
        const navItem = t.tabsNav && Array.isArray(t.tabsNav.navItems)
          ? t.tabsNav.navItems[targetIndex]
          : null;
        if (!navItem) {
          if (!t.plugin.settings.ignoreNotice) {
            new Notice($("notice.invalidTab"));
          }
          return;
        }

        const snapshot = typeof t.getTabRenameSnapshot === "function"
          ? t.getTabRenameSnapshot(targetIndex)
          : null;
        const currentTitle = (snapshot && snapshot.title) || navItem.title || "";

        new RenameTabModal(t.app, currentTitle, (newTitle) => {
          if (
            typeof t.hasConflictingTabsEditorModal === "function" &&
            t.hasConflictingTabsEditorModal()
          ) {
            new Notice($("modal.renameTab.editorOpen"));
            return false;
          }
          const renamed = typeof t.renameTabAt === "function" &&
            t.renameTabAt(targetIndex, newTitle);
          if (renamed && !t.plugin.settings.ignoreNotice) {
            new Notice($("notice.renameTabSuccess"));
          }
          return !!renamed;
        }).open();
      });
    });
    this.addItem((i) => {
      i.setTitle($("menu.deleteTab"));
      i.setIcon("trash");
      i.setDisabled(
        contextTabIndex < 0 || t.tabsNav.navItems.length <= 1,
      );
      i.onClick(() => {
        if (contextTabIndex === -1) {
          if (!t.plugin.settings.ignoreNotice) new Notice($("notice.invalidTab"));
          return;
        }
        let deletedTitle = t.tabsNav.navItems[contextTabIndex].title;
        new ConfirmDeleteModal(t.app, `¿Estás seguro de que deseas eliminar la pestaña "${deletedTitle}"?`, () => {
          TabContextMenu.removeTabFromBlock(t, contextTabIndex, deletedTitle);
        }).open();
      });
    });
    this.addSeparator();
    this.addItem((i) => {
      i.setTitle($("menu.copyTab"));
      i.setIcon("copy");
      i.setDisabled(contextTabIndex < 0);
      i.onClick(() => {
        const sourceSection = contextTabIndex >= 0
          ? t.getTabSourceSection(contextTabIndex)
          : null;
        if (sourceSection == null) {
          if (!t.plugin.settings.ignoreNotice) new Notice($("notice.invalidTab"));
          return;
        }
        navigator.clipboard.writeText(sourceSection).then(() => {
          if (!t.plugin.settings.ignoreNotice) new Notice($("notice.copyTabSuccess"));
        }).catch((err) => {
          if (!t.plugin.settings.ignoreNotice) new Notice($("notice.copyTabFailed"));
          console.error(err);
        });
      });
    });
    this.addItem((i) => {
      i.setTitle($("menu.pasteTab"));
      i.setIcon("paste");
      i.onClick(() => {
        navigator.clipboard.readText().then((n) => {
          if (!n || n.trim() === "" || n.trim() === t.split) {
            if (!t.plugin.settings.ignoreNotice) new Notice($("notice.noClipboardContent"));
            return;
          }
          if (!t.insertClipboardTabs(n)) {
            if (!t.plugin.settings.ignoreNotice) {
              new Notice($("notice.pasteTabFailed"));
            }
          }
        }).catch((err) => {
          if (!t.plugin.settings.ignoreNotice) new Notice($("notice.pasteTabFailed"));
          console.error(err);
        });
      });
    });
  }

  static findTabIndex(tabs, target) {
    if (!tabs || !tabs.tabsNav || !Array.isArray(tabs.tabsNav.navItems)) {
      return -1;
    }
    const directIndex = tabs.tabsNav.navItems.findIndex((item) => {
      const itemEl = item && item.tabitemEl;
      return !!(
        itemEl &&
        (itemEl === target || (target && itemEl.contains(target)))
      );
    });
    if (directIndex >= 0) return directIndex;

    if (target && typeof target.closest === "function") {
      const closestTabItemEl = target.closest(".tabs-nav-item");
      if (closestTabItemEl) {
        const found = tabs.tabsNav.navItems.findIndex(
          (item) => item && item.tabitemEl === closestTabItemEl
        );
        if (found >= 0) return found;
      }
    }

    return typeof tabs.currentIndex === "number" && tabs.currentIndex >= 0
      ? tabs.currentIndex
      : 0;
  }

  static updateBlockWithNewTab(t, newTitle, newContent) {
    const updated = !!(
      t &&
      typeof t.insertNewTab === "function" &&
      t.insertNewTab(newTitle, newContent)
    );
    if (updated && !t.plugin.settings.ignoreNotice) {
      new Notice($("notice.addNewTabSuccess"));
    }
    if (!updated) {
      console.warn("Tabs Extended cancelled an unsafe tab insertion.");
      if (t && !t.plugin.settings.ignoreNotice) {
        new Notice($("notice.invalidTab"));
      }
    }
    return updated;
  }

  static removeTabFromBlock(t, tabIndex, deletedTitle) {
    const updated = !!(
      t &&
      typeof t.deleteTabAt === "function" &&
      t.deleteTabAt(tabIndex)
    );
    if (updated && !t.plugin.settings.ignoreNotice) {
      new Notice($("notice.deleteTabSuccess", deletedTitle));
    }
    if (!updated) {
      console.warn("Tabs Extended cancelled an unsafe tab deletion.");
      if (t && !t.plugin.settings.ignoreNotice) {
        new Notice($("notice.invalidTab"));
      }
    }
    return updated;
  }
};
