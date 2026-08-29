import assert from 'node:assert/strict';
import {
  tabsExtendedSourceLines,
  tabsExtendedFenceInfo,
  tabsExtendedMaxFenceLength,
  tabsExtendedUpdateFenceStack,
  tabsExtendedClosingFenceIndex,
  tabsExtendedAnalyzeTabSections,
  tabsExtendedNormalizeTabTitle,
  tabsExtendedTabTitleSourceRange,
  tabsExtendedJoinTabSections,
  tabsExtendedConfiguredKeyword,
  tabsExtendedTabKeywords,
  tabsExtendedFindDirectNestedBlocks,
  tabsExtendedNormalizeSource,
} from '../src/core/parser.js';

export function runParserTests() {
  console.log('--- Running Parser Tests ---');

  // Test 1: tabsExtendedNormalizeTabTitle
  assert.equal(tabsExtendedNormalizeTabTitle('  Tab Title  '), 'Tab Title');
  assert.equal(tabsExtendedNormalizeTabTitle(''), null);
  assert.equal(tabsExtendedNormalizeTabTitle('   '), null);
  assert.equal(tabsExtendedNormalizeTabTitle(null), null);
  assert.equal(tabsExtendedNormalizeTabTitle('Tab\nTitle'), null);
  console.log('✓ tabsExtendedNormalizeTabTitle passed');

  // Test 2: tabsExtendedSourceLines
  const lines = tabsExtendedSourceLines('Line 1\nLine 2\r\nLine 3');
  assert.equal(lines.length, 3);
  assert.equal(lines[0].text, 'Line 1');
  assert.equal(lines[1].text, 'Line 2');
  assert.equal(lines[2].text, 'Line 3');
  console.log('✓ tabsExtendedSourceLines passed');

  // Test 3: tabsExtendedAnalyzeTabSections with various formats
  const rawText1 = 'tema:Tab 1\nContent 1\ntema:Tab 2\nContent 2';
  const analysis1 = tabsExtendedAnalyzeTabSections(rawText1, 'tema:', {});
  assert.ok(analysis1);
  assert.equal(analysis1.sections.length, 2);
  assert.equal(analysis1.prefix, '');

  const rawText2 = '  tema: Tab 1\nContent 1\n  tema: Tab 2\nContent 2';
  const analysis2 = tabsExtendedAnalyzeTabSections(rawText2, 'tema:', {});
  assert.ok(analysis2);
  assert.equal(analysis2.sections.length, 2);

  const rawText3 = 'tab:Tab 1\nContent 1\ntab:Tab 2\nContent 2';
  const analysis3 = tabsExtendedAnalyzeTabSections(rawText3, 'tab', {});
  assert.ok(analysis3);
  assert.equal(analysis3.sections.length, 2);
  console.log('✓ tabsExtendedAnalyzeTabSections passed');

  // Test 4: tabsExtendedTabTitleSourceRange
  const titleRange0 = tabsExtendedTabTitleSourceRange(rawText1, 'tema:', analysis1, 0);
  assert.ok(titleRange0);
  assert.equal(titleRange0.title.trim(), 'Tab 1');

  const titleRange1 = tabsExtendedTabTitleSourceRange(rawText2, 'tema:', analysis2, 1);
  assert.ok(titleRange1);
  assert.equal(titleRange1.title.trim(), 'Tab 2');
  console.log('✓ tabsExtendedTabTitleSourceRange passed');

  // Test 5: tabsExtendedJoinTabSections
  const sections = ['tema:Tab 1\nContent 1\n', 'tema:Tab 2\nContent 2'];
  const joined = tabsExtendedJoinTabSections('', sections, rawText1);
  assert.ok(joined.includes('tema:Tab 1'));
  assert.ok(joined.includes('tema:Tab 2'));
  console.log('✓ tabsExtendedJoinTabSections passed');

  // Test 6: tabsExtendedFindDirectNestedBlocks
  const nestedSource = `
tema:Tab 1
Content before
~~~tabs
tema:Nested Tab 1
Nested Content
~~~
Content after
`;
  const nestedBlocks = tabsExtendedFindDirectNestedBlocks(nestedSource, {});
  assert.equal(nestedBlocks.length, 1);
  assert.equal(nestedBlocks[0].isVertical, false);
  console.log('✓ tabsExtendedFindDirectNestedBlocks passed');

  // Test 7: tabsExtendedNormalizeSource
  const srcA = 'tema:Tab 1   \nContenido  \r\n';
  const srcB = 'tema:Tab 1\nContenido\n';
  assert.equal(tabsExtendedNormalizeSource(srcA), tabsExtendedNormalizeSource(srcB));
  console.log('✓ tabsExtendedNormalizeSource passed');

  console.log('All Parser tests passed!\n');
}
