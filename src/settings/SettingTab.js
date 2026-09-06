import { PluginSettingTab, Setting, Notice, Modal } from 'obsidian';
import { $, locales } from '../i18n/index.js';
import { SettingsSampleTabs } from './SampleTabsPreview.js';
import { ChangelogModal } from '../modals/ChangelogModal.js';
import { DEFAULT_SETTINGS } from './defaultSettings.js';

export class TabsExtendedSettingTab extends PluginSettingTab {
    constructor(t, e) {
      super(t, e);
      this.sampleTabs = null;
      this.needRefresh = !1;
      ((this.plugin = e),
        (t.setting.onClose = () => {
          (this.plugin.settings.autorefreshMarkdownView &&
            this.needRefresh &&
            (this.plugin.refreshOpenViews(), (this.needRefresh = !1)),
            t.setting.closeActiveTab());
        }));
    }




    display() {
        let { containerEl: t } = this;
        let prevScroll = t.scrollTop; // Save scroll position
        t.empty();
        t.addClass("tabs-extended-settings");
        
        let lang = this.plugin.settings.language || "es";
        if (!locales[lang]) {
            lang = "es";
            this.plugin.settings.language = "es";
            this.plugin.saveSettings();
        }
        
        let _ = (key) => locales[lang][key] || key;

        // ==========================================
        // CATEGORY 1: GENERAL
        // ==========================================
        new Setting(t).setName(_("heading_general")).setHeading().setDesc(_("heading_general_desc"));
        new Setting(t)
          .setName(_("language_name"))
          .setDesc(_("language_desc"))
          .addDropdown((e) => {
            e.addOption("en", "English")
             .addOption("es", "Español")
             .setValue(lang)
             .onChange((i) => {
               this.plugin.settings.language = i;
               this.plugin.saveSettings();
               this.display();
             });
          });
        new Setting(t)
          .setName(_("ignore_notice_name"))
          .setDesc(_("ignore_notice_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.ignoreNotice).onChange((i) => {
                this.plugin.settings.ignoreNotice = i;
                this.plugin.saveSettings();
            })
          );
        new Setting(t)
          .setName(_("auto_refresh_name"))
          .setDesc(_("auto_refresh_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.autorefreshMarkdownView).onChange((i) => {
                this.plugin.settings.autorefreshMarkdownView = i;
                this.plugin.saveSettings();
            })
          );
        new Setting(t)
          .setName(_("drag_drop_name"))
          .setDesc(_("drag_drop_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.dragAndDrop).onChange((i) => {
                this.plugin.settings.dragAndDrop = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
            })
          );
        new Setting(t)
          .setName(_("double_click_name"))
          .setDesc(_("double_click_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.doubleClickToEdit).onChange((i) => {
                this.plugin.settings.doubleClickToEdit = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
            })
          );
        new Setting(t)
          .setName(_("hide_edit_name"))
          .setDesc(_("hide_edit_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.hideTabsEditBlockButton).onChange((i) => {
                this.plugin.settings.hideTabsEditBlockButton = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
            })
          );
        t.createEl("hr", { cls: "tabs-settings-divider" });

        // ==========================================
        // CATEGORY 2: PESTAÑAS ESTÁNDAR
        // ==========================================
        new Setting(t).setName(_("heading_standard")).setHeading().setDesc(_("heading_standard_desc"));
        new Setting(t)
          .setName(_("tabs_keyword_name"))
          .setDesc(_("tabs_keyword_desc"))
          .addText((e) =>
            e.setValue(this.plugin.settings.tabsKeyword || "tabs").setPlaceholder("tabs").onChange((i) => {
                i = i.trim();
                i == "" && (i = "tabs");
                this.plugin.settings.tabsKeyword = i;
                this.plugin.saveSettings();
                this.plugin.registerCodeBlockProcessors();
                this.needRefresh = !0;
            })
          ).then((e) => this.addResetButton(e, "tabsKeyword"));
        new Setting(t)
          .setName(_("default_title_name"))
          .setDesc(_("default_title_desc"))
          .addText((e) =>
            e.setValue(this.plugin.settings.defaultTabNavItem || "New tab").setPlaceholder("New tab").onChange((i) => {
                i == "" && (i = "New tab");
                this.plugin.settings.defaultTabNavItem = i;
                this.plugin.saveSettings();
            })
          ).then((e) => this.addResetButton(e, "defaultTabNavItem"));
        new Setting(t)
          .setName(_("default_title_vertical_name"))
          .setDesc(_("default_title_vertical_desc"))
          .addText((e) =>
            e.setValue(this.plugin.settings.defaultTabNavItemVertical || "New vertical tab").setPlaceholder("New vertical tab").onChange((i) => {
                i == "" && (i = "New vertical tab");
                this.plugin.settings.defaultTabNavItemVertical = i;
                this.plugin.saveSettings();
            })
          ).then((e) => this.addResetButton(e, "defaultTabNavItemVertical"));
        new Setting(t)
          .setName(_("default_content_name"))
          .setDesc(_("default_content_desc"))
          .addTextArea((e) =>
            e.setValue(this.plugin.settings.defaultTabContent).setPlaceholder("New tab content").onChange((i) => {
                i == "" && (i = "New tab content");
                this.plugin.settings.defaultTabContent = i;
                this.plugin.saveSettings();
            })
          ).then((e) => this.addResetButton(e, "defaultTabContent"));
        new Setting(t)
          .setName(_("action_button_name"))
          .setDesc(_("action_button_desc"))
          .addDropdown((e) =>
            e
              .addOption("action-add", _("opt_add_tab"))
              .addOption("action-edit", _("opt_edit_tab"))
              .addOption("action-none", _("opt_hide_btn"))
              .setValue(this.plugin.settings.actionButtonType)
              .onChange((i) => {
                this.plugin.settings.actionButtonType = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
              })
          );
        new Setting(t)
          .setName(_("title_position_name"))
          .setDesc(_("title_position_desc"))
          .addDropdown((e) =>
            e
              .addOption("top", _("opt_top"))
              .addOption("bottom", _("opt_bottom"))
              .addOption("left", _("opt_left"))
              .addOption("right", _("opt_right"))
              .setValue(this.plugin.settings.defaultTitlePosition)
              .onChange((i) => {
                this.plugin.settings.defaultTitlePosition = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
              })
          ).then((e) => this.addResetButton(e, "defaultTitlePosition"));
        t.createEl("hr", { cls: "tabs-settings-divider" });

        // ==========================================
        // CATEGORY 3: TÍTULOS DE PESTAÑAS
        // ==========================================
        new Setting(t).setHeading().setName(_("heading_title_behavior")).setDesc(_("heading_title_behavior_desc"));
        new Setting(t)
          .setName(_("settings.verticalTabsColumns.name"))
          .setDesc(_("settings.verticalTabsColumns.desc"))
          .addDropdown((e) =>
            e
              .addOption("1", _("settings.verticalTabsColumns.option1"))
              .addOption("2", _("settings.verticalTabsColumns.option2"))
              .addOption("3", _("settings.verticalTabsColumns.option3"))
              .setValue(this.plugin.settings.verticalTabsColumns || "1")
              .onChange((i) => {
                this.plugin.settings.verticalTabsColumns = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
                this.display();
              })
          ).then((e) => this.addResetButton(e, "verticalTabsColumns"));
        new Setting(t)
          .setName(_("vertical_left_spacing_name"))
          .setDesc(_("vertical_left_spacing_desc"))
          .addSlider((e) =>
            e
              .setLimits(0, 50, 1)
              .setValue(this.plugin.settings.verticalTabsLeftSpacing !== undefined ? this.plugin.settings.verticalTabsLeftSpacing : 4)
              .setDynamicTooltip()
              .onChange((i) => {
                this.plugin.settings.verticalTabsLeftSpacing = Math.max(0, i);
                this.plugin.saveSettings();
                this.plugin.updateVerticalTabsLeftSpacingCss(i);
                this.needRefresh = !0;
                if (this.sampleTabs && this.sampleTabs.tabscontainerEl) {
                  this.sampleTabs.tabscontainerEl.style.setProperty("--vertical-tabs-left-spacing", i + "px");
                }
              })
          ).then((e) => this.addResetButton(e, "verticalTabsLeftSpacing"));
        new Setting(t)
          .setName(_("vertical_right_spacing_name"))
          .setDesc(_("vertical_right_spacing_desc"))
          .addSlider((e) =>
            e
              .setLimits(0, 50, 1)
              .setValue(this.plugin.settings.verticalTabsRightSpacing !== undefined ? this.plugin.settings.verticalTabsRightSpacing : 8)
              .setDynamicTooltip()
              .onChange((i) => {
                this.plugin.settings.verticalTabsRightSpacing = Math.max(0, i);
                this.plugin.saveSettings();
                this.plugin.updateVerticalTabsRightSpacingCss(i);
                this.needRefresh = !0;
                if (this.sampleTabs && this.sampleTabs.tabscontainerEl) {
                  this.sampleTabs.tabscontainerEl.style.setProperty("--vertical-tabs-right-spacing", i + "px");
                }
              })
          ).then((e) => this.addResetButton(e, "verticalTabsRightSpacing"));
        new Setting(t)
          .setName(_("horizontal_tab_font_size_name"))
          .setDesc(_("horizontal_tab_font_size_desc"))
          .addSlider((e) =>
            e
              .setLimits(8, 30, 1)
              .setValue(this.plugin.settings.horizontalTabTitleFontSize !== undefined ? this.plugin.settings.horizontalTabTitleFontSize : 13)
              .setDynamicTooltip()
              .onChange((i) => {
                this.plugin.settings.horizontalTabTitleFontSize = Math.max(8, i);
                this.plugin.saveSettings();
                this.plugin.updateHorizontalTabTitleFontSizeCss(i);
                this.needRefresh = !0;
                if (this.sampleTabs && this.sampleTabs.tabscontainerEl) {
                  this.sampleTabs.tabscontainerEl.style.setProperty("--horizontal-tab-font-size", i + "px");
                }
              })
          ).then((e) => this.addResetButton(e, "horizontalTabTitleFontSize"));
        new Setting(t)
          .setName(_("vertical_tab_font_size_name"))
          .setDesc(_("vertical_tab_font_size_desc"))
          .addSlider((e) =>
            e
              .setLimits(8, 30, 1)
              .setValue(this.plugin.settings.verticalTabTitleFontSize !== undefined ? this.plugin.settings.verticalTabTitleFontSize : 13)
              .setDynamicTooltip()
              .onChange((i) => {
                this.plugin.settings.verticalTabTitleFontSize = Math.max(8, i);
                this.plugin.saveSettings();
                this.plugin.updateVerticalTabTitleFontSizeCss(i);
                this.needRefresh = !0;
                if (this.sampleTabs && this.sampleTabs.tabscontainerEl) {
                  this.sampleTabs.tabscontainerEl.style.setProperty("--vertical-tab-font-size", i + "px");
                }
              })
          ).then((e) => this.addResetButton(e, "verticalTabTitleFontSize"));
        new Setting(t)
          .setName(_("title_wrap_name"))
          .setDesc(_("title_wrap_desc"))
          .addDropdown((e) =>
            e
              .addOption("one", _("opt_single_line"))
              .addOption("multi", _("opt_multi_line"))
              .setValue(this.plugin.settings.defaultTitleLineClamp || "one")
              .onChange((i) => {
                this.plugin.settings.defaultTitleLineClamp = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
              })
          ).then((e) => this.addResetButton(e, "defaultTitleLineClamp"));
        new Setting(t)
          .setName(_("vertical_title_behavior_name"))
          .setDesc(_("vertical_title_behavior_desc"))
          .addDropdown((e) =>
            e
              .addOption("hover-scroll", _("opt_v_hover_scroll"))
              .addOption("auto-scroll", _("opt_v_auto_scroll"))
              .addOption("multi-line", _("opt_v_multi_line"))
              .addOption("shrink", _("opt_v_shrink"))
              .setValue(this.plugin.settings.verticalTitleBehavior || "hover-scroll")
              .onChange((i) => {
                this.plugin.settings.verticalTitleBehavior = i;
                this.plugin.saveSettings();
                this.plugin.updateVerticalTitleBehaviorCss(i);
                this.needRefresh = !0;
                if (this.sampleTabs && this.sampleTabs.tabscontainerEl) {
                  const el = this.sampleTabs.tabscontainerEl;
                  el.classList.remove(
                    "tabs-nav-v-behavior-hover-scroll",
                    "tabs-nav-v-behavior-auto-scroll",
                    "tabs-nav-v-behavior-multi-line",
                    "tabs-nav-v-behavior-shrink",
                    "tabs-nav-v-behavior-truncate",
                    "tabs-nav-v-behavior-double-line",
                    "tabs-nav-v-hover-scroll"
                  );
                  el.classList.add("tabs-nav-v-behavior-" + i);
                  if (i === "hover-scroll") {
                    el.classList.add("tabs-nav-v-hover-scroll");
                  }
                }
              })
          ).then((e) => this.addResetButton(e, "verticalTitleBehavior"));
        new Setting(t)
          .setName(_("limit_width_name"))
          .setDesc(_("limit_width_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.defaultTitleLimited).onChange((i) => {
                this.plugin.settings.defaultTitleLimited = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
            })
          ).then((e) => this.addResetButton(e, "defaultTitleLimited"));
        t.createEl("hr", { cls: "tabs-settings-divider" });

        // ==========================================
        // CATEGORY 4: CONTENEDOR Y BORDES
        // ==========================================
        new Setting(t).setHeading().setName(_("heading_container")).setDesc(_("heading_container_desc"));
        new Setting(t)
          .setName(_("container_border_name"))
          .setDesc(_("container_border_desc"))
          .addDropdown((e) =>
            e
              .addOption("border-always", _("opt_always"))
              .addOption("border-hover", _("opt_hover"))
              .addOption("border-never", _("opt_never"))
              .setValue(this.plugin.settings.defaultTabsBorder)
              .onChange((i) => {
                this.plugin.settings.defaultTabsBorder = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
              })
          ).then((e) => this.addResetButton(e, "defaultTabsBorder"));
        new Setting(t)
          .setName(_("border_color_name"))
          .setDesc(_("border_color_desc"))
          .addText((e) =>
            e.setValue(this.plugin.settings.defaultTabsBorderColor).setPlaceholder("#e0e0e0").onChange((i) => {
                this.plugin.settings.defaultTabsBorderColor = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
                if (this.sampleTabs && this.sampleTabs.tabscontainerEl) {
                  this.sampleTabs.tabscontainerEl.style.setProperty("--tabs-border-color", i);
                }
            })
          ).then((e) => this.addResetButton(e, "defaultTabsBorderColor"));
        new Setting(t)
          .setName(_("content_padding_name"))
          .setDesc(_("content_padding_desc"))
          .addText((e) =>
            e.setValue(this.plugin.settings.defaultTabsContentsPadding).setPlaceholder("1em 2em").onChange((i) => {
                this.plugin.settings.defaultTabsContentsPadding = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
                if (this.sampleTabs && this.sampleTabs.tabscontainerEl) {
                  this.sampleTabs.tabscontainerEl.style.setProperty("--tabs-contents-padding", i);
                }
            })
          ).then((e) => this.addResetButton(e, "defaultTabsContentsPadding"));
        new Setting(t)
          .setName(_("max_height_name"))
          .setDesc(_("max_height_desc"))
          .addText((e) =>
            e.setValue(this.plugin.settings.defaultTabsContentsMaxHeight).setPlaceholder("none").onChange((i) => {
                this.plugin.settings.defaultTabsContentsMaxHeight = i;
                this.plugin.saveSettings();
                this.needRefresh = !0;
                if (this.sampleTabs && this.sampleTabs.tabscontainerEl) {
                  this.sampleTabs.tabscontainerEl.style.setProperty("--tabs-max-height", i);
                }
            })
          ).then((e) => this.addResetButton(e, "defaultTabsContentsMaxHeight"));
        new Setting(t)
          .setName(_("vertical_title_alignment_name"))
          .setDesc(_("vertical_title_alignment_desc"))
          .addDropdown((e) =>
            e
              .addOption("left", _("opt_align_left"))
              .addOption("center", _("opt_align_center"))
              .addOption("right", _("opt_align_right"))
              .setValue(
                this.plugin.settings.verticalTitleAlignment === "left" ||
                this.plugin.settings.verticalTitleAlignment === "center" ||
                this.plugin.settings.verticalTitleAlignment === "right"
                  ? this.plugin.settings.verticalTitleAlignment
                  : "left"
              )
              .onChange((i) => {
                this.plugin.settings.verticalTitleAlignment = i;
                this.plugin.saveSettings();
                this.plugin.updateGlobalCssVariables();
                this.needRefresh = !0;
              })
          ).then((e) => this.addResetButton(e, "verticalTitleAlignment"));
        new Setting(t)
          .setName(_("tab_content_alignment_name"))
          .setDesc(_("tab_content_alignment_desc"))
          .addDropdown((e) =>
            e
              .addOption("left", _("opt_align_left"))
              .addOption("center", _("opt_align_center"))
              .addOption("right", _("opt_align_right"))
              .addOption("justify", _("opt_align_justify"))
              .addOption("soft-justify", _("opt_align_soft_justify"))
              .addOption("inherit", _("opt_align_inherit"))
              .setValue(this.plugin.settings.tabContentAlignment || "left")
              .onChange((i) => {
                this.plugin.settings.tabContentAlignment = i;
                this.plugin.saveSettings();
                this.plugin.updateGlobalCssVariables();
                this.needRefresh = !0;
              })
          ).then((e) => this.addResetButton(e, "tabContentAlignment"));
        new Setting(t)
          .setName(_("tab_content_hyphenation_name"))
          .setDesc(_("tab_content_hyphenation_desc"))
          .addDropdown((e) =>
            e
              .addOption("none", _("opt_hyphens_none"))
              .addOption("auto", _("opt_hyphens_auto"))
              .setValue(this.plugin.settings.tabContentHyphenation || "none")
              .onChange((i) => {
                this.plugin.settings.tabContentHyphenation = i;
                this.plugin.saveSettings();
                this.plugin.updateGlobalCssVariables();
                this.needRefresh = !0;
              })
          ).then((e) => this.addResetButton(e, "tabContentHyphenation"));
        t.createEl("hr", { cls: "tabs-settings-divider" });

        // ==========================================
        // CATEGORY 5: EDITOR MODAL
        // ==========================================
        new Setting(t).setName(_("heading_editor")).setHeading().setDesc(_("heading_editor_desc"));
        new Setting(t)
          .setName(_("autosave_name"))
          .setDesc(_("autosave_desc"))
          .addSlider((e) =>
            e.setLimits(0, 3e3, 100).setValue(this.plugin.settings.editorAutoSaveInterval).setDynamicTooltip().onChange((i) => {
                this.plugin.settings.editorAutoSaveInterval = i;
                this.plugin.saveSettings();
            })
          );
        new Setting(t)
          .setName(_("show_toolbar_name"))
          .setDesc(_("show_toolbar_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.showToolbar).onChange((i) => {
                this.plugin.settings.showToolbar = i;
                this.plugin.saveSettings();
            })
          );
        new Setting(t)
          .setName(_("tab_size_name"))
          .setDesc(_("tab_size_desc"))
          .addSlider((e) =>
            e.setLimits(1, 8, 1).setValue(this.plugin.settings.tabSize).setDynamicTooltip().onChange((i) => {
                this.plugin.settings.tabSize = i;
                this.plugin.saveSettings();
            })
          );
        new Setting(t)
          .setName(_("render_code_blocks_in_modal_name"))
          .setDesc(_("render_code_blocks_in_modal_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.renderCodeBlocksInModal !== false).onChange((i) => {
                this.plugin.settings.renderCodeBlocksInModal = i;
                this.plugin.saveSettings();
            })
          );
        t.createEl("hr", { cls: "tabs-settings-divider" });

        // ==========================================
        // CATEGORY 6: PESTAÑAS ANIDADAS
        // ==========================================
        new Setting(t).setName(_("heading_nested")).setHeading().setDesc(_("heading_nested_desc"));
        new Setting(t)
          .setName(_("separator_name"))
          .setDesc(_("separator_desc"))
          .addText((e) =>
            e.setValue(this.plugin.settings.split).onChange((i) => {
              i == "" && (i = "tema:");
              this.plugin.settings.split = i;
              this.plugin.saveSettings();
              this.needRefresh = !0;
            })
          ).then((e) => this.addResetButton(e, "split"));
        new Setting(t)
          .setName(_("highlight_nested_name"))
          .setDesc(_("highlight_nested_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.nestedTabsHighlight).onChange((i) => {
              this.plugin.settings.nestedTabsHighlight = i;
              this.plugin.saveSettings();
              this.display();
            })
          );
        new Setting(t)
          .setName(_("nested_no_borders_name"))
          .setDesc(_("nested_no_borders_desc"))
          .addToggle((e) =>
            e.setValue(this.plugin.settings.nestedTabsNoBorders).onChange((i) => {
              this.plugin.settings.nestedTabsNoBorders = i;
              this.plugin.saveSettings();
              this.display();
            })
          );
          
        if (this.plugin.settings.nestedTabsHighlight) {
                new Setting(t)
                  .setName(_("start_text_name"))
                  .setDesc(_("start_text_desc"))
                  .addText((e) => e.setPlaceholder("nesting start").setValue(this.plugin.settings.nestedTabsDelimiterTextStart).onChange((i) => {
                      this.plugin.settings.nestedTabsDelimiterTextStart = i;
                      this.plugin.saveSettings();
                  }));
                new Setting(t)
                  .setName(_("end_text_name"))
                  .setDesc(_("end_text_desc"))
                  .addText((e) => e.setPlaceholder("nesting end").setValue(this.plugin.settings.nestedTabsDelimiterTextEnd).onChange((i) => {
                      this.plugin.settings.nestedTabsDelimiterTextEnd = i;
                      this.plugin.saveSettings();
                  }));
            
            new Setting(t)
              .setName(_("underline_style_name"))
              .setDesc(_("underline_style_desc"))
              .addDropdown((e) => {
                e.addOption("solid", _("opt_solid"))
                 .addOption("dashed", _("opt_dashed"))
                 .addOption("dotted", _("opt_dotted"))
                 .addOption("double", _("opt_double"))
                 .addOption("wavy", _("opt_wavy"))
                 .addOption("pill", _("opt_pill"))
                 .setValue(this.plugin.settings.nestedTabsItemUnderlineStyle)
                 .onChange((i) => {
                    this.plugin.settings.nestedTabsItemUnderlineStyle = i;
                    this.plugin.saveSettings();
                 });
              });
              
            new Setting(t)
              .setName(_("underline_thick_name"))
              .setDesc(_("underline_thick_desc"))
              .addSlider((e) => e.setLimits(1, 10, 1).setValue(this.plugin.settings.nestedTabsItemUnderlineThickness).setDynamicTooltip().onChange((i) => {
                  this.plugin.settings.nestedTabsItemUnderlineThickness = i;
                  this.plugin.saveSettings();
              }));

            new Setting(t)
              .setName(_("underline_offset_name"))
              .setDesc(_("underline_offset_desc"))
              .addSlider((e) => e.setLimits(1, 10, 1).setValue(this.plugin.settings.nestedTabsItemUnderlineOffset).setDynamicTooltip().onChange((i) => {
                  this.plugin.settings.nestedTabsItemUnderlineOffset = i;
                  this.plugin.saveSettings();
              }));
              
            new Setting(t)
              .setName(_("underline_opacity_name"))
              .setDesc(_("underline_opacity_desc"))
              .addSlider((e) => e.setLimits(0, 100, 5).setValue(this.plugin.settings.nestedTabsItemUnderlineOpacity).setDynamicTooltip().onChange((i) => {
                  this.plugin.settings.nestedTabsItemUnderlineOpacity = i;
                  this.plugin.saveSettings();
              }));
            
            new Setting(t)
              .setName(_("color_light_name"))
              .setDesc(_("color_light_desc"))
              .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsDelimiterColorLight).onChange((i) => {
                  this.plugin.settings.nestedTabsDelimiterColorLight = i;
                  this.plugin.saveSettings();
              }))
              .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsItemColorLight).onChange((i) => {
                  this.plugin.settings.nestedTabsItemColorLight = i;
                  this.plugin.saveSettings();
              }));
              
            new Setting(t)
              .setName(_("diff_dark_name"))
              .setDesc(_("diff_dark_desc"))
              .addToggle((e) => e.setValue(this.plugin.settings.nestedTabsDifferentDarkColor).onChange((i) => {
                  this.plugin.settings.nestedTabsDifferentDarkColor = i;
                  this.plugin.saveSettings();
                  this.display();
              }));
              
            if (this.plugin.settings.nestedTabsDifferentDarkColor) {
                new Setting(t)
                  .setName(_("color_dark_name"))
                  .setDesc(_("color_dark_desc"))
                  .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsDelimiterColorDark).onChange((i) => {
                      this.plugin.settings.nestedTabsDelimiterColorDark = i;
                      this.plugin.saveSettings();
                  }))
                  .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsItemColorDark).onChange((i) => {
                      this.plugin.settings.nestedTabsItemColorDark = i;
                      this.plugin.saveSettings();
                  }));
            }

            new Setting(t).setHeading().setName(_("heading_nested_colors")).setDesc(_("heading_nested_colors_desc"));
            
            new Setting(t)
              .setName(_("nested_color_level_0_name"))
              .setDesc(_("nested_color_level_0_desc"))
              .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsColorLevel0 || "#4a90e2").onChange((i) => {
                  this.plugin.settings.nestedTabsColorLevel0 = i;
                  this.plugin.saveSettings();
              })).then((e) => this.addResetButton(e, "nestedTabsColorLevel0"));

            new Setting(t)
              .setName(_("nested_color_level_1_name"))
              .setDesc(_("nested_color_level_1_desc"))
              .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsColorLevel1 || "#50e3c2").onChange((i) => {
                  this.plugin.settings.nestedTabsColorLevel1 = i;
                  this.plugin.saveSettings();
              })).then((e) => this.addResetButton(e, "nestedTabsColorLevel1"));

            new Setting(t)
              .setName(_("nested_color_level_2_name"))
              .setDesc(_("nested_color_level_2_desc"))
              .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsColorLevel2 || "#f5a623").onChange((i) => {
                  this.plugin.settings.nestedTabsColorLevel2 = i;
                  this.plugin.saveSettings();
              })).then((e) => this.addResetButton(e, "nestedTabsColorLevel2"));

            new Setting(t)
              .setName(_("nested_color_level_3_name"))
              .setDesc(_("nested_color_level_3_desc"))
              .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsColorLevel3 || "#b8e986").onChange((i) => {
                  this.plugin.settings.nestedTabsColorLevel3 = i;
                  this.plugin.saveSettings();
              })).then((e) => this.addResetButton(e, "nestedTabsColorLevel3"));

            new Setting(t)
              .setName(_("nested_color_level_4_name"))
              .setDesc(_("nested_color_level_4_desc"))
              .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsColorLevel4 || "#bd10e0").onChange((i) => {
                  this.plugin.settings.nestedTabsColorLevel4 = i;
                  this.plugin.saveSettings();
              })).then((e) => this.addResetButton(e, "nestedTabsColorLevel4"));

            new Setting(t)
              .setName(_("nested_color_level_5plus_name"))
              .setDesc(_("nested_color_level_5plus_desc"))
              .addColorPicker((e) => e.setValue(this.plugin.settings.nestedTabsColorLevel5Plus || "#888888").onChange((i) => {
                  this.plugin.settings.nestedTabsColorLevel5Plus = i;
                  this.plugin.saveSettings();
              })).then((e) => this.addResetButton(e, "nestedTabsColorLevel5Plus"));
        }
        t.createEl("hr", { cls: "tabs-settings-divider" });

        // ==========================================
        // CATEGORY 7: VISTA PREVIA
        // ==========================================
        this.sampleTabs = new SettingsSampleTabs(this.plugin, this, t.createDiv());
        t.createEl("hr", { cls: "tabs-settings-divider" });

        // ==========================================
        // CATEGORY 8: ACERCA DE
        // ==========================================
        new Setting(t).setName(_("heading_info")).setHeading();
        new Setting(t)
          .setName(_("changelog_name"))
          .setDesc(_("changelog_desc"))
          .addButton((btn) => 
            btn
              .setButtonText(_("btn_changelog"))
              .onClick(() => {
                new ChangelogModal(this.app).open();
              })
          );
        
        // Restore scroll position
        setTimeout(() => { t.scrollTop = prevScroll; }, 0);
    }

    addResetButton(t, e, i = !0) {
      t.addExtraButton((n) =>
        n
          .setIcon("reset")
          .setTooltip($("settings.resetToDefault"))
          .onClick(() => {
            ((this.plugin.settings[e] = DEFAULT_SETTINGS[e]),
              (this.needRefresh = !0),
              this.plugin.saveSettings(),
              this.plugin.updateGlobalCssVariables(),
              i && this.display());
          }),
      );
    }
  }
