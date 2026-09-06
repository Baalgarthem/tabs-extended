import { runParserTests } from './parser.test.mjs';
import { runLinksTests } from './links.test.mjs';
import { runIntegrationTests } from './integration.test.mjs';
import { runCodeblocksTests } from './codeblocks.test.mjs';

console.log('====================================');
console.log('  TABS EXTENDED TEST SUITE RUNNER   ');
console.log('====================================\n');

const startTime = Date.now();

try {
  runParserTests();
  runLinksTests();
  await runCodeblocksTests();
  runIntegrationTests();

  const duration = Date.now() - startTime;
  console.log('====================================');
  console.log(`✨ ALL TESTS PASSED SUCCESSFULLY! (${duration}ms)`);
  console.log('====================================');
} catch (error) {
  console.error('\n❌ TEST SUITE FAILED:', error);
  process.exit(1);
}
