import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  ensureIngredientDefinitions,
  hydrateIngredientUsage,
  readIngredients,
} from './ingredientStore.js';

const ROOT = path.resolve(process.cwd());
const DATA_FILE = process.env.RECIPE_DATA_FILE
  ? path.resolve(process.env.RECIPE_DATA_FILE)
  : path.join(ROOT, 'data', 'recipes.json');

let mutationQueue = Promise.resolve();

function serialiseMutation(task) {
  const run = mutationQueue.then(task, task);
  mutationQueue = run.catch(() => undefined);
  return run;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]\n', 'utf8');
  }
}

function cleanText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normaliseIngredientUsage(ingredient = {}, definition = null) {
  return {
    id: cleanText(ingredient.id) || randomUUID(),
    catalogId: definition?.id || cleanText(ingredient.catalogId),
    quantity: cleanNumber(ingredient.quantity, 0),
    unit: cleanText(ingredient.unit, 'g'),
    unitEn: cleanText(ingredient.unitEn),
    grams: cleanNumber(ingredient.grams, 0),
    note: cleanText(ingredient.note),
    noteEn: cleanText(ingredient.noteEn),
  };
}

function normaliseStep(step, index) {
  if (typeof step === 'string') {
    return { id: randomUUID(), title: `Step ${index + 1}`, text: step.trim(), timerMinutes: 0 };
  }

  return {
    id: cleanText(step?.id) || randomUUID(),
    title: cleanText(step?.title, `Step ${index + 1}`),
    titleEn: cleanText(step?.titleEn),
    text: cleanText(step?.text),
    textEn: cleanText(step?.textEn),
    timerMinutes: cleanNumber(step?.timerMinutes, 0),
  };
}

export function normaliseRecipe(input = {}, existing = null, linkedDefinitions = []) {
  const now = new Date().toISOString();
  const ingredients = Array.isArray(input.ingredients)
    ? input.ingredients
      .map((ingredient, index) => normaliseIngredientUsage(ingredient, linkedDefinitions[index]))
      .filter((item) => item.catalogId)
    : [];
  const steps = Array.isArray(input.steps)
    ? input.steps.map(normaliseStep).filter((item) => item.text)
    : [];

  return {
    id: existing?.id || cleanText(input.id) || randomUUID(),
    slug: cleanText(input.slug),
    title: cleanText(input.title, 'Untitled recipe'),
    titleEn: cleanText(input.titleEn),
    description: cleanText(input.description),
    descriptionEn: cleanText(input.descriptionEn),
    category: cleanText(input.category, 'Arki'),
    categoryEn: cleanText(input.categoryEn),
    cuisine: cleanText(input.cuisine, 'Kotiruoka'),
    cuisineEn: cleanText(input.cuisineEn),
    difficulty: ['Helppo', 'Keskitaso', 'Vaativa', 'Easy', 'Medium', 'Advanced'].includes(input.difficulty)
      ? input.difficulty
      : 'Helppo',
    difficultyEn: cleanText(input.difficultyEn),
    prepMinutes: Math.max(0, cleanNumber(input.prepMinutes, 0)),
    cookMinutes: Math.max(0, cleanNumber(input.cookMinutes, 0)),
    servings: Math.max(1, cleanNumber(input.servings, 1)),
    tags: Array.isArray(input.tags)
      ? [...new Set(input.tags.map((tag) => cleanText(tag)).filter(Boolean))]
      : [],
    tagsEn: Array.isArray(input.tagsEn)
      ? [...new Set(input.tagsEn.map((tag) => cleanText(tag)).filter(Boolean))]
      : [],
    image: cleanText(input.image, existing?.image || ''),
    sourceUrl: cleanText(input.sourceUrl),
    notes: cleanText(input.notes),
    notesEn: cleanText(input.notesEn),
    favourite: Boolean(input.favourite),
    plannedNutritionPerServing: input.plannedNutritionPerServing ? {
      kcal: cleanNumber(input.plannedNutritionPerServing.kcal, 0),
      protein: cleanNumber(input.plannedNutritionPerServing.protein ?? input.plannedNutritionPerServing.protein_g, 0),
      carbs: cleanNumber(input.plannedNutritionPerServing.carbs ?? input.plannedNutritionPerServing.carbs_g, 0),
      fat: cleanNumber(input.plannedNutritionPerServing.fat ?? input.plannedNutritionPerServing.fat_g, 0),
      fibre: cleanNumber(input.plannedNutritionPerServing.fibre ?? input.plannedNutritionPerServing.fiber ?? input.plannedNutritionPerServing.fiber_g, 0),
    } : null,
    useIngredientNutrition: Boolean(input.useIngredientNutrition),
    nutritionStatus: cleanText(input.nutritionStatus),
    nutritionDisclaimerFi: cleanText(input.nutritionDisclaimerFi),
    fineliSyncedAt: cleanText(input.fineliSyncedAt),
    ingredients,
    steps,
    createdAt: existing?.createdAt || cleanText(input.createdAt, now),
    updatedAt: now,
  };
}

