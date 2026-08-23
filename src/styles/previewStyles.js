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
`;
