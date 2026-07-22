import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildShoppingWindowItems } from '../src/utils/shopping.js';
import { weeklyRoutine } from '../src/data/mealPlan.js';

test('meal-plan seed contains 14 complete favourite recipes', async () => {
  const recipes = JSON.parse(await readFile(new URL('../data/recipes.json', import.meta.url), 'utf8'));
  assert.equal(recipes.length, 14);
  assert.equal(new Set(recipes.map((recipe) => recipe.slug)).size, 14);
  recipes.forEach((recipe) => {
    assert.equal(recipe.favourite, true);
    assert.equal(recipe.difficulty, 'Easy');
    assert.ok(recipe.category);
    assert.ok(recipe.cuisine);
    assert.ok(Number.isFinite(recipe.prepMinutes));
    assert.ok(Number.isFinite(recipe.cookMinutes));
    assert.ok(recipe.ingredients.length >= 5);
    assert.ok(recipe.steps.length >= 3);
    assert.match(recipe.notes, /not copied from a single online recipe/i);
    assert.match(recipe.notes, /Substitutions:/);
    assert.ok(recipe.plannedNutritionPerServing?.protein > 0);
    recipe.ingredients.forEach((ingredient) => assert.ok(ingredient.shoppingCategory));
  });
});

test('weekly routine has seven days and valid recipe references', async () => {
  const recipes = JSON.parse(await readFile(new URL('../data/recipes.json', import.meta.url), 'utf8'));
  const slugs = new Set(recipes.map((recipe) => recipe.slug));
  assert.equal(weeklyRoutine.length, 7);
  weeklyRoutine.forEach((day) => {
    assert.equal(day.meals.length, 5);
    day.meals.filter((meal) => meal.recipeSlug).forEach((meal) => assert.ok(slugs.has(meal.recipeSlug)));
  });
});

test('Sunday and Wednesday shopping windows aggregate duplicate ingredients', async () => {
  const recipes = JSON.parse(await readFile(new URL('../data/recipes.json', import.meta.url), 'utf8'));
  for (const windowId of ['sunday', 'wednesday']) {
    const items = buildShoppingWindowItems(recipes, windowId);
    assert.ok(items.length > 20);
    const keys = items.map((item) => `${item.name.toLowerCase()}::${item.unit}`);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(items.some((item) => item.name === 'Skyr' && item.quantity > 250));
  }
});
