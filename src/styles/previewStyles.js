export const tabsExtendedCorePreviewStyles = `
.tabs-container {
  --tabs-border-color: var(--background-modifier-border);
  --tabs-nav-item-active-color: var(--interactive-accent);
  --tabs-nav-item-hover-color: var(--background-modifier-border-hover);
  --p-spacing: .75em;
  display: flex;
  margin: 2px;
  flex-direction: column;
}
.markdown-source-view.is-readable-line-width .tabs-container {
  max-width: max(100%, var(--file-line-width));
}
.tabs-container .tabs-nav {
  display: inline-flex;
  width: 100%;
  justify-content: space-between;
}
.tabs-container .tabs-nav .tabs-nav-item-wrapper {
  display: flex;
  position: relative;
  margin-bottom: 0;
  overflow-x: auto;
  padding: 0;
}
.tabs-container .tabs-nav .tabs-nav-item-wrapper::-webkit-scrollbar {
  display: none;
}
.tabs-container:not(.tabs-nav-left):not(.tabs-nav-right) > .tabs-nav {
  display: flex;
  align-items: center;
}
.tabs-container:not(.tabs-nav-left):not(.tabs-nav-right) > .tabs-nav > .tabs-nav-item-wrapper {
  flex: 1 1 auto;
  min-width: 0;
}
.tabs-nav-overflow-arrow-right {
  display: none;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 22px;
  margin: auto 4px auto 2px;
  padding: 0;
  color: var(--text-faint, var(--text-muted, rgba(150, 150, 150, 0.6)));
  cursor: pointer;
  user-select: none;
  pointer-events: auto;
  z-index: 2;
  animation: tabs-ghost-arrow-blink 1.6s ease-in-out infinite;
}
.tabs-nav-overflow-arrow-right.is-visible {
  display: flex;
}
.tabs-nav-overflow-arrow-right svg {
  width: 11px;
  height: 11px;
  stroke: currentColor;
  display: block;
}
.tabs-nav-overflow-arrow-right:hover {
  color: var(--text-accent, var(--interactive-accent));
}
.tabs-container:is(.tabs-nav-left, .tabs-nav-right) > .tabs-nav > .tabs-nav-overflow-arrow-right {
  display: none !important;
}

@keyframes tabs-ghost-arrow-blink {
  0%, 100% {
    opacity: 0.18;
    transform: translateX(0);
  }
  50% {
    opacity: 0.85;
    transform: translateX(2px);
  }
}

@keyframes tabs-separator-overflow-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
.tabs-nav-item.tabs-separator-overflow-blink {
  animation: tabs-separator-overflow-blink 1.6s ease-in-out infinite !important;
}
.tabs-nav-item.tabs-separator-overflow-blink:hover {
  opacity: 1 !important;
}
.tabs-container .tabs-nav-item {
  position: relative;
  cursor: pointer;
  padding: 5px 16px;
  font-size: var(--horizontal-tab-font-size, 16px);
  font-weight: bold;
  user-select: none;
  white-space: nowrap;
  border-width: 0 0 3px;
  border-style: solid;
  border-color: transparent;
  transition: border-color .1s cubic-bezier(.4, 0, .2, 1);
}
.tabs-container .tabs-nav-item .tabs-nav-item-md {
  pointer-events: none;
}
.tabs-container .tabs-nav-item .tabs-nav-item-md p {
  margin: 0;
}
.tabs-container .tabs-nav .tabs-nav-item.tabs-nav-item-active {
  color: var(--tabs-nav-item-active-color);
  border-color: var(--tabs-nav-item-active-color);
}
.tabs-container .tabs-nav .tabs-nav-item:not(.tabs-nav-item-active, .tabs-nav-item-dragover):hover {
  border-color: var(--tabs-nav-item-hover-color);
}
.tabs-container .tabs-nav .tabs-nav-button {
  width: var(--icon-size);
  height: var(--icon-size);
  margin: auto 40px auto 15px;
  color: var(--text-muted);
  background-color: transparent;
  box-shadow: unset;
  opacity: 0;
  cursor: pointer;
  pointer-events: auto !important;
}
.tabs-container .tabs-nav .tabs-nav-button * {
  pointer-events: none;
}
.tabs-container:hover .tabs-nav .tabs-nav-button {
  opacity: 1;
}
.markdown-reading-view .tabs-container .tabs-nav .tabs-nav-button {
  display: none;
}
.tabs-container .tabs-contents {
  width: 100%;
  padding: var(--tabs-contents-padding, .25em 2em);
  overflow: auto;
}
.tabs-container .tabs-contents .tabs-content {
  display: none;
}
.tabs-container .tabs-contents .tabs-content.tabs-content-active {
  display: block;
}
.tabs-container .tabs-contents.tabs-contents-hidden {
  display: none;
}
.tabs-container.tabs-nav-top {
  flex-direction: column;
}
.tabs-container.tabs-nav-bottom {
  flex-direction: column-reverse;
}
.tabs-container.tabs-nav-left {
  flex-direction: row;
}
.tabs-container.tabs-nav-right {
  flex-direction: row-reverse;
}
.tabs-container:is(.tabs-nav-left, .tabs-nav-right) > .tabs-nav {
  display: flex;
  width: auto;
  max-width: 20%;
  flex-direction: column;
}
.tabs-container:is(.tabs-nav-left, .tabs-nav-right) > .tabs-nav > .tabs-nav-item-wrapper {
  flex-direction: column;
}
.tabs-container.tabs-nav-left > .tabs-nav > .tabs-nav-item-wrapper > .tabs-nav-item {
  border-width: 0 3px 0 0;
}
.tabs-container.tabs-nav-right > .tabs-nav > .tabs-nav-item-wrapper > .tabs-nav-item {
  border-width: 0 0 0 3px;
}
.tabs-container:is(.tabs-nav-left, .tabs-nav-right) .tabs-nav-item {
  font-size: var(--vertical-tab-font-size, 16px);
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: normal !important;
  overflow-wrap: normal !important;
  word-wrap: normal !important;
  hyphens: none !important;
  -webkit-hyphens: none !important;
}
.tabs-container:is(.tabs-nav-left, .tabs-nav-right) .tabs-nav-item .tabs-nav-item-md,
.tabs-container:is(.tabs-nav-left, .tabs-nav-right) .tabs-nav-item .tabs-nav-item-md :is(p, span, div, a, li, strong, em) {
  word-break: normal !important;
  overflow-wrap: normal !important;
  word-wrap: normal !important;
  hyphens: none !important;
  -webkit-hyphens: none !important;
}
.tabs-container.tabs-nav-multi > .tabs-nav > .tabs-nav-item-wrapper {
  flex-wrap: wrap;
}
.tabs-container > .tabs-contents {
  max-height: var(--tabs-max-height, 100%);
}
.tabs-container.tabs-border-always {
  box-shadow: 0 0 0 1px var(--tabs-border-color), inset 0 0 0 1px var(--tabs-border-color);
  border-radius: var(--radius-s);
}
.tabs-container.tabs-border-hover {
  box-shadow: none;
  border-radius: var(--radius-s);
}
.tabs-container.tabs-border-hover:hover {
  box-shadow: 0 0 0 1px var(--tabs-border-color), inset 0 0 0 1px var(--tabs-border-color);
}
.tabs-container.tabs-innertabs {
  margin: 10px 0;
}
.tabs-codeblock-wrapper {
  position: relative !important;
}
.tabs-codeblock-wrapper .edit-block-button {
  position: absolute !important;
  top: var(--size-2-2, 6px) !important;
  inset-inline-end: var(--size-2-2, 6px) !important;
  padding: var(--size-2-2, 4px) var(--size-2-3, 6px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0 !important;
  color: var(--text-muted) !important;
  border-radius: var(--radius-s, 4px) !important;
  cursor: pointer !important;
  z-index: 10 !important;
  background-color: var(--background-primary, rgba(30, 30, 30, 0.6)) !important;
  border: 1px solid var(--background-modifier-border, transparent) !important;
  transition: opacity 0.15s ease-in-out, color 0.15s ease-in-out, background-color 0.15s ease-in-out !important;
}
.tabs-codeblock-wrapper:hover .edit-block-button {
  opacity: 1 !important;
}
.tabs-codeblock-wrapper .edit-block-button:hover {
  color: var(--text-normal) !important;
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.3)) !important;
}
.tabs-codeblock-wrapper:has(.copy-code-button) .edit-block-button {
  inset-inline-end: 36px !important;
}
.tabs-codeblock-wrapper:has([class*="block-language-tree"]) > .edit-block-button,
.tabs-codeblock-wrapper:has(.ascii-tree-wrapper) > .edit-block-button,
.tabs-codeblock-wrapper:has(.tree-container) > .edit-block-button,
.tabs-codeblock-wrapper:has(pre.ascii-tree-block) > .edit-block-button,
.tabs-codeblock-wrapper:has(* .edit-block-button) > .edit-block-button {
  display: none !important;
}
.tabs-editor-modal .tabs-modal-codeblock-preview {
  margin: 0.75em 0 !important;
  position: relative !important;
  cursor: default !important;
  user-select: text !important;
  clear: both !important;
}
.tabs-editor-modal .tabs-modal-codeblock-content {
  overflow: auto !important;
}
/* Suppress edit and copy buttons inside diagram popups */
.popup-overlay .edit-block-button,
.popup-content .edit-block-button,
.popup-overlay .copy-code-button,
.popup-content .copy-code-button,
.popup-overlay .tabs-codeblock-wrapper .edit-block-button,
.popup-content .tabs-codeblock-wrapper .edit-block-button,
:is(.popup-overlay, .popup-content) :is(.edit-block-button, .copy-code-button, [class*="edit-block-button"]) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
/* Never display code-edit buttons on or adjacent to nested tabs blocks */
.tabs-innertabs > .edit-block-button,
.tabs-innertabs + .edit-block-button,
.tabs-innertabs ~ .edit-block-button,
.tabs-codeblock-wrapper:has(> .tabs-container) > .edit-block-button,
.tabs-codeblock-wrapper:has(> [class*="block-language-tabs"]) > .edit-block-button {
  display: none !important;
}
`;
