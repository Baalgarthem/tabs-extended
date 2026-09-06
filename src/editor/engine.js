import {
  B, to, no, be, I, Re, at, it, An, re, tr, kw, z, In, ra, x, If, hr, en, ut, on, wr, At, ev, cd, fd, TO, is, fs, un, El,
  pt, k, q, Z, A, Zr, Be, ud, $O, PO, Qy, ky, wy, yy, xO, vO, Dr, fO, cO, fy, hO, lO, cy, aO, hy, Pl, oO, eO, sy, Lr, kl, Lt, xl, dn, vl, fn, Wp, iy, ey, qp, Np, Yp, Mr, Ap, Cp, Er, $p, Pp, Qp, JS, ln, bp, gp, GS, E, Yt, dl, ul, fl, cs, rp, BS, DS, IS, LS, RS, sS, Fe, nS,
  Zt, Rt, Kn, Wd, dd, Na
} from '../vendor/codemirror-bundle.js';
import { MarkdownRenderer, setIcon } from 'obsidian';
import { $ } from '../i18n/index.js';

export class TabsModalEditorEngine {
  constructor(t, e, i = "", targetBlockInfo = null) {
    this.historyTools = [];
    this.formatTools = [];
    this.paragraphTools = [];
    this.insertTools = [];
    this.lastEditTime = 0;
    this.docChange = !1;
    // Explicit invalidation for structural toolbar commands. Document changes
    // normally trigger a rebuild, but this effect also refreshes the decoration
    // layer after the button click/focus cycle has completed.
    const forceNestedTabsRefreshEffect = pt.define();
    this.forceNestedTabsRefreshEffect = forceNestedTabsRefreshEffect;
    // The bundle contains another CodeMirror state runtime whose minified
    // EditorSelection is `Z`. The modal is created with `I` + `A`, so every
    // selection passed to it must come from their matching runtime, `k`.
    this.ModalSelection = k;
    const modalConfiguredKeyword = (t.settings.tabsKeyword || "tabs").trim();
    const modalSafeKeyword = modalConfiguredKeyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const modalTabsInfoRegex = new RegExp(
      `^(?:${modalSafeKeyword}(?:-v)?|tabs(?:-v)?)$`,
      "i",
    );
    this.modalTabsInfoRegex = modalTabsInfoRegex;

    class CodeBlockLivePreviewWidget extends Re {
      constructor(plugin, rawText, language, from, to) {
        super();
        this.plugin = plugin;
        this.rawText = rawText;
        this.language = language;
        this.from = from;
        this.to = to;
      }
      eq(other) {
        return other.rawText === this.rawText && other.from === this.from && other.to === this.to;
      }
      ignoreEvent(event) {
        return true;
      }
      toDOM(view) {
        const container = document.createElement("div");
        container.className = "cm-embed-block markdown-rendered tabs-codeblock-wrapper tabs-modal-codeblock-preview";

        const editBtn = document.createElement("div");
        editBtn.className = "edit-block-button";
        const label = $("editBlockButton") || "Edit this block";
        editBtn.setAttribute("aria-label", label);
        editBtn.setAttribute("title", label);
        try {
          (0, setIcon)(editBtn, "code");
        } catch (e) {
          editBtn.textContent = "</>";
        }

        const triggerEdit = (evt) => {
          if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
          }
          const firstLineBreak = this.rawText.indexOf("\n");
          const targetPos = firstLineBreak !== -1 ? this.from + firstLineBreak + 1 : this.from;
          view.dispatch({
            selection: { anchor: targetPos },
            scrollIntoView: true
          });
          view.focus();
        };

        editBtn.addEventListener("click", triggerEdit);
        container.appendChild(editBtn);

        const contentEl = document.createElement("div");
        contentEl.className = "tabs-modal-codeblock-content";
        container.appendChild(contentEl);

        container.addEventListener("click", (evt) => {
          if (evt.target.closest("a, .internal-link, .edit-block-button")) return;
          triggerEdit(evt);
        });

        try {
          const activeFile = this.plugin && this.plugin.app && this.plugin.app.workspace ? this.plugin.app.workspace.getActiveFile() : null;
          const sourcePath = activeFile ? activeFile.path : "";
          MarkdownRenderer.render(
            this.plugin.app,
            this.rawText,
            contentEl,
            sourcePath,
            this.plugin
          );
        } catch (err) {
          console.error("Tabs Extended: error rendering code block preview in modal:", err);
          contentEl.textContent = this.rawText;
        }

        return container;
      }
    }

