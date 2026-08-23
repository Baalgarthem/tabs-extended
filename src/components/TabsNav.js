import { TabItem } from './TabItem.js';

export class TabsNav {
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
          ? (0, qr.setIcon)(e, "plus")
          : t === "action-edit" && ((0, qr.setIcon)(e, "pencil"), e.firstElementChild || (0, qr.setIcon)(e, "lucide-pencil")),
        e
      );
    }
  }
