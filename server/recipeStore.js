import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

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


function normaliseMeasure(measure = {}) {
  return {
    code: cleanText(measure.code),
    name: cleanText(measure.name),
    abbreviation: cleanText(measure.abbreviation),
    grams: Math.max(0, cleanNumber(measure.grams, 0)),
  };
}

function normaliseIngredient(ingredient = {}) {
  return {
    id: cleanText(ingredient.id) || randomUUID(),
    name: cleanText(ingredient.name),
    quantity: cleanNumber(ingredient.quantity, 0),
    unit: cleanText(ingredient.unit, 'g'),
    grams: cleanNumber(ingredient.grams, 0),
    note: cleanText(ingredient.note),
    shoppingCategory: cleanText(ingredient.shoppingCategory, 'Other'),
    fineliFoodId: ingredient.fineliFoodId ?? null,
    fineliFoodName: cleanText(ingredient.fineliFoodName),
    fineliMeasures: Array.isArray(ingredient.fineliMeasures)
      ? ingredient.fineliMeasures.map(normaliseMeasure).filter((measure) => measure.abbreviation && measure.grams > 0)
      : [],
    nutritionPer100g: {
      kcal: cleanNumber(ingredient.nutritionPer100g?.kcal, 0),
      protein: cleanNumber(ingredient.nutritionPer100g?.protein, 0),
      carbs: cleanNumber(ingredient.nutritionPer100g?.carbs, 0),
      fat: cleanNumber(ingredient.nutritionPer100g?.fat, 0),
      fibre: cleanNumber(ingredient.nutritionPer100g?.fibre, 0),
    },
  };
}

function normaliseStep(step, index) {
  if (typeof step === 'string') {
    return { id: randomUUID(), title: `Step ${index + 1}`, text: step.trim(), timerMinutes: 0 };
  }

  return {
    id: cleanText(step?.id) || randomUUID(),
    title: cleanText(step?.title, `Step ${index + 1}`),
    text: cleanText(step?.text),
    timerMinutes: cleanNumber(step?.timerMinutes, 0),
  };
}

export function normaliseRecipe(input = {}, existing = null) {
  const now = new Date().toISOString();
  const ingredients = Array.isArray(input.ingredients)
    ? input.ingredients.map(normaliseIngredient).filter((item) => item.name)
    : [];
  const steps = Array.isArray(input.steps)
    ? input.steps.map(normaliseStep).filter((item) => item.text)
    : [];

  return {
    id: existing?.id || cleanText(input.id) || randomUUID(),
    slug: cleanText(input.slug),
    title: cleanText(input.title, 'Untitled recipe'),
    description: cleanText(input.description),
    category: cleanText(input.category, 'Everyday'),
    cuisine: cleanText(input.cuisine, 'Home cooking'),
    difficulty: ['Easy', 'Medium', 'Advanced'].includes(input.difficulty)
      ? input.difficulty
      : 'Easy',
    prepMinutes: Math.max(0, cleanNumber(input.prepMinutes, 0)),
    cookMinutes: Math.max(0, cleanNumber(input.cookMinutes, 0)),
    servings: Math.max(1, cleanNumber(input.servings, 1)),
    tags: Array.isArray(input.tags)
      ? [...new Set(input.tags.map((tag) => cleanText(tag)).filter(Boolean))]
      : [],
    image: cleanText(input.image, existing?.image || ''),
    sourceUrl: cleanText(input.sourceUrl),
    notes: cleanText(input.notes),
    favourite: Boolean(input.favourite),
    plannedNutritionPerServing: input.plannedNutritionPerServing ? {
      kcal: cleanNumber(input.plannedNutritionPerServing.kcal, 0),
      protein: cleanNumber(input.plannedNutritionPerServing.protein ?? input.plannedNutritionPerServing.protein_g, 0),
      carbs: cleanNumber(input.plannedNutritionPerServing.carbs ?? input.plannedNutritionPerServing.carbs_g, 0),
      fat: cleanNumber(input.plannedNutritionPerServing.fat ?? input.plannedNutritionPerServing.fat_g, 0),
      fibre: cleanNumber(input.plannedNutritionPerServing.fibre ?? input.plannedNutritionPerServing.fiber ?? input.plannedNutritionPerServing.fiber_g, 0),
    } : null,
    useIngredientNutrition: Boolean(input.useIngredientNutrition),
    ingredients,
    steps,
    createdAt: existing?.createdAt || cleanText(input.createdAt, now),
    updatedAt: now,
  };
}

export async function readRecipes() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error(`Could not parse data/recipes.json: ${error.message}`);
  }
}

async function writeRecipes(recipes) {
  await ensureStore();
  const temporaryFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(recipes, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryFile, DATA_FILE);
}

export function createRecipe(input) {
  return serialiseMutation(async () => {
    const recipes = await readRecipes();
    const recipe = normaliseRecipe(input);
    recipes.unshift(recipe);
    await writeRecipes(recipes);
    return recipe;
  });
}

export function updateRecipe(id, input) {
  return serialiseMutation(async () => {
    const recipes = await readRecipes();
    const index = recipes.findIndex((recipe) => recipe.id === id);
    if (index === -1) return null;
    recipes[index] = normaliseRecipe({ ...recipes[index], ...input }, recipes[index]);
    await writeRecipes(recipes);
    return recipes[index];
  });
}

export function deleteRecipe(id) {
  return serialiseMutation(async () => {
    const recipes = await readRecipes();
    const next = recipes.filter((recipe) => recipe.id !== id);
    if (next.length === recipes.length) return false;
    await writeRecipes(next);
    return true;
  });
}
