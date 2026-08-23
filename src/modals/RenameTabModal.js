import { Modal, Setting } from 'obsidian';
import { $ } from '../i18n/index.js';

export class RenameTabModal extends Modal {
  constructor(app, currentTitle, onRename) {
    super(app);
    this.currentTitle = String(currentTitle == null ? "" : currentTitle).trim();
    this.onRename = onRename;
    this.inputEl = null;
    this.errorEl = null;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: $("modal.renameTab.title") });

    new Setting(contentEl)
      .setName($("modal.renameTab.field"))
      .addText((text) => {
        text
          .setValue(this.currentTitle)
          .setPlaceholder($("modal.renameTab.placeholder"));
        this.inputEl = text.inputEl;
      });

    this.errorEl = contentEl.createDiv({ cls: "setting-item-description" });
    this.errorEl.setAttr("aria-live", "polite");

    const btnContainer = contentEl.createDiv({ cls: "modal-button-container" });
    btnContainer.style.marginTop = "1.5em";
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "flex-end";
    btnContainer.style.gap = "10px";

    const cancelBtn = btnContainer.createEl("button", { text: $("modal.renameTab.cancel") });
    cancelBtn.addEventListener("click", () => this.close());

    const submitBtn = btnContainer.createEl("button", {
      text: $("modal.renameTab.submit"),
      cls: "mod-cta",
    });
    submitBtn.addEventListener("click", () => this.submit());

    if (this.inputEl) {
      this.inputEl.focus();
      this.inputEl.select();
      this.inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.submit();
        }
      });
    }
  }
  submit() {
    const newTitle = this.inputEl ? this.inputEl.value.trim() : "";
    if (newTitle === "") {
      if (this.errorEl) {
        this.errorEl.setText($("modal.renameTab.emptyError"));
        this.errorEl.style.color = "var(--text-error)";
      }
      return;
    }
    this.close();
    if (typeof this.onRename === "function") {
      this.onRename(newTitle);
    }
  }
  onClose() {
    this.contentEl.empty();
  }
}
