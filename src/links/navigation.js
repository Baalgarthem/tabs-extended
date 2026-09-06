/**
 * Specialized module for interactive link handling, external links,
 * internal wikilinks, footnotes and linker / hover preview compatibility.
 */

/**
 * Attaches comprehensive link event listeners to a tabs content container.
 * 
 * @param {HTMLElement} container - The tab content container element
 * @param {App} app - Obsidian App instance
 * @param {string} sourcePath - The current note's file path
 */
export function setupLinkInteractions(container, app, sourcePath) {
  if (!container || container.hasTabsExtLinkHandler) return;
  container.hasTabsExtLinkHandler = true;

  // 1. Delegated click handler for all link types
  container.addEventListener("click", (evt) => {
    const target = evt.target instanceof Element
      ? evt.target
      : (evt.target && evt.target.parentElement instanceof Element ? evt.target.parentElement : null);
    if (!target) return;

    const link = target.closest("a");
    if (!link) return;

    const rawHref = link.getAttribute("href") || link.dataset.href || "";
    if (!rawHref) return;

    // 1. Footnote jumps (#fn-..., #fnref-...)
    if (/^#fn(ref)?-/i.test(rawHref)) {
      evt.preventDefault();
      evt.stopPropagation();
      const targetEl = container.querySelector(rawHref) || document.querySelector(rawHref);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        targetEl.classList.add("is-flashing");
        setTimeout(() => targetEl.classList.remove("is-flashing"), 1200);
      }
      return;
    }

    // 2. External links (https://, http://, mailto:, file: or .external-link)
    if (/^(https?:\/\/|mailto:|file:)/i.test(rawHref) || link.classList.contains("external-link")) {
      evt.preventDefault();
      evt.stopPropagation();
      window.open(rawHref, "_blank");
      return;
    }

    // 3. Internal wikilinks / Obsidian note references / Linker compatibility
    if (link.classList.contains("internal-link") || link.dataset.href || !rawHref.includes("://")) {
      evt.preventDefault();
      evt.stopPropagation();
      const isNewTab = evt.ctrlKey || evt.metaKey || evt.button === 1;
      const cleanHref = link.dataset.href || rawHref;
      if (app && app.workspace && typeof app.workspace.openLinkText === "function") {
        app.workspace.openLinkText(cleanHref, sourcePath, isNewTab);
      }
    }
  });

  // 2. Hover preview support for Obsidian popovers & Linker compatibility
  container.addEventListener("mouseover", (evt) => {
    const target = evt.target instanceof Element ? evt.target : null;
    if (!target) return;

    const link = target.closest("a.internal-link, a[data-href]");
    if (!link) return;

    const linktext = link.dataset.href || link.getAttribute("href") || "";
    if (!linktext || /^(https?:\/\/|mailto:|file:)/i.test(linktext)) {
      return;
    }

    if (app && app.workspace && typeof app.workspace.trigger === "function") {
      app.workspace.trigger("hover-link", {
        event: evt,
        source: "tabs-extended",
        hoverParent: container,
        targetEl: link,
        linktext: linktext,
        sourcePath: sourcePath,
      });
    }
  });
}
