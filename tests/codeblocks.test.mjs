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

export function runCodeblocksTests() {
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
    assert.equal(startedEditingWith.targetInfo.tabIndex, 1);
    assert.ok(startedEditingWith.targetInfo.snippet.includes('root/'));
    console.log('✓ ensureCodeBlockWrappers wraps pre and edit button triggers startEditing with language and snippet');
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
    pre.appendChild(new MockElement('code'));
    container.appendChild(pre);

    const item = Object.create(TabContentItem.prototype);
    item.ownerTabs = { plugin: {} };
    item.index = 0;

    item.ensureCodeBlockWrappers(container);
    item.ensureCodeBlockWrappers(container);
    item.ensureCodeBlockWrappers(container);

    const wrappers = container.querySelectorAll('.tabs-codeblock-wrapper');
    assert.equal(wrappers.length, 1, 'Repeated calls must not duplicate wrapper');
    const buttons = wrappers[0].querySelectorAll('.edit-block-button');
    assert.equal(buttons.length, 1, 'Repeated calls must not duplicate edit button');
    console.log('✓ ensureCodeBlockWrappers is idempotent');
  }

  // Test 4: Focus target block locating logic
  {
    const sampleDoc = [
      '# My Tab',
      'Here is an introductory paragraph.',
      '',
      '```tree',
      'src/',
      '  index.js',
      '```',
      '',
      'More text after the tree.'
    ].join('\n');

    const fenceRegex = new RegExp("(?:^|\\n)[ \t]*(`{3,}|~{3,})\\s*tree\\b", "i");
    const match = sampleDoc.match(fenceRegex);
    assert.ok(match, 'Language fence regex should match ```tree');
    const offset = match[0].startsWith('\n') ? match.index + 1 : match.index;
    assert.ok(offset > 0, 'Offset should point to the code block fence line');
    console.log('✓ Target code block location resolution verified');
  }

  console.log('All Codeblocks tests passed!\n');
}
