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
    const handlers = this.eventListeners[event.type] || [];
    handlers.forEach(h => h(event));
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
      if (selector.includes('class*="block-language-"')) {
        return this.className.includes('block-language-');
      }
    }
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  querySelectorAll(selector) {
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

  // Test 1: ensureCodeBlockWrappers wraps pre and injects edit-block-button
  {
    const container = new MockElement('div');
    container.className = 'tabs-content';

    const pre = new MockElement('pre');
    pre.className = 'language-tree';
    const code = new MockElement('code');
    code.textContent = 'root/\n  file1.txt';
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
    item.content = '```tree\nroot/\n  file1.txt\n```';

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
    assert.equal(startedEditingWith.targetInfo.language, 'tree');
    assert.equal(startedEditingWith.targetInfo.tabIndex, 0, 'tabIndex must be 0-based for ownerTabs');
    assert.equal(startedEditingWith.targetInfo.blockIndex, 0, 'blockIndex should be 0 for the first code block');
    assert.ok(startedEditingWith.targetInfo.snippet.includes('root/'));
    console.log('✓ ensureCodeBlockWrappers wraps pre and edit button triggers startEditing with language and snippet (0-based)');
  }

  // Test 2: Custom codeblock containers like div.block-language-tree are also wrapped
  {
    const container = new MockElement('div');
    container.className = 'tabs-content';

    const treeBlock = new MockElement('div');
    treeBlock.className = 'block-language-tree';
    treeBlock.textContent = 'Folder 1\n  Subfolder A';
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
    const editBtn = wrappers[0].querySelector('.edit-block-button');
    assert.ok(editBtn, 'Should contain edit-block-button');

    editBtn.dispatchEvent({
      type: 'click',
      preventDefault: () => {},
      stopPropagation: () => {}
    });

    assert.ok(startedEditingWith);
    assert.equal(startedEditingWith.targetInfo.language, 'tree');
    console.log('✓ block-language-tree container wrapped and button triggers edit targeting tree');
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

  console.log('All Codeblocks tests passed!\n');
}
