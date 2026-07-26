import test from 'node:test';
import assert from 'node:assert/strict';
import { containDimensions, formatBytes, RECIPE_IMAGE_LIMITS, webpFilename } from '../src/utils/imageCompression.js';

test('recipe image dimensions are reduced without changing aspect ratio', () => {
  assert.deepEqual(containDimensions(4000, 3000, 1600, 1600), { width: 1600, height: 1200 });
  assert.deepEqual(containDimensions(800, 600, 1600, 1600), { width: 800, height: 600 });
});

test('recipe uploads use a WebP filename and practical compression defaults', () => {
  assert.equal(webpFilename('my.recipe.cover.png'), 'my.recipe.cover.webp');
  assert.equal(RECIPE_IMAGE_LIMITS.maxWidth, 1600);
  assert.equal(RECIPE_IMAGE_LIMITS.quality, 0.82);
  assert.equal(formatBytes(3 * 1024 * 1024), '3.0 MB');
});
