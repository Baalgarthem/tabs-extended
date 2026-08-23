import { Setting, setIcon } from 'obsidian';
import { $ } from '../i18n/index.js';

export class SettingsSampleTabs {
    constructor(t, e, i) {
      this.tabsnavItems = [];
      this.tabscontentsItems = [];
      this.currentIndex = 0;
      ((this.plugin = t),
        (this.settingsTab = e),
        (this.containerEl = i),
        (this.tabscontainerEl = this.containerEl.createDiv("tabs-container")),
        (this.tabsnavEl = this.tabscontainerEl.createDiv()),
        (this.tabscontentsEl = this.tabscontainerEl.createDiv("tabs-contents")),
        this.createTabsContainer(),
        this.createSampleTabNav(),
        this.createSampleTabContent());
    }
    createTabsContainer() {
      (this.containerEl.addClass("sample-tabs-container"),
        this.tabscontainerEl.classList.add(
          "tabs-" + this.plugin.settings.defaultTabsBorder,
        ),
        this.tabscontainerEl.style.setProperty(
          "--tabs-border-color",
          this.plugin.settings.defaultTabsBorderColor,
        ),
        this.tabscontainerEl.style.setProperty(
          "--tabs-max-height",
          this.plugin.settings.defaultTabsContentsMaxHeight,
        ),
        this.tabscontainerEl.classList.add(
          "tabs-nav-" + this.plugin.settings.defaultTitlePosition,
        ),
        (this.plugin.settings.defaultTitlePosition === "top" ||
          this.plugin.settings.defaultTitlePosition === "bottom") &&
          this.tabscontainerEl.classList.add(
            "tabs-nav-line-clamp-" + this.plugin.settings.defaultTitleLineClamp,
          ),
        this.tabscontainerEl.style.setProperty(
          "--tabs-contents-padding",
          this.plugin.settings.defaultTabsContentsPadding,
        ),
        this.tabscontainerEl.style.setProperty(
          "--vertical-tabs-left-spacing",
          (this.plugin.settings.verticalTabsLeftSpacing !== undefined ? this.plugin.settings.verticalTabsLeftSpacing : 4) + "px"
        ),
        this.tabscontainerEl.style.setProperty(
          "--vertical-tabs-right-spacing",
          (this.plugin.settings.verticalTabsRightSpacing !== undefined ? this.plugin.settings.verticalTabsRightSpacing : 8) + "px"
        ),
        this.tabscontainerEl.style.setProperty(
          "--horizontal-tab-font-size",
          (this.plugin.settings.horizontalTabTitleFontSize !== undefined ? this.plugin.settings.horizontalTabTitleFontSize : 13) + "px"
        ),
        this.tabscontainerEl.style.setProperty(
          "--vertical-tab-font-size",
          (this.plugin.settings.verticalTabTitleFontSize !== undefined ? this.plugin.settings.verticalTabTitleFontSize : 13) + "px"
        ));
      let t = this.containerEl.createDiv("edit-block-button");
      (t.setAttribute("aria-label", "Edit this block"),
        (0, setIcon)(t, "code"));
    }
    createSampleTabNav() {
      this.tabsnavEl.className = "tabs-nav";
      let t = this.tabsnavEl.createDiv();
      t.className = "tabs-nav-item-wrapper";
      let e = ["Tabs", "Tabs nav", "Tabs contents", "Lorem ipsum"];
      if (
        ((this.currentIndex = 0),
        e.forEach((i, n) => {
          let r = t.createDiv();
          (r.classList.add("tabs-nav-item"),
            (r.textContent = i),
            n === 0 && r.classList.add("tabs-nav-item-active"),
            r.addEventListener("click", () => {
              (t.children[this.currentIndex].classList.remove(
                "tabs-nav-item-active",
              ),
                this.tabscontentsItems[this.currentIndex].classList.remove(
                  "tabs-content-active",
                ),
                (this.currentIndex = n),
                t.children[n].classList.add("tabs-nav-item-active"),
                this.tabscontentsItems[n].classList.add("tabs-content-active"));
            }));
        }),
        this.plugin.settings.actionButtonType !== "action-none")
      ) {
        let i = this.tabsnavEl.createDiv();
        ((i.className = "tabs-nav-button"),
          this.plugin.settings.actionButtonType === "action-add"
            ? (0, setIcon)(i, "plus")
            : this.plugin.settings.actionButtonType === "action-edit" &&
              (0, setIcon)(i, "pencil"));
      }
    }
    createSampleTabContent() {
      let t = this.tabscontentsEl.createDiv("tabs-content");
      (this.generateTabsStyleSettings(t),
        t.classList.add("tabs-content-active"));
      let e = this.tabscontentsEl.createDiv("tabs-content");
      this.generateTabsNavStyleSettings(e);
      let i = this.tabscontentsEl.createDiv("tabs-content");
      this.generateTabsContentStyleSettings(i);
      let n = this.tabscontentsEl.createDiv("tabs-content"),
        r = n.createEl("p");
      ((r.style.userSelect = "text"),
        (r.textContent =
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."),
        (this.tabscontentsItems = [t, e, i, n]));
    }
    generateTabsStyleSettings(t) {
      (new Setting(t)
        .setName($("settings.tabsBorder.name"))
        .setDesc($("settings.tabsBorder.desc"))
        .addDropdown((e) =>
          e
            .addOptions({
              "border-none": $("settings.tabsBorder.optionNone"),
              "border-hover": $("settings.tabsBorder.optionHover"),
              "border-always": $("settings.tabsBorder.optionAlways"),
            })
            .setValue(this.plugin.settings.defaultTabsBorder)
            .onChange((i) => {
              i !== this.plugin.settings.defaultTabsBorder &&
                (this.tabscontainerEl.removeClass(
                  "tabs-" + this.plugin.settings.defaultTabsBorder,
                ),
                (this.plugin.settings.defaultTabsBorder = i),
                (this.settingsTab.needRefresh = !0),
                this.tabscontainerEl.addClass("tabs-" + i),
                this.plugin.saveSettings());
            }),
        ),
        new Setting(t)
          .setName($("settings.tabsBorderColor.name"))
          .setDesc($("settings.tabsBorderColor.desc"))
          .addColorPicker((e) =>
            e
              .setValue(this.plugin.settings.defaultTabsBorderColor)
              .onChange((i) => {
                (this.tabscontainerEl.style.setProperty(
                  "--tabs-border-color",
                  i,
                ),
                  (this.plugin.settings.defaultTabsBorderColor = i),
                  (this.settingsTab.needRefresh = !0),
                  this.plugin.saveSettings());
              }),
          )
          .then((e) =>
            this.settingsTab.addResetButton(e, "defaultTabsBorderColor"),
          ),
        new Setting(t)
          .setName($("settings.hideTabsEditBlockButton.name"))
          .setDesc($("settings.hideTabsEditBlockButton.desc"))
          .addToggle((e) =>
            e
              .setValue(this.plugin.settings.hideTabsEditBlockButton)
              .onChange((i) => {
                (i
                  ? document.body.addClass("hide-tabs-edit-block-button")
                  : document.body.removeClass("hide-tabs-edit-block-button"),
                  (this.plugin.settings.hideTabsEditBlockButton = i),
                  this.plugin.saveSettings());
              }),
          ));
    }
    generateTabsNavStyleSettings(t) {
      (new Setting(t)
        .setName($("settings.tabsNavPosition.name"))
        .setDesc($("settings.tabsNavPosition.desc"))
        .addDropdown((e) =>
          e
            .addOptions({
              top: $("settings.tabsNavPosition.optionTop"),
              bottom: $("settings.tabsNavPosition.optionBottom"),
              left: $("settings.tabsNavPosition.optionLeft"),
              right: $("settings.tabsNavPosition.optionRight"),
            })
            .setValue(this.plugin.settings.defaultTitlePosition)
            .onChange((i) => {
              (this.refreshNavPosition(
                this.plugin.settings.defaultTitlePosition,
                i,
              ),
                (this.plugin.settings.defaultTitlePosition = i),
                (this.settingsTab.needRefresh = !0),
                this.plugin.saveSettings());
            }),
        ),
        new Setting(t)
          .setName($("settings.tabsNavLineClamp.name"))
          .setDesc($("settings.tabsNavLineClamp.desc"))
          .addDropdown((e) =>
            e
              .addOptions({
                one: $("settings.tabsNavLineClamp.optionOne"),
                multi: $("settings.tabsNavLineClamp.optionMulti"),
              })
              .setValue(
                this.plugin.settings.defaultTitleLineClamp === "one" ||
                  this.plugin.settings.defaultTitleLineClamp === "multi"
                  ? this.plugin.settings.defaultTitleLineClamp
                  : "one",
              )
              .onChange((i) => {
                ((this.plugin.settings.defaultTitleLineClamp = i),
                  (this.settingsTab.needRefresh = !0),
                  this.plugin.saveSettings());
              }),
          ),
        new Setting(t)
          .setName($("settings.limitTabTitleWidth.name"))
          .setDesc($("settings.limitTabTitleWidth.desc"))
          .addToggle((e) =>
            e
              .setValue(this.plugin.settings.defaultTitleLimited)
              .onChange((i) => {
                (i
                  ? this.tabsnavEl.addClass("tabs-nav-title-limited")
                  : this.tabsnavEl.removeClass("tabs-nav-title-limited"),
                  (this.plugin.settings.defaultTitleLimited = i),
                  (this.settingsTab.needRefresh = !0),
                  this.plugin.saveSettings());
              }),
          ));
    }
    generateTabsContentStyleSettings(t) {
      (new Setting(t)
        .setName($("settings.tabsContentsPadding.name"))
        .setDesc($("settings.tabsContentsPadding.desc"))
        .addText((e) =>
          e
            .setValue(this.plugin.settings.defaultTabsContentsPadding)
            .setPlaceholder("1em 2em")
            .onChange((i) => {
              (this.tabscontainerEl.style.setProperty(
                "--tabs-contents-padding",
                i,
              ),
                (this.plugin.settings.defaultTabsContentsPadding = i),
                (this.settingsTab.needRefresh = !0),
                this.plugin.saveSettings());
            }),
        )
        .then((e) =>
          this.settingsTab.addResetButton(e, "defaultTabsContentsPadding"),
        ),
        new Setting(t)
          .setName($("settings.tabsContentsMaxHeight.name"))
          .setDesc($("settings.tabsContentsMaxHeight.desc"))
          .addText((e) =>
            e
              .setValue(this.plugin.settings.defaultTabsContentsMaxHeight)
              .setPlaceholder("none")
              .onChange((i) => {
                (i !== "none"
                  ? (this.tabscontainerEl.addClass("tabs-height-limited"),
                    this.tabscontainerEl.setAttribute(
                      "style",
                      "--tabs-max-height: none;",
                    ))
                  : (this.tabscontainerEl.removeClass("tabs-height-limited"),
                    this.tabscontainerEl.style.removeProperty(
                      "--tabs-max-height",
                    )),
                  (this.plugin.settings.defaultTabsContentsMaxHeight = i),
                  (this.settingsTab.needRefresh = !0),
                  this.plugin.saveSettings());
              }),
          )
          .then((e) =>
            this.settingsTab.addResetButton(e, "defaultTabsContentsMaxHeight"),
          ));
    }
    refreshNavPosition(t, e) {
      this.tabscontainerEl &&
        (this.tabscontainerEl.classList.remove("tabs-nav-" + t),
        this.tabscontainerEl.classList.add("tabs-nav-" + e));
    }
    refresh() {
      (this.clear(),
        (this.tabscontainerEl = this.containerEl.createDiv("tabs-container")),
        (this.tabsnavEl = this.tabscontainerEl.createDiv()),
        (this.tabscontentsEl = this.tabscontainerEl.createDiv("tabs-contents")),
        this.createTabsContainer(),
        this.createSampleTabNav(),
        this.createSampleTabContent());
    }
    clear() {
      (this.containerEl.empty(),
        this.tabscontainerEl.empty(),
        this.tabsnavEl.empty(),
        this.tabscontentsEl.empty());
    }
  }
