import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const coverDirectory = new URL('../public/meal-plan-covers/', import.meta.url);

test('all 14 generated meal-plan covers are text-free and responsive', async () => {
  const files = (await readdir(coverDirectory)).filter((file) => file.endsWith('.svg'));
  assert.equal(files.length, 14);
  for (const file of files) {
    const svg = await readFile(new URL(file, coverDirectory), 'utf8');
    assert.match(svg, /viewBox=/);
    assert.doesNotMatch(svg, /<text\b/i);
    assert.match(svg, /preserveAspectRatio=/);
  }
});
