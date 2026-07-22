import { syncRecipesWithFineli } from '../server/fineliRecipeSync.js';

try {
  const report = await syncRecipesWithFineli({ forceRefresh: process.argv.includes('--refresh') });
  console.log(JSON.stringify(report, null, 2));
  if (report.unresolvedUniqueIngredients) process.exitCode = 2;
} catch (error) {
  console.error(`Fineli sync failed: ${error.message}`);
  process.exitCode = 1;
}