    this.codeBlockLivePreviewPlugin = Zt.fromClass(
      class {
        constructor(view) {
          this.decorations = this.getDeco(view);
        }
        update(update) {
          if (update.docChanged || update.selectionSet) {
            this.decorations = this.getDeco(update.view);
          }
        }
        getDeco(view) {
          let deco = [];
          let doc = view.state.doc;
          let selection = view.state.selection;
          let fenceStack = [];
          let modalTabsRegex = modalTabsInfoRegex;

          for (let p = 1; p <= doc.lines; p++) {
            let line = doc.line(p);
            let text = line.text.trim();
            let match = text.match(/^(`{3,}|~{3,})(.*)/);

            if (match) {
              let fenceStr = match[1];
              let info = match[2].trim();
              let current = fenceStack.length > 0 ? fenceStack[fenceStack.length - 1] : null;

              if (current && current.type === "code") {
                if (fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0]) {
                  let popped = fenceStack.pop();
                  let startLine = doc.line(popped.lineNo);
                  let endLine = line;

                  let isCursorInside = selection.ranges.some(
                    (r) => Math.max(r.from, startLine.from) <= Math.min(r.to, endLine.to)
                  );

                  if (!isCursorInside) {
                    let rawText = doc.sliceString(startLine.from, endLine.to);
                    deco.push(
                      q.replace({
                        widget: new CodeBlockLivePreviewWidget(t, rawText, popped.info, startLine.from, endLine.to),
                        block: true
                      }).range(startLine.from, endLine.to)
                    );
                  }
                }
                continue;
              }

              if (current && current.type === "tabs") {
                if (fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && !modalTabsRegex.test(info)) {
                  fenceStack.pop();
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

          return q.set(deco, true);
        }
      },
      { decorations: (v) => v.decorations }
    );

    this.activeLineHighlighter = Zt.fromClass(
      class {
        constructor(t) {
          this.decorations = this.getDeco(t);
        }
        update(t) {
          (t.docChanged || t.selectionSet) &&
            (this.decorations = this.getDeco(t.view));
        }
        getDeco(t) {
          let e = -1,
            i = [];
          for (let n of t.state.selection.ranges) {
            let r = t.lineBlockAt(n.head);
            r.from > e &&
              (i.push(q.line({ class: "cm-active" }).range(r.from)),
              (e = r.from));
          }
          return q.set(i, !0);
        }
      },
      { decorations: (t) => t.decorations },
    );
    const nestedPairCache = new WeakMap();
    // Unique active-block invariant: exactly one nested tabs pair may be
    // visually active. The innermost pair containing the primary cursor wins;
    // parents and children outside that pair must remain inactive.
    const getInnermostActivePair = (pairs, cursorLine) => {
      let active = null;
      for (let pair of pairs) {
        if (cursorLine < pair.startLine || cursorLine > pair.endLine) continue;
        let pairSpan = pair.endLine - pair.startLine;
        let activeSpan = active ? active.endLine - active.startLine : Infinity;
        if (!active || pair.depth > active.depth ||
            (pair.depth === active.depth && pairSpan < activeSpan)) {
          active = pair;
        }
      }
      return active;
    };
    // Keep the active ghost-text invariant inside the EditorView itself. The
    // external stylesheet mirrors this rule, but correctness must not depend
    // on styles.css being present in the installed plugin directory.
    this.activeNestedTabsInvariantTheme = A.theme({
      ".cm-line.cm-nested-tab-active-fence .cm-nested-tab-ghost-text": {
        fontWeight: "700 !important",
        opacity: "1 !important",
        color: "var(--text-normal) !important"
      }
    });
    this.nestedTabsHighlighter = Zt.fromClass(
      class {
        constructor(view) {
          this.decorations = this.getDeco(view);
        }
        update(update) {
          let forceRefresh = update.transactions.some((transaction) =>
            transaction.effects.some((effect) => effect.is(forceNestedTabsRefreshEffect)),
          );
          if (forceRefresh) {
            this.decorations = this.getDeco(update.view);
            return;
          }
          // Structural decorations must never depend on cursor/selection state.
          // Map ordinary content edits incrementally. Rebuild only when a fence,
          // separator, or line topology changes.
          if (update.docChanged) {
            let oldDoc = update.startState.doc;
            let newDoc = update.state.doc;
            let structureChanged = oldDoc.lines !== newDoc.lines;
            let split = t.settings.split;
            let separatorOffset = (text) => {
              let leadingWhitespace = text.length - text.trimStart().length;
              return text.startsWith(split, leadingWhitespace) ? leadingWhitespace : -1;
            };

            if (!structureChanged) {
              update.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
                if (structureChanged) return;
                let oldStart = oldDoc.lineAt(fromA);
                let oldEnd = oldDoc.lineAt(toA);
                let newStart = newDoc.lineAt(fromB);
                let newEnd = newDoc.lineAt(toB);
                if (oldStart.number !== oldEnd.number || newStart.number !== newEnd.number) {
                  structureChanged = true;
                  return;
                }

                let oldFence = /^\s*(`{3,}|~{3,})/.test(oldStart.text);
                let newFence = /^\s*(`{3,}|~{3,})/.test(newStart.text);
                let oldSplitOffset = separatorOffset(oldStart.text);
                let newSplitOffset = separatorOffset(newStart.text);

                if (oldFence || newFence || (oldSplitOffset >= 0) !== (newSplitOffset >= 0)) {
                  structureChanged = true;
                  return;
                }

                if (oldSplitOffset >= 0 && newSplitOffset >= 0) {
                  let oldProtectEnd = oldStart.from + oldSplitOffset + split.length;
                  let newProtectEnd = newStart.from + newSplitOffset + split.length;
                  // The line decoration already supplies the title color and
                  // underline. Rebuild only when the protected prefix itself is
                  // touched; ordinary title edits can map the line and endpoint
                  // widget without creating an inline DOM boundary at the caret.
                  if (fromA < oldProtectEnd || fromB < newProtectEnd) {
                    structureChanged = true;
                  }
                }
              });
            }

            if (structureChanged) {
              this.decorations = this.getDeco(update.view);
            } else {
              this.decorations = this.decorations.map(update.changes);
              let previousPairs = nestedPairCache.get(oldDoc);
              if (previousPairs) nestedPairCache.set(newDoc, previousPairs);
            }
          }
        }
        getDeco(view) {
          if (!t.settings.nestedTabsHighlight) return q.none;
          try {
          if (!this.DepthWidget) {
              this.DepthWidget = class extends Re {
                  constructor(text, depth, view = null, lineNo = -1, type = null, splitStr = "", baseDepth = 0) {
                      super();
                      this.text = text;
                      this.depth = depth;
                      this.view = view;
                      this.lineNo = lineNo;
                      this.type = type;
                      this.splitStr = splitStr;
                      this.baseDepth = baseDepth;
                  }
                  eq(other) { 
                      return other.text === this.text && other.depth === this.depth && 
                             other.lineNo === this.lineNo && other.type === this.type &&
                             other.splitStr === this.splitStr && other.baseDepth === this.baseDepth;
                  }
                  ignoreEvent(event) {
                      // Only the destructive control owns its pointer events.
                      // Ghost labels and endpoint widgets must participate in
                      // CodeMirror's normal mouse-selection pipeline.
                      let target = event && event.target;
                      return !!(target && target.closest && target.closest(".tabs-delete-button"));
                  }
                  toDOM() {
                      let span = document.createElement("span");
                      span.className = "cm-nested-tab-ghost-text";
                      span.style.fontSize = "0.7em";
                      span.style.opacity = "0.7";
                      span.style.color = "var(--nested-tab-delimiter-color)";
                      span.style.marginLeft = "1em";
                      span.appendChild(document.createTextNode(this.text));
                      if (this.depth !== "") {
                          span.appendChild(document.createTextNode(" "));
                          let depthEl = document.createElement("b");
                          depthEl.textContent = String(this.depth);
                          span.appendChild(depthEl);
                      }
                      
                      if (this.type && this.view) {
                          let delBtn = document.createElement("span");
                          delBtn.className = "tabs-delete-button";
                          delBtn.textContent = " 🗑️";
                          delBtn.style.cursor = "pointer";
                          delBtn.style.pointerEvents = "auto";
                          delBtn.title = "Delete " + (this.type === "block" ? "entire nested block" : "tab and its content");
                          
                          delBtn.dataset.type = this.type;
                          delBtn.dataset.split = this.splitStr;
                          delBtn.dataset.baseDepth = this.baseDepth;
                          
                          span.appendChild(delBtn);
                      }
                      
                      return span;
                  }
              };
          }
          let i = [];
          let fenceStack = [];
          let tabDepth = 0;
          let pairs = [];
          let doc = view.state.doc;
          let isModal = !!view.dom.closest('.tabs-editor-modal');
          let baseDepth = isModal ? 1 : 0;

          for (let p = 1; p <= doc.lines; p++) {
             let line = doc.line(p);
             let text = line.text.trim();
             
             let match = text.match(/^(`{3,}|~{3,})(.*)/);
             let current = fenceStack.length > 0 ? fenceStack[fenceStack.length - 1] : null;

             if (match) {
                 let fenceStr = match[1];
                 let info = match[2].trim();
                 
                 if (current && current.type === "code") {
                     if (fenceStr.length >= current.fence.length && fenceStr.startsWith(current.fence[0])) {
                         fenceStack.pop();
                     }
                     continue;
                 }
                 
                  if (current && current.type === "tabs" && fenceStr.length >= current.fence.length && fenceStr.startsWith(current.fence[0]) && !modalTabsInfoRegex.test(info)) {
                       let depth = tabDepth;
                       let popped = fenceStack.pop();
                       if (popped.type === "tabs") {
                           tabDepth--;
                           pairs.push({ startLine: popped.startLine, endLine: p, depth });
                           let baseEnd = t.settings.nestedTabsDelimiterTextEnd || "nesting end";
                          let rawEnd = baseEnd.replace(/\s*\((horizontal|vertical|vertical end)\)$/i, "");
                          let endText = rawEnd + (popped.isVertical ? " (vertical)" : " (horizontal)");
                           i.push(q.line({ class: "cm-nested-tab-end" }).range(line.from));
                            i.push(q.widget({ widget: new this.DepthWidget(endText, depth, view, p, null, t.settings.split, baseDepth), side: 1 }).range(line.to));
                      }
                 } else {
                      if (modalTabsInfoRegex.test(info)) {
                            let isVertical = info.toLowerCase().endsWith("-v");
                            fenceStack.push({ fence: fenceStr, type: "tabs", startLine: p, isVertical });
                            tabDepth++;
                            let depth = tabDepth;
                           let baseStart = t.settings.nestedTabsDelimiterTextStart || "nesting start";
                           let rawStart = baseStart.replace(/\s*\((horizontal|vertical|vertical end)\)$/i, "");
                           let startText = rawStart + (isVertical ? " (vertical)" : " (horizontal)");
                            i.push(q.line({ class: "cm-nested-tab-start" }).range(line.from));
                            i.push(q.widget({ widget: new this.DepthWidget(startText, depth, view, p, "block", t.settings.split, baseDepth), side: 1 }).range(line.to));
                      } else {
                         if (current || baseDepth === 1) {
                             fenceStack.push({ fence: fenceStr, type: "code" });
                         }
                     }
                 }
                 continue;
             }
             let inTabs = (current && current.type === "tabs") || (baseDepth === 1 && fenceStack.length === 0);
             if (inTabs) {
                  if (line.text.trimStart().startsWith(t.settings.split)) {
                      let depth = tabDepth + baseDepth;
                     let levelIndex = Math.min(5, Math.max(0, depth - 1));
                     let levelClass = "cm-nested-tab-level-" + (levelIndex === 5 ? "5plus" : levelIndex);
                      i.push(q.line({ class: "cm-nested-tab-item " + levelClass }).range(line.from));
                     let splitOffset = line.text.indexOf(t.settings.split);
                     if (splitOffset >= 0) {
                         i.push(q.replace({ inclusive: false, inclusiveStart: false, inclusiveEnd: false }).range(line.from + splitOffset, line.from + splitOffset + t.settings.split.length));
                         // Do not wrap the editable title in an inline mark. The
                         // line class above provides the same visual styling and
                         // leaves a single, stable text node for mouse hit-testing
                         // and CodeMirror's synthetic cursor measurement.
                      }
                      if (depth === 1) {
                          // Root separators have no delete action, but their
                          // endpoint widget must still route mouse clicks back to
                          // the editor—especially while the title is empty.
                          i.push(q.widget({ widget: new this.DepthWidget("main topic", "", view, p, null, t.settings.split, baseDepth), side: 1 }).range(line.to));
                      } else {
                         i.push(q.widget({ widget: new this.DepthWidget("", "", view, p, "tab", t.settings.split, baseDepth), side: 1 }).range(line.to));
                     }
                 }
             }
          }
          // Publish only after the complete scan. Storing from inside a title
          // line exposed an incomplete array before the closing fence was seen.
          nestedPairCache.set(doc, pairs);
          // Mixed CodeMirror decorations at the same document position must be
          // ordered by RangeValue.startSide, not only by from/to. Let CodeMirror
          // perform its canonical ordering so cursor movement cannot invalidate
          // the complete decoration set.
          let res = q.set(i, true);
          return res;
          } catch (err) {
              let selection = view.state.selection && view.state.selection.main;
              console.error("Error in nestedTabsHighlighter getDeco:", {
                  error: err,
                  cursor: selection ? selection.head : null,
                  anchor: selection ? selection.anchor : null,
                  line: selection ? view.state.doc.lineAt(selection.head).number : null,
                  docLength: view.state.doc.length
              });

              throw err;
          }
        }
      },
      { decorations: (v) => v.decorations }
    );
    this.activeNestedTabsHighlighter = Zt.fromClass(
      class {
        constructor(view) {
          this.doc = null;
          this.pairs = [];
          this.activeKey = null;
          this.decorations = this.getDeco(view, true);
        }
        update(update) {
          let forceRefresh = update.transactions.some((transaction) =>
            transaction.effects.some((effect) => effect.is(forceNestedTabsRefreshEffect)),
          );
          if (update.docChanged || update.selectionSet || forceRefresh) {
            // The structural plugin runs first and publishes the mapped/rebuilt
            // pair cache for the new immutable document. Reuse it instead of
            // rescanning every line after each typed character.
            this.decorations = this.getDeco(update.view, forceRefresh);
          }
        }
        scanPairs(doc) {
          let pairs = [];
          let stack = [];
          let tabDepth = 0;

          for (let lineNo = 1; lineNo <= doc.lines; lineNo++) {
            let match = doc.line(lineNo).text.trim().match(/^(`{3,}|~{3,})(.*)/);
            if (!match) continue;

            let fence = match[1];
            let info = match[2].trim();
            let current = stack.length ? stack[stack.length - 1] : null;

            if (current && current.type === "code") {
              if (fence[0] === current.fence[0] && fence.length >= current.fence.length) stack.pop();
              continue;
            }

            if (current && current.type === "tabs" && fence[0] === current.fence[0] &&
                fence.length >= current.fence.length && !modalTabsInfoRegex.test(info)) {
              let closed = stack.pop();
              let depth = tabDepth;
              tabDepth--;
              pairs.push({
                startLine: closed.startLine,
                endLine: lineNo,
                depth
              });
              continue;
            }

            if (modalTabsInfoRegex.test(info)) {
              stack.push({ type: "tabs", fence, startLine: lineNo });
              tabDepth++;
            } else {
              stack.push({ type: "code", fence });
            }
          }
          nestedPairCache.set(doc, pairs);
          return pairs;
        }
        getDeco(view, forceScan = false) {
          let doc = view.state.doc;
          let sameDoc = this.doc === doc;
          if (forceScan || this.doc !== doc) {
            this.doc = doc;
            this.pairs = nestedPairCache.get(doc) || this.scanPairs(doc);
          }

          let cursorLine = doc.lineAt(view.state.selection.main.head).number;
          let active = getInnermostActivePair(this.pairs, cursorLine);
          let nextKey = active
            ? `${active.startLine}:${active.endLine}:${active.depth}`
            : "none";
          if (sameDoc && nextKey === this.activeKey && this.decorations) return this.decorations;
          this.activeKey = nextKey;
          if (!active) return q.none;

          return q.set([
            q.line({ class: "cm-nested-tab-active-fence" }).range(doc.line(active.startLine).from),
            q.line({ class: "cm-nested-tab-active-fence" }).range(doc.line(active.endLine).from)
          ], true);
        }
      },
      { decorations: plugin => plugin.decorations }
    );
    this.basicMDKeymap = [
      {
        key: "Mod-b",
        run: (t) => (
          t.dispatch({
            changes: {
              from: t.state.selection.main.from,
              to: t.state.selection.main.to,
              insert: Rt(
                t.state.doc.sliceString(
                  t.state.selection.main.from,
                  t.state.selection.main.to,
                ),
                "**",
              ),
            },
          }),
          !0
        ),
      },
      {
        key: "*",
        run: (t) => (
          t.dispatch({
            changes: {
              from: t.state.selection.main.from,
              to: t.state.selection.main.to,
              insert:
                "*" +
                t.state.doc.sliceString(
                  t.state.selection.main.from,
                  t.state.selection.main.to,
                ) +
                "*",
            },
          }),
          !0
        ),
      },
      {
        key: "=",
        run: (t) => (
          t.dispatch({
            changes: {
              from: t.state.selection.main.from,
              to: t.state.selection.main.to,
              insert:
                "=" +
                t.state.doc.sliceString(
                  t.state.selection.main.from,
                  t.state.selection.main.to,
                ) +
                "=",
            },
          }),
          !0
        ),
      },
      {
        key: "Mod-i",
        run: (t) => (
          t.dispatch({
            changes: {
              from: t.state.selection.main.from,
              to: t.state.selection.main.to,
              insert: Rt(
                t.state.doc.sliceString(
                  t.state.selection.main.from,
                  t.state.selection.main.to,
                ),
                "*",
              ),
            },
          }),
          !0
        ),
      },
      {
        key: "Mod-u",
        run: (t) => (
          t.dispatch({
            changes: {
              from: t.state.selection.main.from,
              to: t.state.selection.main.to,
              insert: Rt(
                t.state.doc.sliceString(
                  t.state.selection.main.from,
                  t.state.selection.main.to,
                ),
                "<u>",
                "</u>",
              ),
            },
          }),
          !0
        ),
      },
      {
        key: "Ctrl-l",
        run: (t) => {
          let { from: e, to: i } = t.state.selection.main,
            n = t.state.doc.lineAt(e),
            r = n.text;
          if (r.length < 2)
            return (
              t.dispatch({ changes: { from: e, to: i, insert: "- " + r } }),
              !0
            );
          if (r.startsWith("- [ ] "))
            t.dispatch({
              changes: {
                from: n.from,
                to: n.to,
                insert: "- [x] " + r.slice(6),
              },
            });
          else if (r.startsWith("* [ ] "))
            t.dispatch({
              changes: { from: n.from, to: n.to, insert: "* [x]" + r.slice(6) },
            });
          else if (r.startsWith("- [x] "))
            t.dispatch({
              changes: { from: n.from, to: n.to, insert: "- " + r.slice(6) },
            });
          else if (r.startsWith("* [x] "))
            t.dispatch({
              changes: { from: n.from, to: n.to, insert: "* " + r.slice(6) },
            });
          else {
            if (r.startsWith("* "))
              return (
                t.dispatch({
                  changes: {
                    from: n.from,
                    to: n.to,
                    insert: "* [ ] " + r.slice(2),
                  },
                }),
                !0
              );
            if (r.startsWith("- "))
              return (
                t.dispatch({
                  changes: {
                    from: n.from,
                    to: n.to,
                    insert: "- [ ] " + r.slice(2),
                  },
                }),
                !0
              );
            t.dispatch({
              changes: { from: n.from, to: n.to, insert: "- " + r },
            });
          }
          return !0;
        },
      },
      {
        key: "$",
        run: (t) => (
          t.dispatch({
            changes: {
              from: t.state.selection.main.from,
              to: t.state.selection.main.to,
              insert:
                "$" +
                t.state.doc.sliceString(
                  t.state.selection.main.from,
                  t.state.selection.main.to,
                ) +
                "$",
            },
          }),
          !0
        ),
      },
      {
        key: "[",
        run: (t) => (
          t.dispatch({
            changes: {
              from: t.state.selection.main.from,
              to: t.state.selection.main.to,
              insert:
                "[" +
                t.state.doc.sliceString(
                  t.state.selection.main.from,
                  t.state.selection.main.to,
                ) +
                "]",
            },
          }),
          t.dispatch({
            selection: {
              anchor: t.state.selection.main.anchor + 1,
              head: t.state.selection.main.head + 1,
            },
          }),
          !0
        ),
      },
      {
        key: "{",
        run: (t) => (
          t.dispatch({
            changes: {
              from: t.state.selection.main.from,
              to: t.state.selection.main.to,
              insert:
                "{" +
                t.state.doc.sliceString(
                  t.state.selection.main.from,
                  t.state.selection.main.to,
                ) +
                "}",
            },
          }),
          t.dispatch({
            selection: {
              anchor: t.state.selection.main.anchor + 1,
              head: t.state.selection.main.head + 1,
            },
          }),
          !0
        ),
      },
      {
        key: "Tab",
        run: (t) => {
          let e = t.state.selection.main,
            i = t.state.doc.lineAt(e.from),
            n = t.state.doc.lineAt(e.to),
            r = " ".repeat(this.plugin.settings.tabSize) + i.text;
          for (let o = i.number + 1; o <= n.number; o++) {
            let a = t.state.doc.line(o);
            r +=
              `
` +
              " ".repeat(this.plugin.settings.tabSize) +
              a.text;
          }
          return (
            t.dispatch({ changes: { from: i.from, to: n.to, insert: r } }),
            e.from === e.to &&
              t.dispatch({
                selection: {
                  anchor: e.from + this.plugin.settings.tabSize,
                  head: e.to + this.plugin.settings.tabSize,
                },
              }),
            !0
          );
        },
      },
      {
        key: "Shift-Tab",
        run: (t) => {
          let e = t.state.selection.main,
            i = t.state.doc.lineAt(e.from),
            n = t.state.doc.lineAt(e.to),
            r = i.text.startsWith(" ".repeat(this.plugin.settings.tabSize))
              ? i.text.slice(this.plugin.settings.tabSize)
              : i.text;
          for (let o = i.number + 1; o <= n.number; o++) {
            let a = t.state.doc.line(o);
            a.text.startsWith(" ")
              ? a.text.length - a.text.trimStart().length >=
                this.plugin.settings.tabSize
                ? (r +=
                    `
` + a.text.slice(this.plugin.settings.tabSize))
                : (r +=
                    `
` + a.text.trimStart())
              : (r +=
                  `
` + a.text);
          }
          return (
            t.dispatch({ changes: { from: i.from, to: n.to, insert: r } }),
            !0
          );
        },
      },
      {
        key: "Ctrl-s",
        run: (t) => (this.plugin.tabsEditorModal.saveEditorData(), !0),
      },
      {
        key: "Mod-z",
        run: (t) => (wr({ state: t.state, dispatch: (e) => t.dispatch(e) }), !0),
      },
      {
        key: "Mod-y",
        run: (t) => (Kn({ state: t.state, dispatch: (e) => t.dispatch(e) }), !0),
      },
      {
        key: "Mod-Shift-z",
        run: (t) => (Kn({ state: t.state, dispatch: (e) => t.dispatch(e) }), !0),
      },
    ];
    this.plugin = t;
    if (t.settings.showToolbar) this.initToolbar(e);
    // Toolbar callbacks operate on this.view. Bind them only after CodeMirror
    // has been constructed so no handler depends on partially initialized state.
    this.initEditor(e, i, targetBlockInfo);
    if (t.settings.showToolbar) this.registerToolbarEvents();
  }
  addButton(t, e, i) {
    return new TO.ButtonComponent(this.editToolbarEl)
      .setIcon(t)
      .setTooltip(e)
      .setClass("toolbar-button")
      .setClass(i);
  }
  addSplitLine() {
    this.editToolbarEl.createSpan().addClass("split-line");
  }
  initToolbar(t) {
    ((this.editToolbarEl = t.createDiv()),
      this.editToolbarEl.addClass("toolbar"),
      this.initHistoryTool(),
      this.addSplitLine(),
      this.initFormatTool(),
      this.addSplitLine(),
      this.initParagraphTool(),
      this.addSplitLine(),
      this.initInsertTool());
  }
  initEditor(t, e = "", targetBlockInfo = null) {
    ((this.tabseditorEl = t.createDiv()),
      this.tabseditorEl.addClass("tabs-editor"));
    let i = A.updateListener.of((n) => {
      if (n.docChanged) {
        this.lastEditTime = Date.now();
        this.docChange = !0;
        if (this.plugin.tabsEditorModal) {
            this.plugin.tabsEditorModal.debounceSave();
        }
      }
    });
    let exts = [
      cd,
      fd,
      $O(),
      Zr(),
      Be.of(this.basicMDKeymap),
      this.activeLineHighlighter,
      this.nestedTabsHighlighter,
      this.activeNestedTabsHighlighter,
      this.activeNestedTabsInvariantTheme,
      this.codeBlockLivePreviewPlugin,
      ud,
      i,
    ];
    
    {
        let splitStr = this.plugin.settings.split;
        const ModalSelection = this.ModalSelection;
        const cursorSelectionAt = (position, assoc = 1) =>
            ModalSelection.create([ModalSelection.cursor(position, assoc)]);
        const getSeparatorOffset = (text) => {
            let leadingWhitespace = text.length - text.trimStart().length;
            return text.startsWith(splitStr, leadingWhitespace) ? leadingWhitespace : -1;
        };
        const protectedFenceLinesCache = new WeakMap();
        const getProtectedFenceLines = (doc) => {
            let cached = protectedFenceLinesCache.get(doc);
            if (cached) return cached;

            let protectedLines = new Set();
            let stack = [];
            let tabsInfo = this.modalTabsInfoRegex;

            for (let lineNo = 1; lineNo <= doc.lines; lineNo++) {
                let match = doc.line(lineNo).text.trim().match(/^(`{3,}|~{3,})(.*)$/);
                if (!match) continue;

                let fence = match[1];
                let info = match[2].trim();
                let current = stack.length ? stack[stack.length - 1] : null;
                let closesCurrent = current && info === "" &&
                  fence[0] === current.fence[0] && fence.length >= current.fence.length;

                if (current && current.type === "code") {
                    if (closesCurrent) stack.pop();
                    continue;
                }

                if (current && current.type === "tabs" && closesCurrent) {
                    stack.pop();
                    protectedLines.add(lineNo);
                    continue;
                }

                if (tabsInfo.test(info)) {
                    stack.push({ type: "tabs", fence, lineNo });
                    protectedLines.add(lineNo);
                } else {
                    stack.push({ type: "code", fence, lineNo });
                }
            }

            protectedFenceLinesCache.set(doc, protectedLines);
            return protectedLines;
        };
        const selectionTouchesProtectedStructure = (doc, range) => {
            if (range.empty) return false;

            let firstLine = doc.lineAt(range.from).number;
            let lastLine = doc.lineAt(Math.min(range.to, doc.length)).number;
            let protectedFences = getProtectedFenceLines(doc);
            for (let lineNo = firstLine; lineNo <= lastLine; lineNo++) {
                if (protectedFences.has(lineNo)) return true;

                let line = doc.line(lineNo);
                let splitOffset = getSeparatorOffset(line.text);
                if (splitOffset < 0) continue;

                let protectStart = line.from + splitOffset;
                let protectEnd = protectStart + splitStr.length;
                if (range.from < protectEnd && range.to > protectStart) return true;
            }
            return false;
        };
        const safeLineBreakTarget = (doc, range) => {
            let line = doc.lineAt(range.head);
            if (getProtectedFenceLines(doc).has(line.number)) return line.to;

            let splitOffset = getSeparatorOffset(line.text);
            if (splitOffset >= 0) {
                let protectEnd = line.from + splitOffset + splitStr.length;
                return Math.max(protectEnd, Math.min(range.head, line.to));
            }
            return range.head;
        };
        const insertSingleLineBreak = (view) => {
            if (view.state.readOnly) return false;

            let state = view.state;
            let edit = state.changeByRange((range) => {
                let target = safeLineBreakTarget(state.doc, range);
                let preserveStructure = selectionTouchesProtectedStructure(state.doc, range);
                let from = preserveStructure ? target : range.from;
                let to = preserveStructure ? target : range.to;
                return {
                    changes: { from, to, insert: "\n" },
                    range: ModalSelection.cursor(from + 1)
                };
            });

            view.dispatch(state.update(edit, {
                scrollIntoView: true,
                userEvent: "input"
            }));
            return true;
        };
        const protectStructuralBackspace = (view) => {
            let doc = view.state.doc;
            let protectedFences = getProtectedFenceLines(doc);

            for (let range of view.state.selection.ranges) {
                if (selectionTouchesProtectedStructure(doc, range)) return true;

                let line = doc.lineAt(range.head);
                if (protectedFences.has(line.number)) return true;

                let splitOffset = getSeparatorOffset(line.text);
                if (splitOffset >= 0) {
                    let protectEnd = line.from + splitOffset + splitStr.length;
                    if (range.empty && range.head === protectEnd) return true;
                }

                if (range.empty && range.head === line.from && line.number > 1 &&
                    protectedFences.has(line.number - 1)) {
                    return true;
                }
            }
            return false;
        };
        exts.push(I.transactionFilter.of(tr => {
            // Selection-only normalization. This filter must never reject a
            // document change—especially a line break—or act as a second
            // keyboard policy. Structural Backspace protection lives solely in
            // the highest-priority keymap below.
            // Normalize the resulting selection synchronously, including
            // transactions that also edit the document. A delayed corrective
            // dispatch can race with typing and move the caret behind text that
            // was just inserted.
            let resultDoc = tr.newDoc;
            let resultSelection = tr.newSelection;
            if (resultSelection && resultSelection.main) {
                let oldHeadPos = tr.startState.selection.main.head;
                let newRanges = resultSelection.ranges.map(r => {
                    let headPos = r.head;
                    let line = resultDoc.lineAt(headPos);
                    let text = line.text;
                    let splitOffset = getSeparatorOffset(text);
                    if (splitOffset >= 0) {
                        let protectStart = line.from;
                        let protectEnd = line.from + splitOffset + splitStr.length;
                        // A cursor can keep the same document position while being
                        // associated with either side of a replaced range. At the
                        // separator boundary it must belong to the visible title;
                        // otherwise CodeMirror draws it inside the hidden prefix.
                        let needsVisibleBoundaryAssoc =
                            r.empty && r.head === protectEnd && r.assoc !== 1;

                        let processPos = (pos) => {
                            if (pos >= protectStart && pos < protectEnd) {
                                if (!tr.docChanged && oldHeadPos === protectEnd && pos === protectEnd - 1) {
                                    let prevLineNo = Math.max(1, line.number - 1);
                                    return resultDoc.line(prevLineNo).to;
                                }
                                return protectEnd;
                            }
                            return pos;
                        };

                        let newHead = processPos(r.head);
                        let newAnchor = processPos(r.anchor);
                        if (needsVisibleBoundaryAssoc || newHead !== r.head || newAnchor !== r.anchor) {
                            return r.empty
                              ? ModalSelection.cursor(newHead, 1)
                              : ModalSelection.range(newAnchor, newHead);
                        }
                    }
                    return r;
                });
                let hasChanged = newRanges.some((r, idx) => {
                    let previous = resultSelection.ranges[idx];
                    return r.head !== previous.head || r.anchor !== previous.anchor || r.assoc !== previous.assoc;
                });
                if (hasChanged) {
                    return {
                        changes: tr.changes,
                        selection: ModalSelection.create(newRanges, resultSelection.mainIndex),
                        effects: tr.effects,
                        annotations: tr.annotations,
                        scrollIntoView: tr.scrollIntoView
                    };
                }
            }

            return tr;
        }));

        let atomicRangesDoc = null;
        let atomicRangesCache = q.none;
        exts.push(A.atomicRanges.of(view => {
            try {
                let splitStr = this.plugin.settings.split;
                let doc = view.state.doc;
                if (doc === atomicRangesDoc) return atomicRangesCache;
                let i = [];
                for (let p = 1; p <= doc.lines; p++) {
                    let line = doc.line(p);
                    let splitOffset = getSeparatorOffset(line.text);
                    if (splitOffset >= 0) {
                        let protectStart = line.from;
                        let protectEnd = line.from + splitOffset + splitStr.length;
                        if (protectStart < protectEnd) {
                            i.push(q.replace({ inclusive: false }).range(protectStart, protectEnd));
                        }
                    }
                }
                atomicRangesDoc = doc;
                atomicRangesCache = q.set(i, true);
                return atomicRangesCache;
            } catch (err) {
                console.error("Tabs Extended atomic range calculation error:", err);
                throw err;
            }
        }));

        const separatorMouseTarget = (view, event) => {
            let target = event && event.target;
            if (target && target.closest && target.closest(".tabs-delete-button")) return null;

            let pos = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
            if (pos === null) return null;

            let line = view.state.doc.lineAt(pos);
            let splitOffset = getSeparatorOffset(line.text);
            if (splitOffset < 0) return null;

            let protectEnd = line.from + splitOffset + splitStr.length;
            let targetPos = Math.max(protectEnd, Math.min(pos, line.to));
            let assoc = targetPos === protectEnd
              ? 1
              : targetPos === line.to
                ? -1
                : 0;
            return { pos: targetPos, assoc };
        };

        // Use CodeMirror's mouse-selection lifecycle instead of cancelling a
        // mousedown and dispatching an ad-hoc selection. This keeps focus,
        // dragging, atomic ranges and the synthetic cursor in one pipeline.
        exts.push(A.mouseSelectionStyle.of((view, event) => {
            if (event.button !== 0 || event.detail > 1) return null;
            let startHit = separatorMouseTarget(view, event);
            if (!startHit) return null;

            let startPos = startHit.pos;
            let startAssoc = startHit.assoc;
            let startSelection = view.state.selection;
            return {
                update(update) {
                    if (update.docChanged) {
                        startPos = update.changes.mapPos(startPos, 1);
                        startSelection = startSelection.map(update.changes);
                    }
                    return false;
                },
                get(pointerEvent, extend, multiple) {
                    let hit = separatorMouseTarget(view, pointerEvent);
                    let targetPos = hit
                      ? hit.pos
                      : view.posAtCoords({ x: pointerEvent.clientX, y: pointerEvent.clientY }, false);
                    if (targetPos === null) targetPos = startPos;

                    if (extend) {
                        return startSelection.replaceRange(
                          startSelection.main.extend(targetPos, targetPos)
                        );
                    }
                    if (multiple) {
                        return startSelection.addRange(ModalSelection.cursor(targetPos, hit ? hit.assoc : 0));
                    }
                    if (targetPos !== startPos) {
                        return ModalSelection.create([ModalSelection.range(startPos, targetPos)]);
                    }
                    return cursorSelectionAt(targetPos, hit ? hit.assoc : startAssoc);
                }
            };
        }));

        exts.push(A.inputHandler.of((view, from, to, text) => {
            try {
                let splitStr = this.plugin.settings.split;
                let doc = view.state.doc;
                let line = doc.lineAt(from);
                let splitOffset = getSeparatorOffset(line.text);
                if (splitOffset >= 0) {
                    // Enter is handled once, at highest priority, by the keymap
                    // registered below. Handling newlines here as well produced
                    // duplicate blank lines.
                    if (text.includes("\n")) return false;
                    // Let CodeMirror keep ownership of an active IME
                    // composition and normalize the committed text afterwards.
                    if (view.composing) return false;
                    let protectEnd = line.from + splitOffset + splitStr.length;
                    // Own every single-line title edit, not only the first
                    // character at protectEnd. Returning later characters to
                    // the contenteditable DOM lets its caret diverge from the
                    // endpoint widget while CodeMirror's logical selection keeps
                    // advancing.
                    if (from >= line.from && from <= line.to && to <= line.to) {
                        let targetFrom = Math.max(from, protectEnd);
                        let targetTo = Math.max(to, protectEnd);
                        let targetPos = targetFrom + text.length;
                        let nextLineEnd = line.to + text.length - (targetTo - targetFrom);
                        let targetAssoc = targetPos === protectEnd
                          ? 1
                          : targetPos === nextLineEnd
                            ? -1
                            : 0;
                        view.dispatch({
                            changes: { from: targetFrom, to: targetTo, insert: text },
                            selection: cursorSelectionAt(targetPos, targetAssoc),
                            userEvent: "input"
                        });
                        return true;
                    }
                }
            } catch (err) {}
            return false;
        }));

        const safeHighest = (ext) => {
            try {
                if (typeof be !== "undefined" && typeof be.highest === "function") return be.highest(ext);
                if (typeof Wd !== "undefined" && typeof Wd.highest === "function") return Wd.highest(ext);
            } catch (e) {}
            return ext;
        };

        const moveFromSeparatorStart = (view, direction) => {
            try {
                let sel = view.state.selection.main;
                if (!sel.empty) return false;

                let doc = view.state.doc;
                let line = doc.lineAt(sel.head);
                let splitStr = this.plugin.settings.split;
                let splitOffset = getSeparatorOffset(line.text);
                if (splitOffset < 0) return false;

                let separatorTextStart = line.from + splitOffset + splitStr.length;
                if (sel.head !== separatorTextStart) return false;

                let targetLineNo = line.number + direction;
                if (targetLineNo < 1 || targetLineNo > doc.lines) return true;

                let targetLine = doc.line(targetLineNo);
                let targetSplitOffset = getSeparatorOffset(targetLine.text);
                    let targetPos;
                    let targetAssoc = 1;

                    if (targetSplitOffset >= 0) {
                        targetPos = targetLine.from + targetSplitOffset + splitStr.length;
                    } else if (/^\s*(`{3,}|~{3,})/.test(targetLine.text)) {
                        targetPos = targetLine.to;
                        targetAssoc = -1;
                    } else {
                        targetPos = targetLine.from;
                    }

                    view.dispatch({ selection: cursorSelectionAt(targetPos, targetAssoc), scrollIntoView: true });
                return true;
            } catch (err) {
                console.error("Tabs Extended vertical cursor navigation error:", err);
                return false;
            }
        };

        exts.push(safeHighest(Be.of([
            {
                key: "ArrowLeft",
                run: (view) => {
                    try {
                        let sel = view.state.selection.main;
                        if (sel.empty) {
                            let line = view.state.doc.lineAt(sel.head);
                            let splitStr = this.plugin.settings.split;
                            let splitOffset = getSeparatorOffset(line.text);
                            if (splitOffset >= 0) {
                                let protectStart = line.from;
                                let protectEnd = line.from + splitOffset + splitStr.length;
                                if (sel.head === protectEnd) {
                                    let prevLineNo = Math.max(1, line.number - 1);
                                    view.dispatch({ selection: cursorSelectionAt(view.state.doc.line(prevLineNo).to, -1) });
                                    return true;
                                } else if (sel.head > protectStart && sel.head < protectEnd) {
                                    view.dispatch({ selection: cursorSelectionAt(protectEnd, 1) });
                                    return true;
                                }
                            }
                        }
                    } catch (err) {}
                    return false;
                }
            },
            {
                key: "ArrowRight",
                run: (view) => {
                    try {
                        let sel = view.state.selection.main;
                        if (sel.empty) {
                            let line = view.state.doc.lineAt(sel.head);
                            let splitStr = this.plugin.settings.split;
                            let splitOffset = getSeparatorOffset(line.text);
                            if (splitOffset >= 0) {
                                let protectStart = line.from;
                                let protectEnd = line.from + splitOffset + splitStr.length;
                                if (sel.head >= protectStart && sel.head < protectEnd) {
                                    view.dispatch({ selection: cursorSelectionAt(protectEnd, 1) });
                                    return true;
                                }
                            }
                        }
                    } catch (err) {}
                    return false;
                }
            },
            {
                key: "ArrowUp",
                run: (view) => {
                    try {
                        if (moveFromSeparatorStart(view, -1)) return true;
                        let sel = view.state.selection.main;
                        let line = view.state.doc.lineAt(sel.head);
                        if (line.number > 1) {
                            let prevLine = view.state.doc.line(line.number - 1);
                            let splitStr = this.plugin.settings.split;
                            let splitOffset = getSeparatorOffset(prevLine.text);
                            if (splitOffset >= 0) {
                                let protectEnd = prevLine.from + splitOffset + splitStr.length;
                                let col = sel.head - line.from;
                                let targetPos = Math.max(protectEnd, prevLine.from + col);
                                targetPos = Math.min(prevLine.to, targetPos);
                                let targetAssoc = targetPos === protectEnd ? 1 : targetPos === prevLine.to ? -1 : 0;
                                view.dispatch({ selection: cursorSelectionAt(targetPos, targetAssoc) });
                                return true;
                            }
                        }
                    } catch (err) {}
                    return false;
                }
            },
            {
                key: "ArrowDown",
                run: (view) => {
                    try {
                        if (moveFromSeparatorStart(view, 1)) return true;
                        let sel = view.state.selection.main;
                        let line = view.state.doc.lineAt(sel.head);
                        if (line.number < view.state.doc.lines) {
                            let nextLine = view.state.doc.line(line.number + 1);
                            let splitStr = this.plugin.settings.split;
                            let splitOffset = getSeparatorOffset(nextLine.text);
                            if (splitOffset >= 0) {
                                let protectEnd = nextLine.from + splitOffset + splitStr.length;
                                let col = sel.head - line.from;
                                let targetPos = Math.max(protectEnd, nextLine.from + col);
                                targetPos = Math.min(nextLine.to, targetPos);
                                let targetAssoc = targetPos === protectEnd ? 1 : targetPos === nextLine.to ? -1 : 0;
                                view.dispatch({ selection: cursorSelectionAt(targetPos, targetAssoc) });
                                return true;
                            }
                        }
                    } catch (err) {}
                    return false;
                }
            },
            {
                key: "Enter",
                run: insertSingleLineBreak,
                shift: insertSingleLineBreak
            },
            {
                key: "Home",
                run: (view) => {
                    try {
                        let sel = view.state.selection.main;
                        let line = view.state.doc.lineAt(sel.head);
                        let splitStr = this.plugin.settings.split;
                        let splitOffset = getSeparatorOffset(line.text);
                        if (splitOffset >= 0) {
                            let protectEnd = line.from + splitOffset + splitStr.length;
                            view.dispatch({ selection: cursorSelectionAt(protectEnd, 1) });
                            return true;
                        }
                    } catch (err) {}
                    return false;
                }
            },
            {
                key: "Backspace",
                run: protectStructuralBackspace,
                shift: protectStructuralBackspace
            },
            {
                key: "Mod-Backspace",
                mac: "Alt-Backspace",
                run: protectStructuralBackspace
            }
        ])));
    }

    this.state = I.create({
      doc: e,
      extensions: exts,
    });
    if (!(this.state.selection instanceof this.ModalSelection)) {
      throw new Error("Tabs Extended modal initialized with an incompatible CodeMirror selection runtime");
    }
    this.view = new A({
      state: this.state,
      parent: this.tabseditorEl,
      extensions: [A.lineWrapping],
    });
      
    if (!window.tabsExtActiveViews) window.tabsExtActiveViews = [];
    if (!window.tabsExtActiveViews.includes(this.view)) window.tabsExtActiveViews.push(this.view);
    if (targetBlockInfo) {
      this.focusTargetBlock(targetBlockInfo);
    }
  }
  focusTargetBlock(targetBlockInfo) {
    if (!this.view || !targetBlockInfo) return;
    try {
      const doc = this.view.state.doc;
      const docText = doc.toString();
      const { snippet, language } = targetBlockInfo;
      let targetPos = -1;

      if (language) {
        const fenceRegex = new RegExp("(?:^|\\n)[ \t]*(`{3,}|~{3,})\\s*" + language.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\b", "i");
        const match = docText.match(fenceRegex);
        if (match && match.index !== undefined) {
          targetPos = match[0].startsWith("\n") ? match.index + 1 : match.index;
        }
      }

      if (snippet && targetPos === -1) {
        const cleanSnippet = snippet.trim().split("\n")[0].trim();
        if (cleanSnippet.length > 2) {
          const idx = docText.indexOf(cleanSnippet);
          if (idx !== -1) {
            targetPos = idx;
          }
        }
      }

      if (targetPos === -1 && (language || snippet)) {
        const generalFence = docText.search(/(?:^|\\n)[ \t]*(`{3,}|~{3,})/);
        if (generalFence !== -1) {
          targetPos = docText[generalFence] === "\n" ? generalFence + 1 : generalFence;
        }
      }

      if (targetPos >= 0 && targetPos <= doc.length) {
        const line = doc.lineAt(targetPos);
        const nextLineNo = Math.min(doc.lines, line.number + 1);
        const contentLine = doc.line(nextLineNo);

        this.view.dispatch({
          selection: this.ModalSelection.cursor(contentLine.from),
          scrollIntoView: true
        });

        setTimeout(() => {
          if (this.view && !this.view.destroyed) {
            this.view.focus();
            this.view.dispatch({
              selection: this.ModalSelection.cursor(contentLine.from),
              scrollIntoView: true
            });
          }
        }, 60);
      }
    } catch (err) {
      console.warn("Tabs Extended: could not focus target block in modal editor:", err);
    }
  }
  initHistoryTool() {
    this.historyTools.push(
      this.addButton("undo", "Undo (Ctrl+Z)", "undo-button"),
      this.addButton("redo", "Redo (Ctrl+Shift+Z)", "redo-button"),
    );
  }
  initFormatTool() {
    let boldButton = this.addButton("bold", "Bold (Ctrl+B)", "bold-button");
    let italicButton = this.addButton("italic", "Italic (Ctrl+I)", "italic-button");
    let underlineButton = this.addButton("underline", "Underline (Ctrl+U)", "underline-button");
    let strikeButton = this.addButton("strikethrough", "Strike (Ctrl+Shift+S)", "strike-button");
    let highlightButton = this.addButton("highlighter", "Highlight", "highlight-button");
    this.addMainTabButton = this.addButton("plus-square", "Add Main Tab", "add-main-tab-button");
    this.nestedTabsHorizontalButton = this.addButton("layout-template", "Horizontal Nested Tabs", "nested-tabs-horizontal-button");
    this.nestedTabsVerticalButton = this.addButton("sidebar", "Vertical Nested Tabs", "nested-tabs-vertical-button");
    this.formatTools = [
      boldButton,
      italicButton,
      underlineButton,
      strikeButton,
      highlightButton,
      this.addMainTabButton,
      this.nestedTabsHorizontalButton,
      this.nestedTabsVerticalButton,
    ];
  }
  insertNestedTabsBlock(isVertical) {
    if (!this.view || this.view.destroyed) {
      console.error("Tabs Extended nested toolbar insertion error: editor view is not available");
      try { new TO.Notice("Tabs Extended: el editor modal todavía no está disponible."); } catch (err) {}
      return false;
    }
    let doc = this.view.state.doc;
    let sel = this.view.state.selection.main;
    let cursorPos = sel.head;
    let cursorLine = doc.lineAt(cursorPos).number;
    let fenceStack = [];

    let tabInfoRegex = this.modalTabsInfoRegex;

    for (let p = 1; p < cursorLine; p++) {
      let text = doc.line(p).text.trim();
      let match = text.match(/^(`{3,}|~{3,})(.*)/);
      if (!match) continue;

      let fenceStr = match[1];
      let info = match[2].trim();
      let current = fenceStack.length > 0 ? fenceStack[fenceStack.length - 1] : null;

      if (current && current.type === "code") {
        if (fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && info === "")
          fenceStack.pop();
        continue;
      }

      if (current && fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && info === "") {
        fenceStack.pop();
      } else {
        let isTabBlock = tabInfoRegex.test(info);
        fenceStack.push({ fence: fenceStr, type: isTabBlock ? "tabs" : "code" });
      }
    }

    let cursorDepth = fenceStack.filter(f => f.type === "tabs").length;
    let parent = [...fenceStack].reverse().find(f => f.type === "tabs");
    let parentFenceLen = parent ? parent.fence.length : 3;

    let newFenceLen = cursorDepth === 0 ? 3 : Math.max(3, parentFenceLen - 1);
    let fence = "~".repeat(newFenceLen);

    let insertFrom = sel.from;
    let insertTo = sel.to;
    let selectedText = doc.sliceString(insertFrom, insertTo);
    let split = this.plugin.settings.split;
    let baseKw = (this.plugin.settings.tabsKeyword || "tabs").trim();
    let kw = isVertical ? (baseKw + "-v") : baseKw;

    // A toolbar insertion requested from a title belongs to that tab's content,
    // not in the middle of its protected separator line.
    if (sel.empty) {
      let currentLine = doc.lineAt(sel.head);
      let leadingWhitespace = currentLine.text.length - currentLine.text.trimStart().length;
      if (currentLine.text.startsWith(split, leadingWhitespace)) {
        insertFrom = currentLine.to;
        insertTo = currentLine.to;
        selectedText = "";
      }
    }

    let targetCursor = insertFrom + ("\n" + fence + kw + "\n" + split).length;
    let insertText = "\n" + fence + kw + "\n" + split + (selectedText ? selectedText + "\n" : "\n") + fence + "\n";

    try {
      this.view.dispatch({
        changes: { from: insertFrom, to: insertTo, insert: insertText },
        selection: this.ModalSelection.create([
          this.ModalSelection.cursor(targetCursor, 1)
        ]),
        scrollIntoView: true,
        // Keep the toolbar insertion atomic and independent from selection
        // normalization. The explicit visual refresh below remains responsible
        // for attaching every new fence, widget and control immediately.
        filter: false,
      });
      this.view.focus();
      if (typeof this.view.requestMeasure === "function") this.view.requestMeasure();
      activeWindow.requestAnimationFrame(() => {
        if (!this.view || this.view.destroyed) return;
        // Force a second, cheap visual pass after CodeMirror has attached the
        // new lines to the DOM. This is what reopening the modal used to do.
        this.view.dispatch({
          effects: this.forceNestedTabsRefreshEffect.of(true),
          filter: false,
        });
        if (typeof this.view.requestMeasure === "function") this.view.requestMeasure();
        this.view.focus();
      });
      return true;
    } catch (err) {
      console.error("Tabs Extended nested toolbar insertion error:", err);
      try { new TO.Notice("Tabs Extended: no se pudo insertar el bloque de pestañas."); } catch (noticeErr) {}
      return false;
    }
  }
  insertMainTab() {
    let doc = this.view.state.doc;
    let cursorPos = this.view.state.selection.main.head;
    let cursorLine = doc.lineAt(cursorPos).number;
    let splitStr = this.plugin.settings.split;
    let defaultTitle = this.plugin.settings.defaultTabNavItem || "New tab";
    let defaultContent = this.plugin.settings.defaultTabContent || "New tab content";

    let fenceStack = [];
    let tabInfoRegex = this.modalTabsInfoRegex;

    let insertLineNo = doc.lines;

    for (let p = 1; p <= doc.lines; p++) {
      let line = doc.line(p);
      let text = line.text.trim();
      let match = text.match(/^(`{3,}|~{3,})(.*)/);
      if (match) {
        let fenceStr = match[1];
        let info = match[2].trim();
        let current = fenceStack.length > 0 ? fenceStack[fenceStack.length - 1] : null;
        if (current && current.type === "code") {
          if (fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && info === "") fenceStack.pop();
        } else if (current && fenceStr.length >= current.fence.length && fenceStr[0] === current.fence[0] && info === "") {
          fenceStack.pop();
        } else {
          let isTabBlock = tabInfoRegex.test(info);
          fenceStack.push({ fence: fenceStr, type: isTabBlock ? "tabs" : "code" });
        }
      }

      if (p > cursorLine && fenceStack.length === 0 && text.startsWith(splitStr)) {
        insertLineNo = p - 1;
        break;
      }
    }

    let insertLine = doc.line(insertLineNo);
    let insertPos = insertLine.to;
    let insertText = "\n\n" + splitStr + defaultTitle + "\n" + defaultContent;
    let newTitlePos = insertPos + 2 + splitStr.length;

    this.view.dispatch({
      changes: { from: insertPos, insert: insertText },
      selection: { anchor: newTitlePos, head: newTitlePos + defaultTitle.length }
    });
  }
  initParagraphTool() {
    this.paragraphTools = [
      this.addButton("list", "Unordered List", "unordered-list-button"),
      this.addButton(
        "list-ordered",
        "Ordered List",
        "ordered-list-button",
      ),
      this.addButton("quote", "Quote", "quote-button"),
    ];
  }
  initInsertTool() {
    this.insertTools = [
      this.addButton("code", "Code", "code-button"),
      this.addButton("quote", "Callout", "callout-button"),
      this.addButton("table", "Table", "table-button"),
    ];
  }
  registerToolbarEvents() {
    // Bind the two structural actions independently and first. An unrelated
    // formatting-button failure must never leave them without a click handler.
    this.registerNestedTabsToolEvents();
    this.registerHistoryToolEvents();
    this.registerFormatToolEvents();
    this.registerPragraphToolEvents();
    this.registerInsertToolEvents();
  }
  registerNestedTabsToolEvents() {
    if (this.nestedTabsHorizontalButton) {
      this.nestedTabsHorizontalButton.onClick(() => {
        this.insertNestedTabsBlock(false);
      });
    }
    if (this.nestedTabsVerticalButton) {
      this.nestedTabsVerticalButton.onClick(() => {
        this.insertNestedTabsBlock(true);
      });
    }
  }
  registerHistoryToolEvents() {
    (this.historyTools[0].onClick(() => {
      wr({ state: this.view.state, dispatch: (t) => this.view.dispatch(t) });
    }),
      this.historyTools[1].onClick(() => {
        Kn({ state: this.view.state, dispatch: (t) => this.view.dispatch(t) });
      }));
  }
  registerFormatToolEvents() {
    (this.formatTools[0].onClick(() => {
      let { from: t, to: e } = this.view.state.selection.main,
        i = this.view.state.doc.lineAt(t),
        n = this.view.state.doc.lineAt(e);
      if (i.number === n.number)
        this.view.dispatch({
          changes: {
            from: t,
            to: e,
            insert: Rt(
              this.view.state.doc.sliceString(
                this.view.state.selection.main.from,
                this.view.state.selection.main.to,
              ),
              "**",
            ),
          },
        });
      else {
        let r = Rt(
          this.view.state.doc.sliceString(
            this.view.state.selection.main.from,
            i.to,
          ),
          "**",
        );
        for (let o = i.number; o < n.number; o++) {
          let a = this.view.state.doc.line(o);
          r +=
            `
` + Rt(a.text, "**");
        }
        ((r +=
          `
` +
          Rt(
            this.view.state.doc.sliceString(
              n.from,
              this.view.state.selection.main.to,
            ),
            "**",
          )),
          this.view.dispatch({ changes: { from: t, to: e, insert: r } }));
      }
    }),
      this.formatTools[1].onClick(() => {
        let { from: t, to: e } = this.view.state.selection.main,
          i = this.view.state.doc.lineAt(t),
          n = this.view.state.doc.lineAt(e);
        if (i.number === n.number)
          this.view.dispatch({
            changes: {
              from: t,
              to: e,
              insert: Rt(
                this.view.state.doc.sliceString(
                  this.view.state.selection.main.from,
                  this.view.state.selection.main.to,
                ),
                "*",
              ),
            },
          });
        else {
          let r = Rt(
            this.view.state.doc.sliceString(
              this.view.state.selection.main.from,
              i.to,
            ),
            "*",
          );
          for (let o = i.number; o < n.number; o++) {
            let a = this.view.state.doc.line(o);
            r +=
              `
` + Rt(a.text, "*");
          }
          ((r +=
            `
` +
            Rt(
              this.view.state.doc.sliceString(
                n.from,
                this.view.state.selection.main.to,
              ),
              "*",
            )),
            this.view.dispatch({ changes: { from: t, to: e, insert: r } }));
        }
      }),
      this.formatTools[2].onClick(() => {
        this.view.dispatch({
          changes: {
            from: this.view.state.selection.main.from,
            to: this.view.state.selection.main.to,
            insert: Rt(
              this.view.state.doc.sliceString(
                this.view.state.selection.main.from,
                this.view.state.selection.main.to,
              ),
              "<u>",
              "</u>",
            ),
          },
        });
      }),
      this.formatTools[3].onClick(() => {
        this.view.dispatch({
          changes: {
            from: this.view.state.selection.main.from,
            to: this.view.state.selection.main.to,
            insert: Rt(
              this.view.state.doc.sliceString(
                this.view.state.selection.main.from,
                this.view.state.selection.main.to,
              ),
              "~~",
            ),
          },
        });
      }),
      this.formatTools[4].onClick(() => {
        this.view.dispatch({
          changes: {
            from: this.view.state.selection.main.from,
            to: this.view.state.selection.main.to,
            insert: Rt(
              this.view.state.doc.sliceString(
                this.view.state.selection.main.from,
                this.view.state.selection.main.to,
              ),
              "==",
            ),
          },
        });
      }),
      this.formatTools[5].onClick(() => {
        this.insertMainTab();
      }));

  }
  registerPragraphToolEvents() {
    (this.paragraphTools[0].onClick(() => {
      let t = this.view.state.selection.main,
        e = this.view.state.doc.lineAt(t.from),
        i = this.view.state.doc.lineAt(t.to),
        n = !1;
      for (let r = e.number; r <= i.number; r++)
        if (!this.view.state.doc.line(r).text.trimStart().startsWith("- ")) {
          n = !0;
          break;
        }
      if (n)
        for (let r = e.number; r <= i.number; r++) {
          let o = this.view.state.doc.line(r);
          o.text.trimStart().startsWith("- ") ||
            this.view.dispatch({
              changes: {
                from: o.from,
                to: o.to,
                insert:
                  " ".repeat(o.text.length - o.text.trimStart().length) +
                  "- " +
                  o.text.trimStart(),
              },
            });
        }
      else
        for (let r = e.number; r <= i.number; r++) {
          let o = this.view.state.doc.line(r);
          !o.text.trimStart().startsWith("- ") ||
            this.view.dispatch({
              changes: {
                from: o.from,
                to: o.to,
                insert:
                  o.text.slice(0, o.text.indexOf("- ")) +
                  o.text.slice(o.text.indexOf("- ") + 2),
              },
            });
        }
    }),
      this.paragraphTools[1].onClick(() => {
        let t = this.view.state.selection.main,
          e = this.view.state.doc.lineAt(t.from),
          i = this.view.state.doc.lineAt(t.to),
          n = !1,
          r = (l) => {
            let h = l.indexOf(". ");
            return h > 0 && !isNaN(parseInt(l.slice(0, h)));
          };
        for (let l = e.number; l <= i.number; l++) {
          let h = this.view.state.doc.line(l);
          if (!r(h.text.trimStart())) {
            n = !0;
            break;
          }
        }
        let o = {},
          a = e.text.length - e.text.trimStart().length;
        if (e.number > 1)
          for (
            let l = e.number - 1;
            l > 0 && r(this.view.state.doc.line(l).text.trimStart());
            l--
          ) {
            let h = this.view.state.doc.line(l).text,
              c = h.length - h.trimStart().length;
            if (c > a) {
              o[c] = 1;
              continue;
            } else if (c === a) {
              let f = parseInt(h.slice(0, h.indexOf(". ")));
              o[a] || (o[a] = f + 1);
            } else
              ((a = c), (o[a] = parseInt(h.slice(0, h.indexOf(". "))) + 1));
          }
        if (n)
          for (let l = e.number; l <= i.number; l++) {
            let h = this.view.state.doc.line(l),
              c = h.text,
              f = h.text.length - h.text.trimStart().length;
            (o[f] === void 0 && (o[f] = 1),
              (c = r(h.text.trimStart())
                ? o[f].toString() + h.text.slice(h.text.indexOf(". ") + 2)
                : (c = o[f].toString() + ". " + h.text.trimStart())),
              o[f]++);
            for (let u in o) parseInt(u) > f && (o[u] = 1);
            this.view.dispatch({
              changes: { from: h.from, to: h.to, insert: " ".repeat(f) + c },
            });
          }
        else
          for (let l = e.number; l <= i.number; l++) {
            let h = this.view.state.doc.line(l),
              c = h.text.length - h.text.trimStart().length;
            this.view.dispatch({
              changes: {
                from: h.from,
                to: h.to,
                insert: " ".repeat(c) + h.text.slice(h.text.indexOf(". ") + 2),
              },
            });
          }
      }),
      this.paragraphTools[2].onClick(() => {
        let t = this.view.state.selection.main,
          e = this.view.state.doc.lineAt(t.from),
          i = this.view.state.doc.lineAt(t.to),
          n = !1;
        for (let r = e.number; r <= i.number; r++)
          if (!this.view.state.doc.line(r).text.trimStart().startsWith("> ")) {
            n = !0;
            break;
          }
        if (n)
          for (let r = e.number; r <= i.number; r++) {
            let o = this.view.state.doc.line(r);
            this.view.dispatch({
              changes: { from: o.from, to: o.to, insert: "> " + o.text },
            });
          }
        else
          for (let r = e.number; r <= i.number; r++) {
            let o = this.view.state.doc.line(r);
            this.view.dispatch({
              changes: { from: o.from, to: o.to, insert: o.text.slice(2) },
            });
          }
      }));
  }
  registerInsertToolEvents() {
    (this.insertTools[0].onClick(() => {
      let t = this.view.state.selection.main,
        e = dd(this.view.state.doc.sliceString(t.from, t.to));
      this.view.dispatch({ changes: { from: t.from, to: t.to, insert: e } });
    }),
      this.insertTools[1].onClick(() => {
        let t = this.view.state.selection.main,
          e = this.view.state.doc.lineAt(t.from),
          i = this.view.state.doc.lineAt(t.to);
        for (let n = e.number; n <= i.number; n++) {
          let r = this.view.state.doc.line(n);
          this.view.dispatch({
            changes: { from: r.from, to: r.to, insert: "> " + r.text },
          });
        }
        this.view.dispatch({
          changes: {
            from: e.from,
            to: e.from,
            insert: `> [!NOTE] Title
`,
          },
        });
      }),
      this.insertTools[2].onClick(() => {
        let t = new Na(this),
          e = this.insertTools[2].buttonEl.getBoundingClientRect().left,
          i = this.insertTools[2].buttonEl.getBoundingClientRect().bottom;
        t.showAtPosition({ x: e, y: i });
      }));
  }
  createEmptyTable(t, e) {
    let i = [];
    (i.push(Array(e).fill("   ")), i.push(Array(e).fill(":-:")));
    for (let a = 0; a < t; a++) {
      let l = [];
      for (let h = 0; h < e; h++) l.push("   ");
      i.push(l);
    }
    let n = i.map((a) => "| " + a.join(" | ") + " |").join(`
`),
      r = this.view.state.selection;
    if (r.ranges.some((a) => a.empty === !1))
      this.view.state.doc.lineAt(r.main.from).from !== r.main.from
        ? this.view.dispatch({
            changes: {
              from: this.view.state.selection.main.from,
              to: this.view.state.selection.main.to,
              insert:
                `

` + n,
            },
          })
        : this.view.dispatch({
            changes: {
              from: this.view.state.selection.main.from,
              to: this.view.state.selection.main.to,
              insert: n,
            },
          });
    else {
      this.view.dispatch({
        changes: {
          from: this.view.state.doc.length,
          to: this.view.state.doc.length,
          insert:
            `

` + n,
        },
      });
      return;
    }
  }
};
