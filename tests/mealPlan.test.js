import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildShoppingWindowItems } from '../src/utils/shopping.js';
import { weeklyRoutine } from '../src/data/mealPlan.js';
import { readRecipes } from '../server/recipeStore.js';

test('meal-plan seed contains 14 complete favourite recipes linked to the shared ingredient library', async () => {
  const [recipes, rawRecipes, ingredientCatalog] = await Promise.all([
    readRecipes(),
    JSON.parse(await readFile(new URL('../data/recipes.json', import.meta.url), 'utf8')),
    JSON.parse(await readFile(new URL('../data/ingredients.json', import.meta.url), 'utf8')),
  ]);
  const catalogIds = new Set(ingredientCatalog.map((ingredient) => ingredient.id));
  assert.equal(recipes.length, 14);
  assert.equal(ingredientCatalog.length, 47);
  assert.equal(new Set(recipes.map((recipe) => recipe.slug)).size, 14);
  rawRecipes.forEach((recipe) => recipe.ingredients.forEach((usage) => assert.ok(catalogIds.has(usage.catalogId))));
  recipes.forEach((recipe) => {
    assert.equal(recipe.favourite, true);
    assert.equal(recipe.difficulty, 'Helppo');
    assert.ok(recipe.category);
    assert.ok(recipe.cuisine);
    assert.ok(Number.isFinite(recipe.prepMinutes));
    assert.ok(Number.isFinite(recipe.cookMinutes));
    assert.ok(recipe.ingredients.length >= 5);
    assert.ok(recipe.steps.length >= 3);
    assert.match(recipe.notes, /ei ole kopioitu yhdestä verkkolähteestä/i);
    assert.match(recipe.notes, /Korvaavat vaihtoehdot:/);
    assert.ok(recipe.plannedNutritionPerServing?.protein > 0);
    recipe.ingredients.forEach((ingredient) => {
      assert.ok(ingredient.catalogId);
      assert.ok(ingredient.shoppingCategory);
      assert.ok(ingredient.name);
      assert.ok(ingredient.nameEn);
      assert.ok(ingredient.fineliQuery);
      assert.ok(Array.isArray(ingredient.fineliPreferredTerms));
      assert.match(ingredient.retail?.sKaupatUrl || '', /^https:\/\/www\.s-kaupat\.fi\//);
      assert.match(ingredient.retail?.kRuokaUrl || '', /^https:\/\/www\.k-ruoka\.fi\//);
      assert.ok(ingredient.nutritionSource?.status);
    });
  });
});

test('weekly routine has seven days and valid recipe references', async () => {
  const recipes = await readRecipes();
  const slugs = new Set(recipes.map((recipe) => recipe.slug));
  assert.equal(weeklyRoutine.length, 7);
  weeklyRoutine.forEach((day) => {
    assert.equal(day.meals.length, 5);
    day.meals.filter((meal) => meal.recipeSlug).forEach((meal) => assert.ok(slugs.has(meal.recipeSlug)));
  });
});

test('Sunday and Wednesday shopping windows aggregate duplicate shared ingredients', async () => {
  const recipes = await readRecipes();
  for (const windowId of ['sunday', 'wednesday']) {
    const items = buildShoppingWindowItems(recipes, windowId);
    assert.ok(items.length > 20);
    const keys = items.map((item) => `${item.name.toLowerCase()}::${item.unit}`);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(items.some((item) => item.name === 'Skyr, maustamaton' && item.quantity > 250));
  }
});
