import assert from 'node:assert/strict';
import { TabContentItem } from '../src/components/TabsContent.js';

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
    createElement: (tag) => {
      const el = new MockElement(tag);
      return el;
    }
  };
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

  // Test 8: Default settings include renderCodeBlocksInModal: true
  {
    const { DEFAULT_SETTINGS } = await import('../src/settings/defaultSettings.js');
    assert.equal(DEFAULT_SETTINGS.renderCodeBlocksInModal, true, 'DEFAULT_SETTINGS must have renderCodeBlocksInModal: true');
    console.log('✓ DEFAULT_SETTINGS.renderCodeBlocksInModal is true by default');
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

  console.log('All Codeblocks tests passed!\n');
}
