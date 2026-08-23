import { Modal } from 'obsidian';

export class ConfirmDeleteModal extends Modal {
  constructor(app, message, onConfirm) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    let { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Confirmación de eliminación" });
    let msgEl = contentEl.createEl("p", { text: this.message, cls: "tabs-confirm-modal-message" });
    msgEl.style.whiteSpace = "pre-wrap";
    let btnContainer = contentEl.createDiv({ cls: "modal-button-container" });
    btnContainer.style.marginTop = "1.5em";
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "flex-end";
    btnContainer.style.gap = "10px";
    let cancelBtn = btnContainer.createEl("button", { text: "Cancelar" });
    cancelBtn.addEventListener("click", () => this.close());
    let confirmBtn = btnContainer.createEl("button", { text: "Eliminar", cls: "mod-warning" });
    confirmBtn.addEventListener("click", () => {
      this.close();
      this.onConfirm();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
}
