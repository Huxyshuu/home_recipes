import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { createFineliCache } from '../server/fineliCache.js';
import { getFineliFood, searchFineli } from '../server/fineli.js';

test('Fineli service caches searches and selected food details', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'home-recipes-service-'));
  const cache = createFineliCache({ filePath: path.join(directory, 'cache.json') });
  const originalFetch = global.fetch;
  let searchCalls = 0;
  let detailCalls = 0;

  global.fetch = async (url) => {
    const value = String(url);
    if (value.includes('/foods?q=')) {
      searchCalls += 1;
      return new Response(JSON.stringify([
        { id: 42, name: { fi: 'Lohi' }, type: { description: { fi: 'Raaka-aine' } } },
      ]), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (value.endsWith('/foods/42')) {
      detailCalls += 1;
      return new Response(JSON.stringify({
        id: 42,
        name: { fi: 'Lohi' },
        type: { description: { fi: 'Raaka-aine' } },
        energyKcal: 200,
        protein: 20,
        carbohydrate: 0,
        fat: 13,
        fiber: 0,
        units: [{ code: 'G', abbreviation: { fi: 'g' }, description: { fi: 'gramma' }, mass: 1 }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    throw new Error(`Unexpected test URL: ${value}`);
  };

  try {
    const firstSearch = await searchFineli('lohi', { cache });
    const secondSearch = await searchFineli('LOHI', { cache });
    assert.equal(firstSearch.source, 'fineli');
    assert.equal(secondSearch.source, 'cache');
    assert.equal(searchCalls, 1);

    const firstFood = await getFineliFood(42, { cache });
    const secondFood = await getFineliFood('42', { cache });
    assert.equal(firstFood.cache.source, 'fineli');
    assert.equal(secondFood.cache.source, 'cache');
    assert.equal(secondFood.nutritionPer100g.kcal, 200);
    assert.equal(detailCalls, 1);
  } finally {
    global.fetch = originalFetch;
    await rm(directory, { recursive: true, force: true });
  }
});
