import { setIcon } from 'obsidian';
import { $ } from '../i18n/index.js';

export class TabsConfig {
  constructor(t, e, i, isVertical = false) {
    const configStr = String(t == null ? "" : t);
    ((this.rawConfig = configStr.trim()),
      (this.pluginSettings = i || {}),
      (this.tabsborder = (i && i.defaultTabsBorder) || "border-none"),
      (this.tabsBorderColor = (i && i.defaultTabsBorderColor) || "#e0e0e0"),
      (this.hideTabsEditBlockButton = !!(i && i.hideTabsEditBlockButton)),
      (this.titlePosition = isVertical ? "left" : ((i && i.defaultTitlePosition) || "top")),
      (this.titleLineClamp = (i && i.defaultTitleLineClamp) || "one"),
      (this.actionButton = (i && i.actionButtonType) || "action-edit"),
      (this.titleLimited = !!(i && i.defaultTitleLimited)),
      (this.tabsMaxHeight = (i && i.defaultTabsContentsMaxHeight) || "none"),
      (this.tabsContentsPadding = (i && i.defaultTabsContentsPadding) || "1em 2em"),
      (this.verticalTabsColumns = (i && i.verticalTabsColumns) || "1"),
      (this.verticalTitleBehavior = (i && i.verticalTitleBehavior) || "hover-scroll"),
      (this.verticalTabsLeftSpacing = (i && i.verticalTabsLeftSpacing !== undefined) ? i.verticalTabsLeftSpacing : 4),
      (this.verticalTabsRightSpacing = (i && i.verticalTabsRightSpacing !== undefined) ? i.verticalTabsRightSpacing : 8),
      this.parseConfig(configStr));
  }
  parseConfig(t) {
    String(t == null ? "" : t).trim()
      .toLowerCase()
      .split('\n')
      .forEach((e) => {
        e.split(",").forEach((i) => {
          switch (i.trim()) {
            case "top":
              this.titlePosition = "top";
              break;
            case "bottom":
              this.titlePosition = "bottom";
              break;
            case "left":
              this.titlePosition = "left";
              break;
            case "right":
              this.titlePosition = "right";
              break;
            case "action-add":
              this.actionButton = "action-add";
              break;
            case "action-edit":
              this.actionButton = "action-edit";
              break;
            case "action-none":
              this.actionButton = "action-none";
              break;
            case "one":
              this.titleLineClamp = "one";
              break;
            case "multi":
              this.titleLineClamp = "multi";
              break;
            case "cols-1":
            case "col-1":
              this.verticalTabsColumns = "1";
              break;
            case "cols-2":
            case "col-2":
              this.verticalTabsColumns = "2";
              break;
            case "cols-3":
            case "col-3":
              this.verticalTabsColumns = "3";
              break;
            case "hover-scroll":
              this.verticalTitleBehavior = "hover-scroll";
              break;
            case "no-hover-scroll":
              this.verticalTitleBehavior = "multi-line";
              break;
            default:
              break;
          }
        });
      });
  }
  decorate(t, e, i) {
    (t.classList.add("tabs-" + this.tabsborder),
      t.style.setProperty("--tabs-border-color", this.tabsBorderColor),
      t.style.setProperty("--tabs-max-height", this.tabsMaxHeight),
      this.hideTabsEditBlockButton &&
        document.body.classList.add("hide-tabs-edit-block-button"),
      t.classList.add("tabs-nav-" + (this.titlePosition || "top")),
      t.classList.add("tabs-nav-" + (this.titleLineClamp || "one")),
      this.titleLimited && e.classList.add("tabs-nav-title-limited"),
      i.style.setProperty("--tabs-contents-padding", this.tabsContentsPadding));

    // Content alignment & hyphenation classes
    let cAlign = (this.pluginSettings && this.pluginSettings.tabContentAlignment) || "left";
    let cHyphen = (this.pluginSettings && this.pluginSettings.tabContentHyphenation) || "none";
    t.classList.add("tabs-content-align-" + cAlign);
    t.classList.add("tabs-content-hyphens-" + cHyphen);

    if (this.titlePosition === "left" || this.titlePosition === "right") {
      t.classList.add("tabs-nav-v-cols-" + (this.verticalTabsColumns || "1"));
      let vAlign = (this.pluginSettings && this.pluginSettings.verticalTitleAlignment) || "left";
      t.classList.add("tabs-nav-v-align-" + vAlign);

      let vBehavior = (this.pluginSettings && this.pluginSettings.verticalTitleBehavior) || 
                      (this.verticalTitleBehavior) || 
                      "hover-scroll";
      if (vBehavior === "truncate" || vBehavior === "double-line") {
        vBehavior = "multi-line";
      }
      t.classList.add("tabs-nav-v-behavior-" + vBehavior);
      if (vBehavior === "hover-scroll") {
        t.classList.add("tabs-nav-v-hover-scroll");
      }
      let currentLeftSpacing = (this.pluginSettings && this.pluginSettings.verticalTabsLeftSpacing !== undefined && this.pluginSettings.verticalTabsLeftSpacing !== null) 
        ? this.pluginSettings.verticalTabsLeftSpacing 
        : (this.verticalTabsLeftSpacing !== undefined ? this.verticalTabsLeftSpacing : 4);
      t.style.setProperty("--vertical-tabs-left-spacing", Math.max(0, currentLeftSpacing) + "px");
      let currentRightSpacing = (this.pluginSettings && this.pluginSettings.verticalTabsRightSpacing !== undefined && this.pluginSettings.verticalTabsRightSpacing !== null) 
        ? this.pluginSettings.verticalTabsRightSpacing 
        : (this.verticalTabsRightSpacing !== undefined ? this.verticalTabsRightSpacing : 8);
      t.style.setProperty("--vertical-tabs-right-spacing", Math.max(0, currentRightSpacing) + "px");
    }
  }
};
