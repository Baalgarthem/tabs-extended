import { Menu, Notice } from 'obsidian';
import { $ } from '../i18n/index.js';
import { RenameTabModal } from '../modals/RenameTabModal.js';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal.js';

export class TabContextMenu extends Menu {
  constructor(t, e) {
    super();
    const contextTabIndex = Yr.findTabIndex(t, e.target);
    this.addItem((i) => {
      i.setTitle($("menu.addNewTab"));
      i.setIcon("plus");
      i.onClick(() => {
        let newTitle = t.isVertical
          ? (t.plugin.settings.defaultTabNavItemVertical || "New vertical tab")
          : (t.plugin.settings.defaultTabNavItem || "New tab");
        let newContent = t.plugin.settings.defaultTabContent || "New tab content";
        Yr.updateBlockWithNewTab(t, newTitle, newContent);
      });
    });
    this.addItem((i) => {
      i.setTitle($("menu.renameTab"));
      i.setIcon("pencil");
      i.setDisabled(contextTabIndex < 0);
      i.onClick(() => {
        const renameSnapshot = contextTabIndex >= 0 &&
          typeof t.getTabRenameSnapshot === "function"
          ? t.getTabRenameSnapshot(contextTabIndex)
          : null;
        if (!renameSnapshot) {
          if (!t.plugin.settings.ignoreNotice) {
            new Dt.Notice($("notice.invalidTab"));
          }
          return;
        }
        new RenameTabModal(t.app, renameSnapshot.title, (newTitle) => {
          if (
            typeof t.hasConflictingTabsEditorModal === "function" &&
            t.hasConflictingTabsEditorModal()
          ) {
            return $("modal.renameTab.editorOpen");
          }
          let renamed = false;
          const applyRename = () => {
            renamed = typeof t.renameTabAt === "function" &&
              t.renameTabAt(contextTabIndex, newTitle, renameSnapshot);
          };
          if (
            typeof t.lockScrollPosition === "function" &&
            t.tabsEl &&
            t.tabsEl.isConnected
          ) {
            t.lockScrollPosition(t.tabsEl, applyRename);
          } else {
            applyRename();
          }
          if (renamed && !t.plugin.settings.ignoreNotice) {
            new Dt.Notice($("notice.renameTabSuccess"));
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
          if (!t.plugin.settings.ignoreNotice) new Dt.Notice($("notice.invalidTab"));
          return;
        }
        let deletedTitle = t.tabsNav.navItems[contextTabIndex].title;
        new ConfirmDeleteModal(t.app, `¿Estás seguro de que deseas eliminar la pestaña "${deletedTitle}"?`, () => {
          Yr.removeTabFromBlock(t, contextTabIndex, deletedTitle);
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
          if (!t.plugin.settings.ignoreNotice) new Dt.Notice($("notice.invalidTab"));
          return;
        }
        navigator.clipboard.writeText(sourceSection).then(() => {
          if (!t.plugin.settings.ignoreNotice) new Dt.Notice($("notice.copyTabSuccess"));
        }).catch((err) => {
          if (!t.plugin.settings.ignoreNotice) new Dt.Notice($("notice.copyTabFailed"));
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
            if (!t.plugin.settings.ignoreNotice) new Dt.Notice($("notice.noClipboardContent"));
            return;
          }
          if (!t.insertClipboardTabs(n)) {
            if (!t.plugin.settings.ignoreNotice) {
              new Dt.Notice($("notice.pasteTabFailed"));
            }
          }
        }).catch((err) => {
          if (!t.plugin.settings.ignoreNotice) new Dt.Notice($("notice.pasteTabFailed"));
          console.error(err);
        });
      });
    });
  }

  static findTabIndex(tabs, target) {
    if (!tabs || !tabs.tabsNav || !Array.isArray(tabs.tabsNav.navItems)) {
      return -1;
    }
    return tabs.tabsNav.navItems.findIndex((item) => {
      const itemEl = item && item.tabitemEl;
      return !!(
        itemEl &&
        (itemEl === target || (target && itemEl.contains(target)))
      );
    });
  }

  static updateBlockWithNewTab(t, newTitle, newContent) {
    const updated = !!(
      t &&
      typeof t.insertNewTab === "function" &&
      t.insertNewTab(newTitle, newContent)
    );
    if (updated && !t.plugin.settings.ignoreNotice) {
      new Dt.Notice($("notice.addNewTabSuccess"));
    }
    if (!updated) {
      console.warn("Tabs Extended cancelled an unsafe tab insertion.");
      if (t && !t.plugin.settings.ignoreNotice) {
        new Dt.Notice($("notice.invalidTab"));
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
      new Dt.Notice($("notice.deleteTabSuccess", deletedTitle));
    }
    if (!updated) {
      console.warn("Tabs Extended cancelled an unsafe tab deletion.");
      if (t && !t.plugin.settings.ignoreNotice) {
        new Dt.Notice($("notice.invalidTab"));
      }
    }
    return updated;
  }
}
