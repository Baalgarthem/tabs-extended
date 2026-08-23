import { Modal } from 'obsidian';

export class ChangelogModal extends Modal {
  constructor(app) {
    super(app);
  }
  onOpen() {
    let { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Tabs Extended - Changelog" });
    let container = contentEl.createDiv();
    container.innerHTML = `
    <div style="margin-top: 10px; max-height: 400px; overflow-y: auto; padding-right: 10px;">
        <h3>🚀 What's New & Why It's Better</h3>
        <ul style="padding-left: 20px; line-height: 1.6;">
            <li style="margin-bottom: 8px;"><strong>Brand New Identity:</strong> The author has been updated to Baalgarthem, removing all outdated links and references from the original project.</li>
            <li style="margin-bottom: 8px;"><strong>Organized Settings:</strong> We completely redesigned the settings menu. Instead of a long, confusing list, everything is now neatly grouped into easy-to-understand categories.</li>
            <li style="margin-bottom: 8px;"><strong>Always in English:</strong> The plugin will now always display its interface in English, fixing old bugs where menus would sometimes mix languages depending on your computer's settings.</li>
            <li style="margin-bottom: 8px;"><strong>Better Text Formatting:</strong> <em>Advantage:</em> You can now press "Enter" to create normal paragraph breaks, use bullet points, or add images inside your tabs just like you do in regular notes. The old version used to squish all your text together!</li>
            <li style="margin-bottom: 8px;"><strong>Works with Other Plugins:</strong> <em>Advantage:</em> Do you use plugins like <em>Dataview</em> or <em>hblock</em>? Now you can safely put them inside your tabs and they will load perfectly. The old version couldn't load them at all.</li>
            <li style="margin-bottom: 8px;"><strong>No More Broken Layouts:</strong> <em>Advantage:</em> You can now write standard code snippets inside your tabs without the plugin getting confused and merging your tabs together or breaking the page design.</li>
            <li style="margin-bottom: 8px;"><strong>Safe Editing & Dragging:</strong> <em>Advantage:</em> We fixed a major issue where auto-saving, deleting, or dragging tabs around with your mouse would slowly delete your spaces, ruin your indentation, or add infinite blank lines to your notes. Your text formatting is now 100% safe.</li>
            <li style="margin-bottom: 8px;"><strong>Smart Nested Tabs:</strong> <em>Advantage:</em> If you like to put complex code or even tabs inside of other tabs, the plugin is now smart enough to protect the outer borders. It will never collapse or cause visual errors, no matter how complex your notes get.</li>
        </ul>
    </div>
    `;
  }
  onClose() {
    this.contentEl.empty();
  }
}
