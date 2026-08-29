import { MarkdownRenderer, MarkdownRenderChild } from 'obsidian';
import { tabsExtendedFindDirectNestedBlocks, tabsExtendedConfiguredKeyword, tabsExtendedNormalizeSource } from '../core/parser.js';
import { $ } from '../i18n/index.js';

export class TabContentItem {
    constructor(t, e, i, n, r, ownerTabs = null, cacheIdentity = "") {
      this.isActiveed = !1;
      this.ownerTabs = ownerTabs;
      this.cacheIdentity = cacheIdentity;
      this.claimedNestedBlocks = new Set();
      this.nestedBlocksCache = null;
      ((this.index = t),
        (this.title = e),
        (this.content = i),
        this.createTabContentEl(i, n, r));
    }
    ensureCodeBlockWrappers(container) {
      if (!container) return;
      const pres = container.querySelectorAll('pre');
      pres.forEach(pre => {
        if (pre.parentElement && !pre.parentElement.classList.contains('tabs-codeblock-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'tabs-codeblock-wrapper';
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(pre);
        }
      });
    }
    createTabContentEl(t, e, i) {
      ((this.contentEl = createDiv()),
        (this.contentEl.className = "tabs-content markdown-rendered"));
      this.contentEl.tabsExtendedContentModel = this;
      let n = new MarkdownRenderChild(this.contentEl);
      // Pre-process the content so that any top-level tabs fenced blocks use a fence
      // longer than all inner same-character closing fences.  Without this,
      // CommonMark's parser closes the outer ~~~tabs at the FIRST ~~~  it encounters
      // (which belongs to an inner block), causing content to escape as plain text.
      const safeContent = this.fixNestedFences(t);
      const sourcePath = (i && typeof i.sourcePath === "string") ? i.sourcePath : "";
      const renderPromise = MarkdownRenderer.render(
        e,
        safeContent,
        this.contentEl,
        sourcePath,
        n,
      );
      Promise.resolve(renderPromise)
        .then(() => {
          this.ensureCodeBlockWrappers(this.contentEl);
        })
        .catch((error) => {
          console.error("Tabs Extended could not finish rendering tab content:", error);
        });
      if (i && typeof i.addChild === 'function') {
        try {
          i.addChild(n);
        } catch (err) {}
      }
    }
    getDirectNestedBlocks(sourceText = this.content) {
      const source = String(sourceText == null ? "" : sourceText);
      const settings = this.ownerTabs && this.ownerTabs.plugin
        ? this.ownerTabs.plugin.settings
        : null;
      const keyword = tabsExtendedConfiguredKeyword(settings);
      const cached = this.nestedBlocksCache;
      if (
        cached &&
        cached.source === source &&
        cached.keyword === keyword
      ) {
        return cached.blocks;
      }
      const blocks = tabsExtendedFindDirectNestedBlocks(source, settings);
      this.nestedBlocksCache = { source, keyword, blocks };
      return blocks;
    }
    claimNestedBlock(rawText, isVertical) {
      const blocks = this.getDirectNestedBlocks(this.content);
      const normalized = tabsExtendedNormalizeSource(rawText);
      let selected = -1;

      for (let index = 0; index < blocks.length; index++) {
        if (this.claimedNestedBlocks.has(index)) continue;
        const block = blocks[index];
        if (block.isVertical !== !!isVertical) continue;
        const body = this.content.slice(block.bodyFrom, block.bodyTo);
        if (tabsExtendedNormalizeSource(body) === normalized) {
          selected = index;
          break;
        }
      }
      if (selected < 0) {
        selected = blocks.findIndex(
          (block, index) =>
            !this.claimedNestedBlocks.has(index) &&
            block.isVertical === !!isVertical,
        );
      }
      if (selected >= 0) this.claimedNestedBlocks.add(selected);
      return selected;
    }
    // ── Fix CommonMark fence-length collision for nested tabs blocks ──────────
    // CommonMark closes a fenced code block at the FIRST line containing the
    // same (or more) fence characters with no info-string.  When inner tabs blocks
    // use the same character and length as an outer block, the outer is closed
    // prematurely.  This method scans every top-level tabs opening in `text` and
    // increases its fence length (and its matching close) to be strictly greater
    // than the longest intermediate same-character no-info fence inside the block.
    fixNestedFences(text) {
      if (!text || !text.includes('tabs')) return text;
      const lines = text.split('\n');
      const out = [...lines];
      // Stack for fences at the content's top level (to skip non-tabs blocks)
      const outerStack = [];
      let i = 0;
      while (i < lines.length) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('|')) { i++; continue; }
        const fm = trimmed.match(/^(`{3,}|~{3,})(.*)/);
        if (!fm) { i++; continue; }
        const fenceStr = fm[1], fenceChar = fenceStr[0];
        const fenceLen = fenceStr.length, info = fm[2].trim();
        if (outerStack.length === 0) {
          if (info.startsWith('tabs')) {
            // Top-level tabs block — scan forward for matching close
            const leadIdx = lines[i].indexOf(fenceChar);
            const indent = leadIdx >= 0 ? lines[i].substring(0, leadIdx) : '';
            const innerStack = [{ char: fenceChar, len: fenceLen }];
            // Track the maximum length of any intermediate same-char no-info fence
            // (those are the ones CommonMark could use to prematurely close the block)
            let maxMid = 0;
            let closeIdx = lines.length;
            let j = i + 1;
            while (j < lines.length && innerStack.length > 0) {
              const it = lines[j].trim();
              if (it.startsWith('|')) { j++; continue; }
              const ifm = it.match(/^(`{3,}|~{3,})(.*)/);
              if (ifm) {
                const ifs = ifm[1], ifc = ifs[0], ifl = ifs.length, ifi = ifm[2].trim();
                const cur = innerStack[innerStack.length - 1];
                if (ifc === cur.char && ifl >= cur.len && ifi === '') {
                  // Closing fence for the current innermost level
                  innerStack.pop();
                  if (innerStack.length === 0) { closeIdx = j; break; }
                  // Still inside — this intermediate close is a potential CommonMark closer
                  if (ifc === fenceChar) maxMid = Math.max(maxMid, ifl);
                } else if (ifc === cur.char && ifl >= cur.len && ifi !== '') {
                  // Opening a deeper level
                  innerStack.push({ char: ifc, len: ifl });
                } else if (ifc === fenceChar && ifi === '') {
                  // Same-char no-info fence that doesn't match the current stack head
                  // (e.g. shorter than the innermost block) — still a potential closer
                  maxMid = Math.max(maxMid, ifl);
                }
              }
              j++;
            }
            // If any intermediate fence could close this block prematurely, lengthen it
            if (maxMid >= fenceLen) {
              const newLen = maxMid + 1;
              const nf = fenceChar.repeat(newLen);
              out[i] = indent + nf + info;
              if (closeIdx < lines.length) {
                const cl = lines[closeIdx].indexOf(fenceChar);
                const ci = cl >= 0 ? lines[closeIdx].substring(0, cl) : '';
                out[closeIdx] = ci + nf;
              }
            }
            i = closeIdx + 1;
            continue;
          } else if (info !== '') {
            // Non-tabs code block at content top level — track depth but don't fix
            outerStack.push({ char: fenceChar, len: fenceLen });
          }
          // info === '' at top level: orphaned closer, skip
        } else {
          const cur = outerStack[outerStack.length - 1];
          if (fenceChar === cur.char && fenceLen >= cur.len && info === '') {
            outerStack.pop();
          } else if (fenceChar === cur.char && fenceLen >= cur.len && info !== '') {
            outerStack.push({ char: fenceChar, len: fenceLen });
          }
        }
        i++;
      }
      return out.join('\n');
    }
  };

export class TabsContents {
  constructor(t, e) {
    this.currentTab = 0;
    ((this.plugin = t),
      (this.tabcontents = e),
      (this.tabcontentsEl = this.createTabContentsEl()),
      this.tabcontents.length > 0 &&
        ((this.tabcontents[0].isActiveed = !0),
        this.tabcontents[0].contentEl.classList.add("tabs-content-active")));
  }
  createTabContentsEl() {
    let t = document.createElement("div");
    return (
      (t.className = "tabs-contents"),
      this.tabcontents.forEach((e) => {
        t.appendChild(e.contentEl);
      }),
      t
    );
  }
  refreshActiveTabContent(t) {
    if (!Array.isArray(this.tabcontents) || this.tabcontents.length === 0) return;
    const targetIndex = Math.max(0, Math.min(this.tabcontents.length - 1, t));
    for (let i = 0; i < this.tabcontents.length; i++) {
      const item = this.tabcontents[i];
      if (!item || !item.contentEl) continue;
      const isActive = i === targetIndex;
      item.isActiveed = isActive;
      if (isActive) {
        item.contentEl.classList.add("tabs-content-active");
      } else {
        item.contentEl.classList.remove("tabs-content-active");
      }
    }
    this.currentTab = targetIndex;
  }
};
