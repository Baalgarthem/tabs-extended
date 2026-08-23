import { cleanVirtualLinksFromElement } from '../core/model.js';
import { TabContextMenu } from './TabContextMenu.js';

export class TabItem {
  constructor(t, e) {
    this.currentTab = 0;
    ((this.plugin = t),
      (this.tabcontents = e),
      (this.tabcontentsEl = this.createTabContentsEl()),
      (this.tabcontents[0].isActiveed = !0),
      this.tabcontents[0].contentEl.classList.add("tabs-content-active"));
  }
  createTabContentsEl() {
    let t = document.createElement("div");
    return (
      (t.className = "tabs-contents"),
      this.tabcontents.forEach((e) => {
        t.appendChild(e.contentEl);
      }),
      t
    );
  }
  refreshActiveTabContent(t) {
    ((this.tabcontents[this.currentTab].isActiveed = !1),
      this.tabcontents[this.currentTab].contentEl.classList.remove(
        "tabs-content-active",
      ),
      (this.tabcontents[t].isActiveed = !0),
      this.tabcontents[t].contentEl.classList.add("tabs-content-active"),
      (this.currentTab = t));
  }
}
