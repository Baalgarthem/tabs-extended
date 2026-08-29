import assert from 'node:assert/strict';
import {
  extractReferenceDefinitions,
  augmentContentWithDocumentDefinitions,
  setupLinkInteractions,
} from '../src/links/index.js';

export function runLinksTests() {
  console.log('--- Running Links & Footnotes Module Tests ---');

  // Test 1: Reference link definitions extraction
  const md = `
Some paragraph with [Cámara de Diputados][1] and [OMC][2].

[1]: https://www.diputados.gob.mx/LeyesBiblio/pdf/LCE.pdf
[2]: https://www.wto.org/spanish/docs_s/legal_s/24-scm_01_s.htm "OMC"
[^1]: Footnote 1 content
    Indented continuation
`;

  const defs = extractReferenceDefinitions(md);
  assert.equal(defs.length, 3);
  assert.ok(defs[0].includes('[1]: https://www.diputados.gob.mx'));
  assert.ok(defs[1].includes('[2]: https://www.wto.org'));
  assert.ok(defs[2].includes('[^1]: Footnote 1 content'));
  console.log('✓ extractReferenceDefinitions passed');

  // Test 2: In code block exclusion
  const mdWithCode = [
    '```markdown',
    '[1]: https://ignore.me',
    '[^1]: Ignore footnote',
    '```',
    '[real]: https://real.url',
  ].join('\n');
  const codeDefs = extractReferenceDefinitions(mdWithCode);
  assert.equal(codeDefs.length, 1);
  assert.ok(codeDefs[0].includes('[real]: https://real.url'));
  console.log('✓ Code block exclusion passed');

  // Test 3: augmentContentWithDocumentDefinitions
  const tabContent = 'El **dumping** consiste en... ([Cámara de Diputados][1])';
  const docContent = `
# Titulo
[1]: https://www.diputados.gob.mx/LCE.pdf
[^fn]: Nota al pie
`;
  const mockApp = {
    workspace: {
      getActiveViewOfType: () => ({
        file: { path: 'test.md' },
        editor: { getValue: () => docContent }
      })
    }
  };
  const mockContext = { sourcePath: 'test.md' };
  const mockOwnerTabs = { rawText: '' };

  const augmented = augmentContentWithDocumentDefinitions(tabContent, mockApp, mockContext, mockOwnerTabs);
  assert.ok(augmented.includes('[1]: https://www.diputados.gob.mx/LCE.pdf'));
  assert.ok(augmented.includes('[^fn]: Nota al pie'));
  console.log('✓ augmentContentWithDocumentDefinitions passed');

  console.log('All Links tests passed!\n');
}
