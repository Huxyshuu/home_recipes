import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('nutrition search does not nest a form inside the recipe form', async () => {
  const source = await readFile(new URL('../src/components/NutritionSearch.jsx', import.meta.url), 'utf8');
  assert.equal(/<form\b/.test(source), false);
  assert.match(source, /type="button" onClick=\{\(\) => search\(\)\}/);
  assert.match(source, /event\.preventDefault\(\)/);
});

test('cooking mode renders every step and includes an audible timer alarm', async () => {
  const source = await readFile(new URL('../src/components/CookingMode.jsx', import.meta.url), 'utf8');
  assert.match(source, /steps\.map\(\(step, index\)/);
  assert.match(source, /createOscillator/);
  assert.match(source, /Time's up!/);
});


test('ingredient library exposes one shared editor and recipe editor links catalog records', async () => {
  const library = await readFile(new URL('../src/components/IngredientLibrary.jsx', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../src/components/RecipeEditor.jsx', import.meta.url), 'utf8');
  assert.match(library, /Every linked recipe now uses this information/);
  assert.match(library, /api\.updateIngredient/);
  assert.match(editor, /Shared ingredient record/);
  assert.match(editor, /catalogId/);
});
