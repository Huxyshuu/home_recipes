import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseFoodDetail, normaliseSearchResults } from '../server/fineli.js';

test('Fineli search normaliser accepts multilingual food names', () => {
  const results = normaliseSearchResults({ foods: [{ id: 42, name: { fi: 'Lohi', en: 'Salmon' } }] });
  assert.deepEqual(results, [{ id: 42, name: 'Lohi', type: '' }]);
});

test('Fineli detail normaliser maps energy and macronutrients', () => {
  const detail = normaliseFoodDetail({
    id: 42,
    name: { fi: 'Lohi' },
    values: [
      { code: 'ENERC', value: 836.8, unit: 'kJ' },
      { code: 'PROT', value: 20 },
      { code: 'CHOAVL', value: 0 },
      { code: 'FAT', value: 13 },
      { code: 'FIBT', value: 0 },
    ],
  });

  assert.equal(detail.id, 42);
  assert.equal(detail.name, 'Lohi');
  assert.equal(detail.nutritionPer100g.kcal, 200);
  assert.equal(detail.nutritionPer100g.protein, 20);
  assert.equal(detail.nutritionPer100g.fat, 13);
});


test('Fineli detail normaliser uses the API direct summary fields', () => {
  const detail = normaliseFoodDetail({
    id: 11060,
    name: { fi: 'Omena, kotimainen, kuorittu' },
    type: { description: { fi: 'Raaka-aine' } },
    mass: 100,
    energy: 169.577499389648,
    energyKcal: 40.51256614975584,
    fat: 0.100000001490116,
    protein: 0.189999997615814,
    carbohydrate: 8.3100004196167,
    fiber: 0,
    units: [{ code: 'DL', description: { fi: 'desilitra' }, abbreviation: { fi: 'dl' }, mass: 65 }],
  });

  assert.equal(detail.id, 11060);
  assert.equal(detail.type, 'Raaka-aine');
  assert.equal(detail.nutritionPer100g.kcal, 40.5);
  assert.equal(detail.nutritionPer100g.protein, 0.2);
  assert.equal(detail.nutritionPer100g.carbs, 8.3);
  assert.equal(detail.measures[0].grams, 65);
});