export async function readRawRecipes() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error(`Could not parse data/recipes.json: ${error.message}`);
  }
}

async function migrateLegacyIngredientSnapshots(recipes, ingredients) {
  const catalogIds = new Set(ingredients.map((ingredient) => ingredient.id));
  const needsMigration = recipes.some((recipe) => (recipe.ingredients || []).some((ingredient) => !ingredient.catalogId || !catalogIds.has(ingredient.catalogId)));
  if (!needsMigration) return recipes;

  const migrated = [];
  for (const recipe of recipes) {
    const recipeIngredients = recipe.ingredients || [];
    const linkedDefinitions = await ensureIngredientDefinitions(recipeIngredients);
    migrated.push({
      ...recipe,
      ingredients: recipeIngredients.map((ingredient, index) => normaliseIngredientUsage(ingredient, linkedDefinitions[index])),
    });
  }
  await writeRecipes(migrated);
  return migrated;
}

export async function readRecipes() {
  let [recipes, ingredients] = await Promise.all([readRawRecipes(), readIngredients()]);
  recipes = await migrateLegacyIngredientSnapshots(recipes, ingredients);
  ingredients = await readIngredients();
  const catalog = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  return recipes.map((recipe) => ({
    ...recipe,
    ingredients: (recipe.ingredients || []).map((usage) => hydrateIngredientUsage(usage, catalog.get(usage.catalogId))),
  }));
}

export async function writeRecipes(recipes) {
  await ensureStore();
  const temporaryFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(recipes, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryFile, DATA_FILE);
}

async function linkRecipeIngredients(input) {
  const ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
  return ensureIngredientDefinitions(ingredients);
}

export function createRecipe(input) {
  return serialiseMutation(async () => {
    const recipes = await readRawRecipes();
    const linkedDefinitions = await linkRecipeIngredients(input);
    const recipe = normaliseRecipe(input, null, linkedDefinitions);
    recipes.unshift(recipe);
    await writeRecipes(recipes);
    const catalog = new Map((await readIngredients()).map((ingredient) => [ingredient.id, ingredient]));
    return {
      ...recipe,
      ingredients: recipe.ingredients.map((usage) => hydrateIngredientUsage(usage, catalog.get(usage.catalogId))),
    };
  });
}

export function updateRecipe(id, input) {
  return serialiseMutation(async () => {
    const recipes = await readRawRecipes();
    const index = recipes.findIndex((recipe) => recipe.id === id);
    if (index === -1) return null;
    const merged = { ...recipes[index], ...input };
    const linkedDefinitions = await linkRecipeIngredients(merged);
    recipes[index] = normaliseRecipe(merged, recipes[index], linkedDefinitions);
    await writeRecipes(recipes);
    const catalog = new Map((await readIngredients()).map((ingredient) => [ingredient.id, ingredient]));
    return {
      ...recipes[index],
      ingredients: recipes[index].ingredients.map((usage) => hydrateIngredientUsage(usage, catalog.get(usage.catalogId))),
    };
  });
}

export function deleteRecipe(id) {
  return serialiseMutation(async () => {
    const recipes = await readRawRecipes();
    const next = recipes.filter((recipe) => recipe.id !== id);
    if (next.length === recipes.length) return false;
    await writeRecipes(next);
    return true;
  });
}
