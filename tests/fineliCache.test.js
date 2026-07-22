import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createFineliCache } from '../server/fineliCache.js';

test('Fineli cache stores food details and search results with atomic JSON output', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'home-recipes-fineli-'));
  const filePath = path.join(directory, 'fineli-cache.json');
  const cache = createFineliCache({ filePath, maxFoods: 2, maxQueries: 2 });

  try {
    await Promise.all([
      cache.putFood({ id: 1, name: 'Peruna', nutritionPer100g: { kcal: 75 } }),
      cache.putFood({ id: 2, name: 'Lohi', nutritionPer100g: { kcal: 200 } }),
      cache.putSearch('lohi', [{ id: 2, name: 'Lohi', type: 'Raaka-aine' }]),
    ]);

    assert.equal((await cache.getFood(2)).food.name, 'Lohi');
    assert.deepEqual((await cache.getSearch('LOHI')).results, [{ id: 2, name: 'Lohi', type: 'Raaka-aine' }]);
    assert.equal((await cache.listFoods({ query: 'per' }))[0].name, 'Peruna');

    const payload = JSON.parse(await readFile(filePath, 'utf8'));
    assert.equal(payload.version, 1);
    assert.equal(Object.keys(payload.foods).length, 2);
    assert.equal(Object.keys(payload.queries).length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
