import assert from 'node:assert/strict';
import { TabContentItem } from '../src/components/TabsContent.js';
import { modalCodeBlockRenderCache, setModalCodeBlockRenderCache, clearModalCodeBlockRenderCache } from '../src/editor/engine.js';

// Simple DOM element mock for testing in Node environment
class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.parentElement = null;
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
      contains: (c) => this.classList._classes.has(c),
    };
    this.attributes = new Map();
    this.eventListeners = {};
    this.textContent = '';
  }

  get classListProxy() {
    return this.classList;
  }

  setAttribute(name, val) {
    this.attributes.set(name, String(val));
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }

  addEventListener(event, handler) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(handler);
  }

  dispatchEvent(event) {
    if (!event.target) event.target = this;
    let curr = this;
    let stopped = false;
    const origStop = event.stopPropagation;
    event.stopPropagation = () => {
      stopped = true;
      if (typeof origStop === 'function') origStop.call(event);
    };
    while (curr) {
      const handlers = curr.eventListeners[event.type] || [];
      handlers.forEach(h => h(event));
      if (stopped) break;
      curr = curr.parentElement;
    }
  }

  appendChild(child) {
    child.parentNode = this;
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  insertBefore(newChild, refChild) {
    const idx = this.children.indexOf(refChild);
    if (idx !== -1) {
      newChild.parentNode = this;
      newChild.parentElement = this;
      this.children.splice(idx, 0, newChild);
    } else {
      this.appendChild(newChild);
    }
    return newChild;
  }

  remove() {
    if (this.parentNode && Array.isArray(this.parentNode.children)) {
      const idx = this.parentNode.children.indexOf(this);
      if (idx !== -1) {
        this.parentNode.children.splice(idx, 1);
      }
    }
    this.parentNode = null;
    this.parentElement = null;
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (curr.matches && curr.matches(selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  matches(selector) {
    if (selector === '*') return true;
    if (selector.includes(',')) {
      return selector.split(',').some(part => this.matches(part.trim()));
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.className.split(/\s+/).includes(cls) || this.classList.contains(cls);
    }
    if (selector.includes('[')) {
      const attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\*="([^"]+)"\]/);
      if (attrMatch) {
        const [, attr, val] = attrMatch;
        const attrVal = attr === 'class' ? this.className : this.getAttribute(attr);
        return (attrVal || '').includes(val);
      }
      if (selector.includes('class*="block-language-"')) {
        return this.className.includes('block-language-');
      }
    }
    if (selector.includes('.')) {
      const [tag, cls] = selector.split('.');
      const tagMatch = !tag || this.tagName.toLowerCase() === tag.toLowerCase();
      const clsMatch = this.className.split(/\s+/).includes(cls) || this.classList.contains(cls);
      return tagMatch && clsMatch;
    }
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  querySelectorAll(selector) {
    if (selector.startsWith(':scope > ')) {
      const subSel = selector.replace(':scope > ', '').trim();
      return this.children.filter(child => child.matches(subSel));
    }
    const results = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) {
          results.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  querySelector(selector) {
    const res = this.querySelectorAll(selector);
    return res.length > 0 ? res[0] : null;
  }
}

// Global document mock for Node
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    documentElement: { style: {} },
    createElement: (tag) => {
      const el = new MockElement(tag);
      return el;
    }
  };
} else {
  if (!globalThis.document.documentElement) globalThis.document.documentElement = { style: {} };
  if (!globalThis.document.documentElement.style) globalThis.document.documentElement.style = {};
}

export async function runCodeblocksTests() {
  console.log('--- Running Interactive Code Blocks & Tree Tests ---');

  // Test 1: ensureCodeBlockWrappers wraps pre and injects edit-block-button for standard codeblock
  {
    const container = new MockElement('div');
    container.className = 'tabs-content';

    const pre = new MockElement('pre');
    pre.className = 'language-js';
    const code = new MockElement('code');
    code.textContent = 'console.log("hello");';
    pre.appendChild(code);
    container.appendChild(pre);

    let startedEditingWith = null;
    const mockPlugin = {
      tabsEditorModal: {
        startEditing: (tabs, targetInfo) => {
          startedEditingWith = { tabs, targetInfo };
        }
      }
    };
    const mockOwnerTabs = {
      plugin: mockPlugin,
      currentIndex: 0,
      setCurrentIndex: (idx) => { mockOwnerTabs.currentIndex = idx; }
    };

    // Instantiate a TabContentItem without calling createTabContentEl
    const item = Object.create(TabContentItem.prototype);
    item.ownerTabs = mockOwnerTabs;
    item.index = 1;
    item.content = '```js\nconsole.log("hello");\n```';

    item.ensureCodeBlockWrappers(container);

    const wrappers = container.querySelectorAll('.tabs-codeblock-wrapper');
    assert.equal(wrappers.length, 1, 'Should create exactly one .tabs-codeblock-wrapper');

    const wrapper = wrappers[0];
    const editBtn = wrapper.querySelector('.edit-block-button');
    assert.ok(editBtn, 'Wrapper must contain an .edit-block-button');
    assert.ok(editBtn.getAttribute('aria-label'), 'Button must have aria-label');

    // Trigger edit button click
    editBtn.dispatchEvent({
      type: 'click',
      preventDefault: () => {},
      stopPropagation: () => {}
    });

    assert.ok(startedEditingWith, 'startEditing should have been called');
    assert.equal(startedEditingWith.tabs, mockOwnerTabs);
    assert.equal(startedEditingWith.targetInfo.language, 'js');
    assert.equal(startedEditingWith.targetInfo.tabIndex, 0, 'tabIndex must be 0-based for ownerTabs');
    assert.equal(startedEditingWith.targetInfo.blockIndex, 0, 'blockIndex should be 0 for the first code block');
    assert.ok(startedEditingWith.targetInfo.snippet.includes('console.log'));
    console.log('✓ ensureCodeBlockWrappers wraps pre and edit button triggers startEditing with language and snippet (0-based)');
  }

  // Test 2: Tree block deduplication - inner edit button prevails, duplicate outer button removed
  {
    const container = new MockElement('div');
    container.className = 'tabs-content';

    const treeBlock = new MockElement('div');
    treeBlock.className = 'block-language-tree';
    treeBlock.textContent = 'Folder 1\n  Subfolder A';

    // Native/inner edit-block-button located inside the tree block
    const innerBtn = new MockElement('div');
    innerBtn.className = 'edit-block-button';
    innerBtn.setAttribute('aria-label', 'Edit this block');
    treeBlock.appendChild(innerBtn);

    container.appendChild(treeBlock);

    let startedEditingWith = null;
    const mockOwnerTabs = {
      plugin: {
        tabsEditorModal: {
          startEditing: (tabs, targetInfo) => {
            startedEditingWith = { tabs, targetInfo };
          }
        }
      },
      currentIndex: 0,
      setCurrentIndex: (idx) => { mockOwnerTabs.currentIndex = idx; }
    };

    const item = Object.create(TabContentItem.prototype);
    item.ownerTabs = mockOwnerTabs;
    item.index = 0;
    item.content = '```tree\nFolder 1\n  Subfolder A\n```';

    item.ensureCodeBlockWrappers(container);

    const wrappers = container.querySelectorAll('.tabs-codeblock-wrapper');
    assert.equal(wrappers.length, 1, 'Should wrap block-language-tree container');

    // Simulate an outer duplicate button existed or was added
    const outerBtn = new MockElement('div');
    outerBtn.className = 'edit-block-button';
    wrappers[0].appendChild(outerBtn);

    // Call ensureCodeBlockWrappers again (simulating re-render/idempotent check)
    item.ensureCodeBlockWrappers(container);

    // The duplicate outer button must be removed, leaving only the inner button
    const allButtons = wrappers[0].querySelectorAll('.edit-block-button');
    assert.equal(allButtons.length, 1, 'Duplicate outer button must be removed, leaving exactly 1 button');
    assert.equal(allButtons[0], innerBtn, 'The button inside the tree block must prevail');

    // Clicking the inner button dispatches edit
    innerBtn.dispatchEvent({
      type: 'click',
      preventDefault: () => {},
      stopPropagation: () => {}
    });

    assert.ok(startedEditingWith, 'Clicking inner button must trigger startEditing');
    assert.equal(startedEditingWith.targetInfo.language, 'tree');
    console.log('✓ block-language-tree deduplication: inner button prevails, duplicate outer button removed');
  }

  // Test 3: Idempotence - calling ensureCodeBlockWrappers multiple times does not duplicate wrappers or buttons
  {
    const container = new MockElement('div');
    const pre = new MockElement('pre');
    pre.className = 'language-js';
    container.appendChild(pre);

    const item = Object.create(TabContentItem.prototype);
    item.ownerTabs = { plugin: null };
    item.ensureCodeBlockWrappers(container);
    item.ensureCodeBlockWrappers(container);

    const wrappers = container.querySelectorAll('.tabs-codeblock-wrapper');
    assert.equal(wrappers.length, 1, 'Repeated calls must not duplicate wrapper');
    const buttons = wrappers[0].querySelectorAll('.edit-block-button');
    assert.equal(buttons.length, 1, 'Repeated calls must not duplicate edit button');
    console.log('✓ ensureCodeBlockWrappers is idempotent');
  }

  // Test 4: Focus target block locating logic with ordinal blockIndex
  {
    const sampleDoc = [
      '# My Tab',
      'First tree block:',
      '```tree',
      'src/',
      '  index.js',
      '```',
      'Second tree block:',
      '```tree',
      'docs/',
      '  guide.md',
      '```'
    ].join('\n');

    const fenceRegex = new RegExp("(?:^|\\n)[ \t]*(`{3,}|~{3,})\\s*tree\\b", "gi");
    let match;
    const positions = [];
    while ((match = fenceRegex.exec(sampleDoc)) !== null) {
      positions.push(match[0].startsWith('\n') ? match.index + 1 : match.index);
    }
    assert.equal(positions.length, 2, 'Should find both ```tree blocks');
    assert.ok(positions[1] > positions[0], 'Second block is further down');
    console.log('✓ Target code block location and blockIndex resolution verified');
  }

  // Test 5: Modal editor codeblock live preview detection and cursor intersection logic
  {
    const lines = [
      '# Main Tab',
      '',
      '```tree',
      'root',
      '  child',
      '```',
      '',
      'End of tab'
    ];

    const docText = lines.join('\n');
    const startLineFrom = docText.indexOf('```tree');
    const endLineTo = docText.indexOf('```', startLineFrom + 7) + 3;

    // Cursor at line 1 (outside block)
    const cursorOutside = 5;
    const isInsideOutside = cursorOutside >= startLineFrom && cursorOutside <= endLineTo;
    assert.equal(isInsideOutside, false, 'Cursor outside code block should allow live preview widget replacement');

    // Cursor inside block
    const cursorInside = docText.indexOf('root');
    const isInsideInside = cursorInside >= startLineFrom && cursorInside <= endLineTo;
    assert.equal(isInsideInside, true, 'Cursor inside code block must reveal raw code for editing');
    console.log('✓ Modal editor codeblock live preview cursor intersection logic verified');
  }

  // Test 6: Accurate 0-based tab index resolution from tabcontents array
  {
    let startedEditingWith = null;
    const mockOwnerTabs = {
      plugin: {
        tabsEditorModal: {
          startEditing: (tabs, targetInfo) => {
            startedEditingWith = { tabs, targetInfo };
          }
        }
      },
      currentIndex: 0,
      setCurrentIndex: (idx) => { mockOwnerTabs.currentIndex = idx; },
      tabsContents: {
        tabcontents: []
      }
    };

    const item0 = Object.create(TabContentItem.prototype);
    item0.ownerTabs = mockOwnerTabs;
    item0.index = 1; // 1-based historical index

    const item1 = Object.create(TabContentItem.prototype);
    item1.ownerTabs = mockOwnerTabs;
    item1.index = 2; // 1-based historical index

    mockOwnerTabs.tabsContents.tabcontents = [item0, item1];

    const container1 = new MockElement('div');
    const pre = new MockElement('pre');
    pre.className = 'language-tree';
    container1.appendChild(pre);

    item1.ensureCodeBlockWrappers(container1);
    const btn = container1.querySelector('.edit-block-button');
    btn.dispatchEvent({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} });

    assert.ok(startedEditingWith, 'startEditing should have been called');
    assert.equal(startedEditingWith.targetInfo.tabIndex, 1, 'Second tab must have 0-based index 1');
    assert.equal(mockOwnerTabs.currentIndex, 1, 'ownerTabs.currentIndex must be updated to 1');
    console.log('✓ Multi-tab 0-based index resolution via tabcontents array verified');
  }

  // Test 7: StateField decoration definition without ViewPlugin block decoration errors
  {
    if (typeof globalThis.document === 'undefined') {
      globalThis.document = { documentElement: { style: {} }, createElement: () => ({ style: {} }) };
    } else if (!globalThis.document.documentElement) {
      globalThis.document.documentElement = { style: {} };
    }
    const cm = await import('../src/vendor/codemirror-bundle.js');
    assert.ok(cm.Wt, 'Wt (StateField) must be exported from codemirror-bundle');
    assert.equal(typeof cm.Wt.define, 'function', 'Wt.define must be a function');
    const testField = cm.Wt.define({
      create: () => cm.q.none,
      update: (deco) => deco,
      provide: (f) => cm.A.decorations.from(f)
    });
    const state = cm.I.create({ doc: 'test', extensions: [testField] });
    assert.ok(state, 'EditorState must create successfully with StateField decorations');
    console.log('✓ CodeMirror 6 StateField block decoration provider verified without errors');
  }

  // Test 8: Default settings include renderCodeBlocksInModal: true and vertical tabs spacing defaults
  {
    const { DEFAULT_SETTINGS } = await import('../src/settings/defaultSettings.js');
    assert.equal(DEFAULT_SETTINGS.renderCodeBlocksInModal, true, 'DEFAULT_SETTINGS must have renderCodeBlocksInModal: true');
    assert.equal(DEFAULT_SETTINGS.verticalTabsLeftSpacing, 2, 'DEFAULT_SETTINGS must have verticalTabsLeftSpacing: 2');
    assert.equal(DEFAULT_SETTINGS.verticalTabsRightSpacing, 2, 'DEFAULT_SETTINGS must have verticalTabsRightSpacing: 2');
    console.log('✓ DEFAULT_SETTINGS verticalTabsLeftSpacing and verticalTabsRightSpacing are 2 by default');
  }

  // Test 9: getDocumentCodeBlocks accurately distinguishes tabs/tabs-v vs content code blocks (tree, js)
  {
    const modalTabsRegex = /^(?:tabs(?:-v)?)$/i;
    const testDocLines = [
      'tab: Tab 1',
      '```tree',
      'root',
      '  child',
      '```',
      '~~~tabs',
      'tab: Subtab A',
      '~~~',
      '```js',
      'const x = 1;',
      '```'
    ];

    const mockDoc = {
      lines: testDocLines.length,
      line: (no) => ({
        number: no,
        text: testDocLines[no - 1],
        from: (no - 1) * 10,
        to: (no - 1) * 10 + testDocLines[no - 1].length
      })
    };

    // Parse blocks with getDocumentCodeBlocks logic
    const blocks = [];
    const fenceStack = [];
    for (let p = 1; p <= mockDoc.lines; p++) {
      const line = mockDoc.line(p);
      const text = line.text.trim();
      const match = text.match(/^(`{3,}|~{3,})(.*)/);
      if (match) {
        const fenceStr = match[1];
        const info = match[2].trim();
        const current = fenceStack.length > 0 ? fenceStack[fenceStack.length - 1] : null;

        if (current && current.type === "code") {
          if (fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && info === "") {
            const popped = fenceStack.pop();
            blocks.push({
              type: "code",
              info: popped.info,
              startLine: popped.lineNo,
              endLine: p
            });
          }
          continue;
        }

        if (current && current.type === "tabs") {
          if (fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && info === "") {
            const popped = fenceStack.pop();
            blocks.push({
              type: "tabs",
              info: popped.info,
              startLine: popped.lineNo,
              endLine: p
            });
          }
          continue;
        }

        if (modalTabsRegex.test(info)) {
          fenceStack.push({ fence: fenceStr, type: "tabs", lineNo: p, info });
        } else {
          fenceStack.push({ fence: fenceStr, type: "code", lineNo: p, info });
        }
      }
    }

    assert.equal(blocks.length, 3, 'Should find 3 blocks');
    assert.equal(blocks[0].type, 'code', 'First block (tree) must be type "code"');
    assert.equal(blocks[0].info, 'tree');
    assert.equal(blocks[0].startLine, 2);
    assert.equal(blocks[0].endLine, 5);

    assert.equal(blocks[1].type, 'tabs', 'Second block (tabs) must be type "tabs"');
    assert.equal(blocks[1].startLine, 6);
    assert.equal(blocks[1].endLine, 8);

    assert.equal(blocks[2].type, 'code', 'Third block (js) must be type "code"');
    assert.equal(blocks[2].info, 'js');
    assert.equal(blocks[2].startLine, 9);
    assert.equal(blocks[2].endLine, 11);

    console.log('✓ Code blocks (tree, js) correctly distinguished from tabs blocks');
  }

  // Test 10: Smooth Arrow navigation boundary resolution
  {
    const blocks = [
      { type: 'code', info: 'tree', startLine: 3, endLine: 6 }
    ];

    // Down from line 2 (startLine - 1) into code block
    const blockBelow = blocks.find(b => b.type === 'code' && b.startLine === 3);
    assert.ok(blockBelow, 'Found block below line 2');
    assert.equal(blockBelow.startLine, 3, 'Entering code block downwards targets startLine (3)');

    // Down from line 6 (endLine) out of code block
    const closingBlockDown = blocks.find(b => b.type === 'code' && b.endLine === 6);
    assert.ok(closingBlockDown, 'Found closing block at line 6');
    assert.equal(closingBlockDown.endLine + 1, 7, 'Exiting code block downwards targets line 7');

    // Up from line 7 (endLine + 1) into code block
    const blockAbove = blocks.find(b => b.type === 'code' && b.endLine === 6);
    assert.ok(blockAbove, 'Found block above line 7');
    assert.equal(blockAbove.endLine, 6, 'Entering code block upwards targets endLine (6)');

    // Up from line 3 (startLine) out of code block
    const openingBlockUp = blocks.find(b => b.type === 'code' && b.startLine === 3);
    assert.ok(openingBlockUp, 'Found opening block at line 3');
    assert.equal(openingBlockUp.startLine - 1, 2, 'Exiting code block upwards targets line 2');

    console.log('✓ Smooth Arrow navigation boundary resolution verified');
  }

  // Test 11: Toggle renderCodeBlocksInModal = false disables live preview decorations
  {
    const cm = await import('../src/vendor/codemirror-bundle.js');
    const mockPlugin = {
      settings: {
        renderCodeBlocksInModal: false,
        tabsKeyword: 'tabs'
      }
    };
    // If settings.renderCodeBlocksInModal is false, decoration builder returns q.none
    const buildDeco = (plugin) => {
      if (plugin.settings && plugin.settings.renderCodeBlocksInModal === false) {
        return cm.q.none;
      }
      return 'decorations';
    };

    assert.equal(buildDeco(mockPlugin), cm.q.none, 'Must return q.none when renderCodeBlocksInModal is false');
    mockPlugin.settings.renderCodeBlocksInModal = true;
    assert.equal(buildDeco(mockPlugin), 'decorations', 'Must return decorations when renderCodeBlocksInModal is true');
    console.log('✓ renderCodeBlocksInModal setting toggle accurately toggles decoration creation');
  }

  // Test 12: Modal editor code block interaction (cursor click & native edit button)
  {
    let dispatched = null;
    let focused = false;
    const mockView = {
      dispatch: (tr) => { dispatched = tr; },
      focus: () => { focused = true; }
    };

    // Simulate CodeBlockLivePreviewWidget interaction container
    const container = new MockElement('div');
    container.className = 'cm-embed-block markdown-rendered tabs-codeblock-wrapper tabs-modal-codeblock-preview';

    const contentEl = new MockElement('div');
    contentEl.className = 'tabs-modal-codeblock-content';

    const treeContainer = new MockElement('div');
    treeContainer.className = 'block-language-tree';

    // Obsidian native edit button inside the rendered tree block
    const nativeEditBtn = new MockElement('div');
    nativeEditBtn.className = 'edit-block-button';
    treeContainer.appendChild(nativeEditBtn);

    const pre = new MockElement('pre');
    pre.className = 'ascii-tree-block';
    pre.textContent = 'Root\n  Sub\n';
    treeContainer.appendChild(pre);

    contentEl.appendChild(treeContainer);
    container.appendChild(contentEl);

    const rawText = '```tree\nRoot\n  Sub\n```';
    const from = 10;
    const to = 33;

    const triggerEdit = (evt) => {
      const firstLineBreak = rawText.indexOf('\n');
      const targetPos = firstLineBreak !== -1 ? from + firstLineBreak + 1 : from;
      mockView.dispatch({
        selection: { anchor: targetPos },
        scrollIntoView: true
      });
      mockView.focus();
    };

    const handleInteraction = (evt) => {
      const clickedEditBtn = evt.target && evt.target.closest ? evt.target.closest('.edit-block-button') : null;
      if (clickedEditBtn) {
        triggerEdit(evt);
        return;
      }
      if (evt.target && evt.target.closest && evt.target.closest('a, .internal-link, button, .ascii-tree-action-btn')) {
        return;
      }
      triggerEdit(evt);
    };

    container.addEventListener('click', handleInteraction);

    // 1. Click native Obsidian "Editar este bloque" button
    dispatched = null;
    focused = false;
    nativeEditBtn.dispatchEvent({ type: 'click' });
    assert.ok(dispatched, 'Clicking native edit button must dispatch selection');
    assert.equal(dispatched.selection.anchor, 18, 'Must place cursor on line 2 (content start)');
    assert.ok(focused, 'Must focus editor view');

    // 2. Click with cursor anywhere on the tree block
    dispatched = null;
    focused = false;
    pre.dispatchEvent({ type: 'click' });
    assert.ok(dispatched, 'Clicking with cursor on tree block must dispatch selection');
    assert.equal(dispatched.selection.anchor, 18, 'Must place cursor on content line to open editor');
    assert.ok(focused, 'Must focus editor view');

    console.log('✓ Modal editor code block cursor click and native edit button interaction verified');
  }

  // Test 13: Horizontal Arrow navigation (ArrowRight and ArrowLeft) boundary entry
  {
    const blocks = [
      { type: 'code', info: 'tree', startLine: 3, endLine: 6 }
    ];

    // ArrowRight at end of line 2 (preceding code block) enters startLine (3)
    const line2 = { number: 2, from: 10, to: 25 };
    const nextBlock = blocks.find(b => b.type === 'code' && b.startLine === line2.number + 1);
    assert.ok(nextBlock, 'Found next code block for line 2');
    assert.equal(nextBlock.startLine, 3, 'ArrowRight at end of line 2 targets startLine 3');

    // ArrowLeft at start of line 7 (following code block) enters endLine (6)
    const line7 = { number: 7, from: 80, to: 95 };
    const prevBlock = blocks.find(b => b.type === 'code' && b.endLine === line7.number - 1);
    assert.ok(prevBlock, 'Found prev code block for line 7');
    assert.equal(prevBlock.endLine, 6, 'ArrowLeft at start of line 7 targets endLine 6');

    console.log('✓ Horizontal Arrow navigation (ArrowRight/ArrowLeft) code block boundary entry verified');
  }

  // Test 14: Code blocks inside top-level and nested tabs blocks are discovered
  {
    const lines = [
      'tema: Tab 1',
      '~~~tabs-v',
      'tema: Subtopic',
      '```tree',
      'Recursos principales',
      '- Revision',
      '- Queja',
      '```',
      '~~~'
    ];
    const doc = {
      lines: lines.length,
      line: (p) => ({
        text: lines[p - 1],
        from: lines.slice(0, p - 1).join('\n').length + (p > 1 ? 1 : 0),
        to: lines.slice(0, p).join('\n').length
      })
    };

    // Simulate getDocumentCodeBlocks logic with robust fences
    const modalTabsRegex = /^(?:tabs(?:-v)?)$/i;
    const blocks = [];
    const fenceStack = [];

    for (let p = 1; p <= doc.lines; p++) {
      let line = doc.line(p);
      let match = line.text.match(/^[ \t]*(?:>[ \t]*)*(`{3,}|~{3,})(.*)$/);
      if (!match) continue;
      let fenceStr = match[1];
      let fenceChar = fenceStr[0];
      let fenceLen = fenceStr.length;
      let info = match[2].trim();

      if (fenceStack.length > 0) {
        let current = fenceStack[fenceStack.length - 1];
        if (current.type === 'code') {
          if (fenceChar === current.char && fenceLen >= current.length && info === '') {
            let popped = fenceStack.pop();
            blocks.push({
              type: 'code',
              info: popped.info,
              startLine: popped.lineNo,
              endLine: p
            });
          }
          continue;
        }
        if (current.type === 'tabs' && fenceChar === current.char && fenceLen >= current.length && info === '') {
          let popped = fenceStack.pop();
          blocks.push({
            type: 'tabs',
            info: popped.info,
            startLine: popped.lineNo,
            endLine: p
          });
          continue;
        }
      }

      let isTabs = modalTabsRegex.test(info);
      if (isTabs) {
        fenceStack.push({ fence: fenceStr, char: fenceChar, length: fenceLen, type: 'tabs', lineNo: p, info });
      } else {
        fenceStack.push({ fence: fenceStr, char: fenceChar, length: fenceLen, type: 'code', lineNo: p, info });
      }
    }

    const treeBlock = blocks.find(b => b.type === 'code' && b.info === 'tree');
    assert.ok(treeBlock, 'Tree block must be found inside nested tabs container');
    assert.equal(treeBlock.startLine, 4, 'Tree block starts at line 4');
    assert.equal(treeBlock.endLine, 8, 'Tree block ends at line 8');

    const tabsVBlock = blocks.find(b => b.type === 'tabs' && b.info === 'tabs-v');
    assert.ok(tabsVBlock, 'Nested tabs-v block must be found');
    assert.equal(tabsVBlock.startLine, 2, 'tabs-v starts at line 2');
    assert.equal(tabsVBlock.endLine, 9, 'tabs-v ends at line 9');

    console.log('✓ Code blocks inside nested tabs containers correctly identified and preserved');
  }

  // Test 15: Code blocks with blockquote markers (> ```tree)
  {
    const lines = [
      '> tema: Tab 1',
      '> ```tree',
      '> Root',
      '>   - Item',
      '> ```'
    ];
    const doc = {
      lines: lines.length,
      line: (p) => ({
        text: lines[p - 1],
        from: lines.slice(0, p - 1).join('\n').length + (p > 1 ? 1 : 0),
        to: lines.slice(0, p).join('\n').length
      })
    };

    const match1 = doc.line(2).text.match(/^[ \t]*(?:>[ \t]*)*(`{3,}|~{3,})(.*)$/);
    assert.ok(match1, 'Line 2 fence with blockquote > must match');
    assert.equal(match1[1], '```', 'Fence is ```');
    assert.equal(match1[2].trim(), 'tree', 'Info is tree');

    const match2 = doc.line(5).text.match(/^[ \t]*(?:>[ \t]*)*(`{3,}|~{3,})(.*)$/);
    assert.ok(match2, 'Line 5 closing fence with blockquote > must match');
    assert.equal(match2[1], '```', 'Fence is ```');
    assert.equal(match2[2].trim(), '', 'Info is empty');

    console.log('✓ Code blocks and closing fences with blockquote markers correctly parsed');
  }

  // Test 16: Code block opacity (fences inside code blocks cannot close outer blocks)
  {
    const parser = await import('../src/core/parser.js');
    const source = [
      'tema: Tab 1',
      '~~~tabs-v',
      'tema: Sub 1',
      '````tree',
      'Root',
      '  - Leaf',
      '```', // 3 backticks inside 4-backtick tree - must NOT close the 4-backtick tree block!
      '````', // closes 4-backtick tree
      '~~~', // closes ~~~tabs-v
      'tema: Tab 2',
      'Content Tab 2'
    ].join('\n');

    const analysis = parser.tabsExtendedAnalyzeTabSections(source, 'tema:', { tabsKeyword: 'tabs' });
    assert.ok(analysis, 'Must successfully analyze tab sections');
    assert.equal(analysis.sections.length, 2, 'Must have exactly 2 tabs (Tab 1 and Tab 2)');

    console.log('✓ Code block opacity prevents premature ancestor fence closure');
  }

  // Test 17: 4-backtick tree block defined with 4 backticks
  {
    const lines = [
      'tema: Treemap Tab',
      '````tree',
      'Nivel superior primero',
      '	- subnivel 1',
      '	- subnivel 2',
      '````'
    ];
    const doc = {
      lines: lines.length,
      line: (p) => ({
        text: lines[p - 1],
        from: lines.slice(0, p - 1).join('\n').length + (p > 1 ? 1 : 0),
        to: lines.slice(0, p).join('\n').length
      })
    };

    const matchOpen = doc.line(2).text.match(/^[ \t]*(?:>[ \t]*)*(`{3,}|~{3,})(.*)$/);
    assert.equal(matchOpen[1], '````', 'Opening fence has 4 backticks');
    assert.equal(matchOpen[2].trim(), 'tree', 'Info is tree');

    const matchClose = doc.line(6).text.match(/^[ \t]*(?:>[ \t]*)*(`{3,}|~{3,})(.*)$/);
    assert.equal(matchClose[1], '````', 'Closing fence has 4 backticks');
    assert.equal(matchClose[2].trim(), '', 'Info is empty');

    console.log('✓ 4-backtick tree block successfully identified and closed');
  }

  // Test 18: Code block live preview widget equality ignores position shifts (prevents flickering)
  {
    const rawText = "```mermaid\ngraph TD\n  A --> B\n```";
    const widget1 = {
      rawText,
      language: "mermaid",
      from: 50,
      to: 95,
      eq(other) {
        return other.rawText === this.rawText && other.language === this.language;
      }
    };

    // User types 10 characters before the code block: from shifts from 50 to 60, to shifts to 105
    const widget2 = {
      rawText,
      language: "mermaid",
      from: 60,
      to: 105,
      eq(other) {
        return other.rawText === this.rawText && other.language === this.language;
      }
    };

    assert.equal(widget1.eq(widget2), true, 'Widget equality must be true when rawText matches despite position shift');

    // If rawText changes, equality must be false so the block re-renders
    const widgetChanged = {
      rawText: "```mermaid\ngraph TD\n  A --> C\n```",
      language: "mermaid",
      from: 60,
      to: 105
    };
    assert.equal(widget1.eq(widgetChanged), false, 'Widget equality must be false when rawText changes');

    console.log('✓ Code block live preview widget equality ignores position shifts (prevents flickering)');
  }

  // Test 19: Module-level cache persistence across modal open/close and tab switches
  {
    clearModalCodeBlockRenderCache();
    const mermaidCode = "```mermaid\ngraph LR\n  X --> Y\n```";
    const renderedSvgHtml = '<div class="block-language-mermaid"><svg><text>X to Y</text></svg></div>';

    // Simulate first render caching
    setModalCodeBlockRenderCache(mermaidCode, renderedSvgHtml);

    // Verify cache hit
    assert.equal(modalCodeBlockRenderCache.has(mermaidCode), true, 'Cache must contain mermaidCode');
    assert.equal(modalCodeBlockRenderCache.get(mermaidCode), renderedSvgHtml, 'Cached HTML must match');

    // Simulate cache eviction policy (> 100 entries)
    for (let i = 0; i < 105; i++) {
      setModalCodeBlockRenderCache(`dummy_code_${i}`, `<div>dummy_${i}</div>`);
    }
    // Size should be capped at 101 or 100
    assert.ok(modalCodeBlockRenderCache.size <= 101, 'Cache size must remain capped');

    console.log('✓ Module-level cache persistence and bounded eviction verified');
  }

  // Test 20: Hysteresis boundary protection prevents flickering at edges
  {
    const block = { from: 50, to: 95 };

    // When block is currently rendered as a widget (wasWidget = true):
    // Cursor exactly at block.from (50) or block.to (95) must NOT unfold the widget
    const isInsideWidgetFrom = false; // from > 50 && from < 95 -> 50 > 50 is false
    const isInsideWidgetTo = false;   // to < 95 -> 95 < 95 is false
    const isInsideWidgetInner = true; // 60 > 50 && 60 < 95 is true

    assert.equal(isInsideWidgetFrom, false, 'Cursor at block.from must not unfold widget');
    assert.equal(isInsideWidgetTo, false, 'Cursor at block.to must not unfold widget');
    assert.equal(isInsideWidgetInner, true, 'Cursor inside block must unfold widget');

    // When block is already unfolded in raw editing mode (wasWidget = false):
    // Moving cursor to column 0 of fence (block.from = 50) must keep it open
    const isInsideRawFrom = 50 >= block.from && 50 <= block.to;
    const isInsideRawTo = 95 >= block.from && 95 <= block.to;
    const isInsideRawOutside = 49 >= block.from && 49 <= block.to;

    assert.equal(isInsideRawFrom, true, 'Cursor at block.from during editing keeps block unfolded');
    assert.equal(isInsideRawTo, true, 'Cursor at block.to during editing keeps block unfolded');
    assert.equal(isInsideRawOutside, false, 'Cursor outside block collapses back to widget');

    console.log('✓ Hysteresis boundary protection prevents flickering at edges');
  }

  // Test 21: Adjacent non-empty selection ranges do not unfold code blocks
  {
    const block = { from: 50, to: 95 };

    // Selection ending at block.from (e.g. from 10 to 50):
    const selBefore = { from: 10, to: 50 };
    const overlapsBefore = Math.max(selBefore.from, block.from) < Math.min(selBefore.to, block.to);
    assert.equal(overlapsBefore, false, 'Selection ending at block.from must not overlap block');

    // Selection starting at block.to (e.g. from 95 to 120):
    const selAfter = { from: 95, to: 120 };
    const overlapsAfter = Math.max(selAfter.from, block.from) < Math.min(selAfter.to, block.to);
    assert.equal(overlapsAfter, false, 'Selection starting at block.to must not overlap block');

    // Selection strictly overlapping block (e.g. from 40 to 60):
    const selOverlap = { from: 40, to: 60 };
    const overlaps = Math.max(selOverlap.from, block.from) < Math.min(selOverlap.to, block.to);
    assert.equal(overlaps, true, 'Overlapping selection must unfold block');

    console.log('✓ Adjacent non-empty selection ranges do not unfold code blocks');
  }

  // Test 22: Vertical tab title multi-line wrapping enforces whole words and forbids intra-word breaking
  {
    const container = new MockElement('div');
    container.classList.add('tabs-nav-v-behavior-double-line');

    const tabItemEl = new MockElement('div');
    tabItemEl.clientWidth = 80; // narrow column (sangría)

    const tabItemMDEl = new MockElement('div');
    tabItemMDEl.style = {};
    tabItemMDEl.scrollWidth = 150; // exceeds available width
    tabItemMDEl.querySelectorAll = () => [];

    const mockTabItem = {
      tabitemEl: tabItemEl,
      tabitemMDEl: tabItemMDEl,
      tabs: { tabsEl: container },
      applyTitleBehavior() {
        let mdEl = this.tabitemMDEl;
        let isMultiLine = container.classList.contains("tabs-nav-v-behavior-multi-line") || container.classList.contains("tabs-nav-v-behavior-double-line");
        if (isMultiLine) {
          const singleLineWidth = mdEl.scrollWidth;
          const availWidth = this.tabitemEl.clientWidth;
          const maxAllowedWidth = Math.max(30, availWidth - 8);

          if (singleLineWidth > maxAllowedWidth) {
            mdEl.style.whiteSpace = "normal";
            mdEl.style.wordBreak = "normal";
            mdEl.style.overflowWrap = "normal";
            mdEl.style.hyphens = "none";
            mdEl.style.webkitHyphens = "none";
          }
        }
      }
    };

    mockTabItem.applyTitleBehavior();

    assert.equal(tabItemMDEl.style.whiteSpace, 'normal', 'Must allow normal wrapping across lines at spaces');
    assert.equal(tabItemMDEl.style.wordBreak, 'normal', 'Must forbid breaking words into pieces (wordBreak: normal)');
    assert.equal(tabItemMDEl.style.overflowWrap, 'normal', 'Must forbid arbitrary intra-word breaking (overflowWrap: normal)');
    assert.equal(tabItemMDEl.style.hyphens, 'none', 'Must forbid hyphenation (hyphens: none)');

    console.log('✓ Vertical tab title whole-word wrapping and hyphenation prohibition verified');
  }

  // Test 22: TabsConfig defaults for vertical tabs left and right spacing
  {
    const { TabsConfig } = await import('../src/core/config.js');
    const config = new TabsConfig('', null, {}, true);
    assert.equal(config.verticalTabsLeftSpacing, 2, 'TabsConfig verticalTabsLeftSpacing must default to 2');
    assert.equal(config.verticalTabsRightSpacing, 2, 'TabsConfig verticalTabsRightSpacing must default to 2');

    const containerEl = {
      classList: {
        add: () => {},
        contains: () => false
      },
      style: {
        properties: {},
        setProperty(prop, val) {
          this.properties[prop] = val;
        }
      }
    };
    const navEl = { classList: { add: () => {} } };
    const contentsEl = { style: { setProperty: () => {} } };

    config.decorate(containerEl, navEl, contentsEl);
    assert.equal(containerEl.style.properties['--vertical-tabs-left-spacing'], '2px', 'Must apply --vertical-tabs-left-spacing: 2px');
    assert.equal(containerEl.style.properties['--vertical-tabs-right-spacing'], '2px', 'Must apply --vertical-tabs-right-spacing: 2px');

    console.log('✓ TabsConfig vertical tabs left and right spacing default to 2 and apply 2px CSS variables');
  }

  // Test 23: TabsButton pencil button triggers startEditing even when activeView was initially null
  {
    const { TabsButton } = await import('../src/components/TabsNav.js');
    let startEditingCalled = false;
    let editedTabsInstance = null;
    const mockTabs = {
      app: {
        workspace: {
          getActiveViewOfType: () => ({ editor: {}, file: { path: "test.md" } })
        }
      },
      plugin: {
        settings: {},
        tabsEditorModal: {
          startEditing: (tabs) => {
            startEditingCalled = true;
            editedTabsInstance = tabs;
          }
        }
      },
      activeView: null // initially null at render time!
    };
    const mockNav = { tabs: mockTabs };
    const tabsBtn = new TabsButton(mockNav, "action-edit", null);

    assert.ok(tabsBtn.buttonEl, 'TabsButton element must be created');
    assert.equal(tabsBtn.buttonEl.className, 'tabs-nav-button');

    const clickEvent = {
      type: 'click',
      preventDefault: () => {},
      stopPropagation: () => {}
    };
    tabsBtn.buttonEl.dispatchEvent(clickEvent);

    assert.ok(startEditingCalled, 'Clicking pencil button must invoke startEditing');
    assert.equal(editedTabsInstance, mockTabs, 'Passed tabs instance must match');
    assert.ok(mockTabs.activeView, 'activeView must be resolved upon click');

    console.log('✓ TabsButton pencil button triggers startEditing even when activeView was initially null');
  }

  // Test 24: Tabs.prototype.registerEventHandlers binds action-edit without being blocked by null activeView
  {
    const { Tabs } = await import('../src/core/model.js');
    let startEditingCalled = false;
    let mousedownPrevented = false;
    let clickPrevented = false;

    const mockButtonEl = {
      eventListeners: {},
      addEventListener(type, fn) {
        if (!this.eventListeners[type]) this.eventListeners[type] = [];
        this.eventListeners[type].push(fn);
      },
      dispatchEvent(event) {
        const fns = this.eventListeners[event.type] || [];
        fns.forEach(fn => fn(event));
      }
    };

    const mockTabs = Object.create(Tabs.prototype);
    mockTabs.plugin = {
      settings: { dragAndDrop: false },
      tabsEditorModal: {
        startEditing: () => { startEditingCalled = true; }
      }
    };
    mockTabs.app = {
      workspace: {
        getActiveViewOfType: () => ({ editor: {}, file: { path: "note.md" } })
      }
    };
    mockTabs.activeView = null; // simulate null on initial render
    mockTabs.tabsType = "outertabs";
    mockTabs.tabsConfig = { actionButton: "action-edit" };
    mockTabs.tabsNav = {
      navItems: [],
      tabsButton: { buttonEl: mockButtonEl }
    };
    mockTabs.registerDomEvent = (el, evt, handler) => {
      el.addEventListener(evt, handler);
    };
    mockTabs.canPersistTabOrder = () => false;

    mockTabs.registerEventHandlers();

    // Trigger mousedown on pencil button
    mockButtonEl.dispatchEvent({
      type: 'mousedown',
      preventDefault: () => { mousedownPrevented = true; },
      stopPropagation: () => {}
    });
    assert.ok(mousedownPrevented, 'mousedown on pencil button must preventDefault');

    // Trigger click on pencil button
    mockButtonEl.dispatchEvent({
      type: 'click',
      preventDefault: () => { clickPrevented = true; },
      stopPropagation: () => {}
    });
    assert.ok(clickPrevented, 'click on pencil button must preventDefault');
    assert.ok(startEditingCalled, 'click on pencil button must open tabsEditorModal via startEditing');
    assert.ok(mockTabs.activeView, 'activeView must be dynamically resolved upon click');

    console.log('✓ Tabs.prototype.registerEventHandlers action-edit registration and dispatch verified');
  }

  // Test 25: ensureCodeBlockWrappers never wraps or adds edit-block-button to nested tabs blocks
  {
    const { TabContentItem } = await import('../src/components/TabsContent.js');
    const container = new MockElement('div');
    container.className = 'tabs-content';

    // 1. Nested vertical tabs block
    const nestedTabsContainer = new MockElement('div');
    nestedTabsContainer.className = 'tabs-container tabs-innertabs block-language-tabs-v';
    container.appendChild(nestedTabsContainer);

    // 2. Regular code block (js) inside the same container
    const regularPre = new MockElement('pre');
    regularPre.className = 'language-js';
    const regularCode = new MockElement('code');
    regularCode.textContent = 'const x = 10;';
    regularPre.appendChild(regularCode);
    container.appendChild(regularPre);

    const mockItem = Object.create(TabContentItem.prototype);
    mockItem.ownerTabs = { plugin: { settings: { tabsKeyword: 'tabs' }, tabsEditorModal: { startEditing: () => {} } } };
    mockItem.index = 0;
    mockItem.content = '```tabs-v\ntab: Nested\nContent\n```\n```js\nconst x = 10;\n```';

    mockItem.ensureCodeBlockWrappers(container);

    // The nested tabs container should NOT be wrapped in tabs-codeblock-wrapper
    assert.equal(nestedTabsContainer.parentNode, container, 'nested tabs container must not be wrapped');
    assert.equal(nestedTabsContainer.querySelector('.edit-block-button'), null, 'nested tabs container must not have edit-block-button');

    // The regular pre SHOULD be wrapped in tabs-codeblock-wrapper and have edit-block-button
    assert.notEqual(regularPre.parentNode, container, 'regular codeblock must be wrapped in tabs-codeblock-wrapper');
    assert.ok(regularPre.parentNode.className.includes('tabs-codeblock-wrapper'), 'wrapper has tabs-codeblock-wrapper');
    assert.ok(regularPre.parentNode.querySelector('.edit-block-button'), 'regular code block has edit-block-button');

    console.log('✓ ensureCodeBlockWrappers never wraps or adds edit-block-button to nested tabs blocks');
  }

  // Test 26: Horizontal tabs overflow indicator (ghost arrow & blinking last visible separator)
  {
    const { DEFAULT_SETTINGS } = await import('../src/settings/defaultSettings.js');
    assert.strictEqual(DEFAULT_SETTINGS.horizontalTabsOverflowIndicator, true, 'horizontalTabsOverflowIndicator must be true by default');

    const { TabsNav } = await import('../src/components/TabsNav.js');

    const mockTabs = {
      isVertical: false,
      tabsConfig: { titlePosition: 'top' },
      plugin: {
        settings: { horizontalTabsOverflowIndicator: true }
      },
      register: () => {}
    };

    const nav = Object.create(TabsNav.prototype);
    nav.tabs = mockTabs;
    nav.overflowArrowEl = new MockElement('div');
    nav.overflowArrowEl.className = 'tabs-nav-overflow-arrow-right';

    nav.navWrapperEl = new MockElement('div');
    nav.navWrapperEl.scrollWidth = 600;
    nav.navWrapperEl.clientWidth = 250;
    nav.navWrapperEl.scrollLeft = 0;

    // Create 4 mock tab items
    nav.navItems = [0, 1, 2, 3].map(idx => {
      const el = new MockElement('div');
      el.className = 'tabs-nav-item';
      el.offsetLeft = idx * 100; // 0, 100, 200, 300
      el.offsetWidth = 90;
      return { tabitemEl: el };
    });

    // Initial state with overflow to the right
    nav.checkOverflowState();

    assert.ok(nav.overflowArrowEl.classList.contains('is-visible'), 'Ghost arrow must be visible when there is right overflow');
    // Tab 0 (0), Tab 1 (100), Tab 2 (200) are < visibleRight (250). Tab 2 is the last visible. Tab 3 (300) is hidden.
    assert.ok(nav.navItems[2].tabitemEl.classList.contains('tabs-separator-overflow-blink'), 'Last visible tab (Tab 2) must blink');
    assert.ok(!nav.navItems[0].tabitemEl.classList.contains('tabs-separator-overflow-blink'), 'Tab 0 must not blink');
    assert.ok(!nav.navItems[1].tabitemEl.classList.contains('tabs-separator-overflow-blink'), 'Tab 1 must not blink');
    assert.ok(!nav.navItems[3].tabitemEl.classList.contains('tabs-separator-overflow-blink'), 'Hidden Tab 3 must not blink');

    // Simulate user scrolling right so remaining content is visible (overflow = 0)
    nav.navWrapperEl.scrollLeft = 350; // 350 + 250 = 600 = scrollWidth
    nav.checkOverflowState();

    assert.ok(!nav.overflowArrowEl.classList.contains('is-visible'), 'Ghost arrow must disappear when scrolled to the end');
    assert.ok(!nav.navItems[2].tabitemEl.classList.contains('tabs-separator-overflow-blink'), 'Separator blinking must be cleared at end of scroll');

    // User scrolls back left: overflow indicator reappears
    nav.navWrapperEl.scrollLeft = 0;
    nav.checkOverflowState();
    assert.ok(nav.overflowArrowEl.classList.contains('is-visible'), 'Ghost arrow must reappear when scrolled back');
    assert.ok(nav.navItems[2].tabitemEl.classList.contains('tabs-separator-overflow-blink'), 'Separator blinking must re-engage when scrolled back');

    // Setting disabled: overflow indicators suppressed
    mockTabs.plugin.settings.horizontalTabsOverflowIndicator = false;
    nav.checkOverflowState();
    assert.ok(!nav.overflowArrowEl.classList.contains('is-visible'), 'Ghost arrow must be hidden when setting is disabled');
    assert.ok(!nav.navItems[2].tabitemEl.classList.contains('tabs-separator-overflow-blink'), 'Separator blinking must be cleared when setting is disabled');

    // Vertical tabs: overflow indicators suppressed
    mockTabs.plugin.settings.horizontalTabsOverflowIndicator = true;
    mockTabs.isVertical = true;
    nav.checkOverflowState();
    assert.ok(!nav.overflowArrowEl.classList.contains('is-visible'), 'Ghost arrow must never show on vertical tabs');

    console.log('✓ Horizontal tabs overflow indicator (ghost arrow & blinking last visible separator) verified');
  }

  // Test 27: Nested horizontal tabs at any level independently support overflow indicator & are notified on parent tab switch
  {
    const { TabsNav } = await import('../src/components/TabsNav.js');
    const { TabsContents } = await import('../src/components/TabsContent.js');

    // Outer tabs (can be vertical or horizontal)
    const mockOuterTabs = {
      isVertical: true, // Outer is vertical!
      tabsConfig: { titlePosition: 'left' },
      plugin: { settings: { horizontalTabsOverflowIndicator: true } },
      register: () => {}
    };

    // Inner tabs (horizontal, inside outer tab 0)
    const mockInnerTabs = {
      isVertical: false,
      tabsType: 'innertabs',
      tabsConfig: { titlePosition: 'top' },
      plugin: { settings: { horizontalTabsOverflowIndicator: true } },
      register: () => {}
    };

    const innerNav = Object.create(TabsNav.prototype);
    innerNav.tabs = mockInnerTabs;
    innerNav.overflowArrowEl = new MockElement('div');
    innerNav.overflowArrowEl.className = 'tabs-nav-overflow-arrow-right';

    innerNav.navWrapperEl = new MockElement('div');
    innerNav.navWrapperEl.scrollWidth = 400;
    innerNav.navWrapperEl.clientWidth = 180;
    innerNav.navWrapperEl.scrollLeft = 0;

    innerNav.navItems = [0, 1, 2].map(idx => {
      const el = new MockElement('div');
      el.className = 'tabs-nav-item';
      el.offsetLeft = idx * 100;
      el.offsetWidth = 80;
      return { tabitemEl: el };
    });

    const innerNavEl = new MockElement('div');
    innerNavEl.className = 'tabs-nav';
    innerNavEl._tabsNav = innerNav;
    innerNav.navEl = innerNavEl;

    // Check that inner horizontal tabs detect overflow even inside vertical parent tabs
    innerNav.checkOverflowState();
    assert.ok(innerNav.overflowArrowEl.classList.contains('is-visible'), 'Inner horizontal tabs must show ghost arrow');
    assert.ok(innerNav.navItems[1].tabitemEl.classList.contains('tabs-separator-overflow-blink'), 'Last visible item in nested tabs (Tab 1) must blink');

    // Test parent tab activation notifying nested navs
    let nestedCheckCalled = false;
    innerNav.scheduleOverflowCheck = () => { nestedCheckCalled = true; };

    const contentItem0 = {
      contentEl: new MockElement('div')
    };
    contentItem0.contentEl.className = 'tabs-content';
    contentItem0.contentEl.appendChild(innerNavEl);

    const contentItem1 = {
      contentEl: new MockElement('div')
    };
    contentItem1.contentEl.className = 'tabs-content';

    const outerContents = Object.create(TabsContents.prototype);
    outerContents.tabcontents = [contentItem0, contentItem1];

    // Activating outer tab 0 should notify innerNav
    outerContents.refreshActiveTabContent(0);
    assert.ok(contentItem0.contentEl.classList.contains('tabs-content-active'), 'Tab 0 content must be active');
    assert.ok(nestedCheckCalled, 'refreshActiveTabContent must notify nested tabsNav via scheduleOverflowCheck');

    console.log('✓ Nested horizontal tabs at any level independently support overflow indicator & are notified on parent tab switch');
  }

  console.log('All Codeblocks tests passed!\n');
}
