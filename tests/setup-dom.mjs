// Node.js DOM environment polyfill for tests
export class MockElement {
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
    this.dataset = {};
    this.eventListeners = {};
    this.textContent = '';
    this.style = {};
    this.ownerDocument = globalThis.document;
  }

  getBoundingClientRect() {
    return { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 };
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

if (typeof globalThis.MutationObserver === 'undefined') {
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

if (typeof globalThis.document === 'undefined') {
  const docEl = new MockElement('html');
  const headEl = new MockElement('head');
  const bodyEl = new MockElement('body');
  docEl.appendChild(headEl);
  docEl.appendChild(bodyEl);
  globalThis.document = {
    documentElement: docEl,
    head: headEl,
    body: bodyEl,
    createElement: (tag) => new MockElement(tag),
    createTextNode: (text) => { const el = new MockElement('#text'); el.nodeValue = text; el.textContent = text; return el; },
    addEventListener() {},
    removeEventListener() {},
    getSelection() { return { rangeCount: 0, addRange(){}, removeAllRanges(){}, getRangeAt(){ return null; } }; },
    hasFocus() { return true; }
  };
} else {
  if (!globalThis.document.documentElement || typeof globalThis.document.documentElement.insertBefore !== 'function') {
    const docEl = new MockElement('html');
    if (globalThis.document.documentElement && globalThis.document.documentElement.style) {
      docEl.style = globalThis.document.documentElement.style;
    }
    globalThis.document.documentElement = docEl;
  }
  if (!globalThis.document.head) globalThis.document.head = new MockElement('head');
  if (!globalThis.document.body) globalThis.document.body = new MockElement('body');
  if (!globalThis.document.addEventListener) globalThis.document.addEventListener = () => {};
  if (!globalThis.document.removeEventListener) globalThis.document.removeEventListener = () => {};
  if (!globalThis.document.getSelection) globalThis.document.getSelection = () => ({ rangeCount: 0, addRange(){}, removeAllRanges(){}, getRangeAt(){ return null; } });
  if (!globalThis.document.hasFocus) globalThis.document.hasFocus = () => true;
  if (!globalThis.document.createTextNode) globalThis.document.createTextNode = (text) => { const el = new MockElement('#text'); el.nodeValue = text; el.textContent = text; return el; };
  globalThis.document.createElement = (tag) => new MockElement(tag);
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    document: globalThis.document,
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle() { return { getPropertyValue() { return ''; } }; },
    getSelection() { return globalThis.document.getSelection(); },
    requestAnimationFrame(cb) { return setTimeout(cb, 0); },
    cancelAnimationFrame(id) { clearTimeout(id); }
  };
} else {
  if (!globalThis.window.addEventListener) globalThis.window.addEventListener = () => {};
  if (!globalThis.window.removeEventListener) globalThis.window.removeEventListener = () => {};
  if (!globalThis.window.getComputedStyle) globalThis.window.getComputedStyle = () => ({ getPropertyValue() { return ''; } });
  if (!globalThis.window.getSelection) globalThis.window.getSelection = () => globalThis.document.getSelection();
  if (!globalThis.window.requestAnimationFrame) globalThis.window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  if (!globalThis.window.cancelAnimationFrame) globalThis.window.cancelAnimationFrame = (id) => clearTimeout(id);
}
globalThis.requestAnimationFrame = globalThis.window.requestAnimationFrame;
globalThis.cancelAnimationFrame = globalThis.window.cancelAnimationFrame;
globalThis.document.defaultView = globalThis.window;
