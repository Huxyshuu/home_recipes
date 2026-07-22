import test from 'node:test';
import assert from 'node:assert/strict';
import { ingredientPrice, recipePrice } from '../src/utils/pricing.js';

test('ingredient price uses kg price for gram-based ingredients', () => {
  const ingredient = { grams: 250, unit: 'g', retail: { selectedPrice: { unitPriceEur: 2, priceUnit: 'kg' } } };
  assert.equal(ingredientPrice(ingredient), 0.5);
});

test('recipe price reports partial coverage without inventing missing prices', () => {
  const result = recipePrice({ servings: 2, ingredients: [
    { grams: 500, retail: { selectedPrice: { unitPriceEur: 2, priceUnit: 'kg' } } },
    { grams: 100, retail: { selectedPrice: null } },
  ] });
  assert.equal(result.total, 1);
  assert.equal(result.perServing, 0.5);
  assert.equal(result.coverage, 50);
  assert.equal(result.complete, false);
});

test('recipe price is complete only when every ingredient has a saved price', () => {
  const result = recipePrice({ servings: 1, ingredients: [
    { grams: 250, retail: { selectedPrice: { unitPriceEur: 2, priceUnit: 'kg' } } },
    { quantity: 2, unit: 'kpl', retail: { selectedPrice: { unitPriceEur: 0.5, priceUnit: 'kpl' } } },
  ] });
  assert.equal(result.total, 1.5);
  assert.equal(result.coverage, 100);
  assert.equal(result.complete, true);
});
