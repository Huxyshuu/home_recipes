import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('one shared ingredient update is hydrated into every linked recipe', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'lettucecook-ingredients-'));
  process.env.RECIPE_DATA_FILE = path.join(directory, 'recipes.json');
  process.env.INGREDIENT_DATA_FILE = path.join(directory, 'ingredients.json');
  const token = Date.now();
  const ingredientStore = await import(`../server/ingredientStore.js?ingredient-test=${token}`);
  const recipeStore = await import(`../server/recipeStore.js?ingredient-test=${token}`);

  try {
    const oats = await ingredientStore.createIngredient({
      name: 'Kaurahiutale',
      retail: { selectedPrice: { unitPriceEur: 2, priceUnit: 'kg' } },
      nutritionPer100g: { kcal: 370, protein: 13, carbs: 60, fat: 7, fibre: 10 },
    });
    await recipeStore.createRecipe({ title: 'A', ingredients: [{ catalogId: oats.id, name: oats.name, quantity: 50, unit: 'g', grams: 50 }], steps: ['Mix'] });
    await recipeStore.createRecipe({ title: 'B', ingredients: [{ catalogId: oats.id, name: oats.name, quantity: 80, unit: 'g', grams: 80 }], steps: ['Mix'] });

    await ingredientStore.updateIngredient(oats.id, {
      ...oats,
      retail: { selectedPrice: { unitPriceEur: 3.5, priceUnit: 'kg' } },
      nutritionPer100g: { ...oats.nutritionPer100g, kcal: 365 },
    });

    const recipes = await recipeStore.readRecipes();
    assert.equal(recipes.length, 2);
    recipes.forEach((recipe) => {
      assert.equal(recipe.ingredients[0].retail.selectedPrice.unitPriceEur, 3.5);
      assert.equal(recipe.ingredients[0].nutritionPer100g.kcal, 365);
    });
    assert.deepEqual(new Set(recipes.map((recipe) => recipe.ingredients[0].grams)), new Set([50, 80]));
  } finally {
    delete process.env.RECIPE_DATA_FILE;
    delete process.env.INGREDIENT_DATA_FILE;
    await rm(directory, { recursive: true, force: true });
  }
});
