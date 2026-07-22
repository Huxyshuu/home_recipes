import test from 'node:test';
import assert from 'node:assert/strict';
import { nutritionCoverage, recipeNutrition } from '../src/utils/nutrition.js';

test('recipe nutrition sums ingredient values and divides by servings', () => {
  const recipe = {
    servings: 2,
    ingredients: [
      { grams: 200, nutritionPer100g: { kcal: 100, protein: 10, carbs: 5, fat: 2, fibre: 1 } },
      { grams: 50, nutritionPer100g: { kcal: 200, protein: 4, carbs: 20, fat: 10, fibre: 2 } },
    ],
  };

  const result = recipeNutrition(recipe);
  assert.equal(result.total.kcal, 300);
  assert.equal(result.perServing.kcal, 150);
  assert.equal(result.perServing.protein, 11);
  assert.equal(result.perServing.carbs, 10);
  assert.equal(result.perServing.fat, 4.5);
  assert.equal(result.perServing.fibre, 1.5);
  assert.equal(nutritionCoverage(recipe), 100);
});
