import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('legacy embedded ingredient snapshots migrate to shared catalog links on first read', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'lettucecook-migration-'));
  const recipeFile = path.join(directory, 'recipes.json');
  const ingredientFile = path.join(directory, 'ingredients.json');
  await writeFile(recipeFile, JSON.stringify([{
    id: 'recipe-1',
    title: 'Legacy oats',
    servings: 1,
    ingredients: [{
      id: 'usage-1',
      name: 'Kaurahiutale',
      nameEn: 'Rolled oats',
      quantity: 60,
      unit: 'g',
      grams: 60,
      shoppingCategory: 'Viljat ja kuiva-aineet',
      fineliQuery: 'kaurahiutale',
      retail: { sKaupatUrl: 'https://www.s-kaupat.fi/', kRuokaUrl: 'https://www.k-ruoka.fi/', selectedPrice: null },
      nutritionPer100g: { kcal: 370, protein: 13, carbs: 60, fat: 7, fibre: 10 },
    }],
    steps: [{ id: 'step-1', title: 'Mix', text: 'Mix.', timerMinutes: 0 }],
  }], null, 2));
  await writeFile(ingredientFile, '[]\n');
  process.env.RECIPE_DATA_FILE = recipeFile;
  process.env.INGREDIENT_DATA_FILE = ingredientFile;

  try {
    const store = await import(`../server/recipeStore.js?migration=${Date.now()}`);
    const recipes = await store.readRecipes();
    const rawRecipes = JSON.parse(await readFile(recipeFile, 'utf8'));
    const ingredients = JSON.parse(await readFile(ingredientFile, 'utf8'));
    assert.equal(ingredients.length, 1);
    assert.equal(rawRecipes[0].ingredients[0].catalogId, ingredients[0].id);
    assert.equal(rawRecipes[0].ingredients[0].name, undefined);
    assert.equal(recipes[0].ingredients[0].name, 'Kaurahiutale');
    assert.equal(recipes[0].ingredients[0].grams, 60);
  } finally {
    delete process.env.RECIPE_DATA_FILE;
    delete process.env.INGREDIENT_DATA_FILE;
    await rm(directory, { recursive: true, force: true });
  }
});
