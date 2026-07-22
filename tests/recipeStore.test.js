import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('recipe store supports serialised CRUD with atomic JSON writes', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'reseptikoti-'));
  const dataFile = path.join(directory, 'recipes.json');
  const ingredientFile = path.join(directory, 'ingredients.json');
  process.env.RECIPE_DATA_FILE = dataFile;
  process.env.INGREDIENT_DATA_FILE = ingredientFile;
  const store = await import(`../server/recipeStore.js?test=${Date.now()}`);

  try {
    const [first, second] = await Promise.all([
      store.createRecipe({ title: 'Soup', servings: 4, ingredients: [{ name: 'Water' }], steps: ['Boil'] }),
      store.createRecipe({ title: 'Bread', servings: 2, ingredients: [{ name: 'Flour' }], steps: ['Bake'] }),
    ]);

    const recipes = await store.readRecipes();
    assert.equal(recipes.length, 2);
    assert.deepEqual(new Set(recipes.map((recipe) => recipe.title)), new Set(['Soup', 'Bread']));

    const updated = await store.updateRecipe(first.id, { ...first, title: 'Tomato soup' });
    assert.equal(updated.title, 'Tomato soup');
    assert.equal(await store.deleteRecipe(second.id), true);
    assert.equal((await store.readRecipes()).length, 1);
    const raw = await readFile(dataFile, 'utf8');
    assert.doesNotThrow(() => JSON.parse(raw));
  } finally {
    delete process.env.RECIPE_DATA_FILE;
    delete process.env.INGREDIENT_DATA_FILE;
    await rm(directory, { recursive: true, force: true });
  }
});
