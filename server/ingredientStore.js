import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const ROOT = path.resolve(process.cwd());
const DATA_FILE = process.env.INGREDIENT_DATA_FILE
  ? path.resolve(process.env.INGREDIENT_DATA_FILE)
  : path.join(ROOT, 'data', 'ingredients.json');

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

function normaliseName(value) {
  return cleanText(value)
    .toLocaleLowerCase('fi-FI')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9åäö]+/g, ' ')
    .trim();
}

function normaliseMeasure(measure = {}) {
  return {
    code: cleanText(measure.code),
    name: cleanText(measure.name),
    abbreviation: cleanText(measure.abbreviation),
    grams: Math.max(0, cleanNumber(measure.grams, 0)),
  };
}

function normaliseSelectedPrice(price = null) {
  if (!price || typeof price !== 'object') return null;
  const unitPriceEur = cleanNumber(price.unitPriceEur, 0);
  const packagePriceEur = cleanNumber(price.packagePriceEur, 0);
  if (unitPriceEur <= 0 && packagePriceEur <= 0) return null;
  return {
    retailer: cleanText(price.retailer),
    productName: cleanText(price.productName),
    sourceUrl: cleanText(price.sourceUrl),
    unitPriceEur: Math.max(0, unitPriceEur),
    priceUnit: cleanText(price.priceUnit, 'kg'),
    packagePriceEur: Math.max(0, packagePriceEur),
    packageSize: Math.max(0, cleanNumber(price.packageSize, 0)),
    packageUnit: cleanText(price.packageUnit, 'g'),
    store: cleanText(price.store),
    observedAt: cleanText(price.observedAt),
    note: cleanText(price.note),
  };
}

function normaliseRetail(retail = {}) {
  return {
    sKaupatUrl: cleanText(retail.sKaupatUrl),
    kRuokaUrl: cleanText(retail.kRuokaUrl),
    selectedPrice: normaliseSelectedPrice(retail.selectedPrice),
  };
}

export function normaliseIngredientDefinition(input = {}, existing = null) {
  const now = new Date().toISOString();
  return {
    id: existing?.id || cleanText(input.id) || randomUUID(),
    name: cleanText(input.name, existing?.name || 'Nimetön ainesosa'),
    nameEn: cleanText(input.nameEn, existing?.nameEn || ''),
    shoppingCategory: cleanText(input.shoppingCategory, existing?.shoppingCategory || 'Muut'),
    shoppingCategoryEn: cleanText(input.shoppingCategoryEn, existing?.shoppingCategoryEn || ''),
    fineliQuery: cleanText(input.fineliQuery, input.name || existing?.fineliQuery || existing?.name || ''),
    fineliPreferredTerms: Array.isArray(input.fineliPreferredTerms)
      ? input.fineliPreferredTerms.map((term) => cleanText(term)).filter(Boolean)
      : (existing?.fineliPreferredTerms || []),
    fineliFoodId: input.fineliFoodId ?? existing?.fineliFoodId ?? null,
    fineliFoodName: cleanText(input.fineliFoodName, existing?.fineliFoodName || ''),
    fineliMeasures: Array.isArray(input.fineliMeasures)
      ? input.fineliMeasures.map(normaliseMeasure).filter((measure) => measure.abbreviation && measure.grams > 0)
      : (existing?.fineliMeasures || []),
    nutritionSource: input.nutritionSource && typeof input.nutritionSource === 'object' ? {
      provider: cleanText(input.nutritionSource.provider),
      status: cleanText(input.nutritionSource.status),
      syncedAt: cleanText(input.nutritionSource.syncedAt),
      matchMethod: cleanText(input.nutritionSource.matchMethod),
    } : (existing?.nutritionSource || null),
    retail: input.retail !== undefined ? normaliseRetail(input.retail) : (existing?.retail || normaliseRetail()),
    nutritionPer100g: {
      kcal: cleanNumber(input.nutritionPer100g?.kcal, existing?.nutritionPer100g?.kcal || 0),
      protein: cleanNumber(input.nutritionPer100g?.protein, existing?.nutritionPer100g?.protein || 0),
      carbs: cleanNumber(input.nutritionPer100g?.carbs, existing?.nutritionPer100g?.carbs || 0),
      fat: cleanNumber(input.nutritionPer100g?.fat, existing?.nutritionPer100g?.fat || 0),
      fibre: cleanNumber(input.nutritionPer100g?.fibre, existing?.nutritionPer100g?.fibre || 0),
    },
    createdAt: existing?.createdAt || cleanText(input.createdAt, now),
    updatedAt: now,
  };
}

export async function readIngredients() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error(`Could not parse data/ingredients.json: ${error.message}`);
  }
}

export async function writeIngredients(ingredients) {
  await ensureStore();
  const temporaryFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(ingredients, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryFile, DATA_FILE);
}

export function createIngredient(input) {
  return serialiseMutation(async () => {
    const ingredients = await readIngredients();
    const sameName = ingredients.find((ingredient) => normaliseName(ingredient.name) === normaliseName(input.name));
    if (sameName) return sameName;
    const ingredient = normaliseIngredientDefinition(input);
    ingredients.push(ingredient);
    ingredients.sort((a, b) => a.name.localeCompare(b.name, 'fi'));
    await writeIngredients(ingredients);
    return ingredient;
  });
}

export function updateIngredient(id, input) {
  return serialiseMutation(async () => {
    const ingredients = await readIngredients();
    const index = ingredients.findIndex((ingredient) => ingredient.id === id);
    if (index === -1) return null;
    ingredients[index] = normaliseIngredientDefinition({ ...ingredients[index], ...input }, ingredients[index]);
    ingredients.sort((a, b) => a.name.localeCompare(b.name, 'fi'));
    await writeIngredients(ingredients);
    return ingredients.find((ingredient) => ingredient.id === id);
  });
}

export function ensureIngredientDefinitions(recipeIngredients = []) {
  return serialiseMutation(async () => {
    const catalog = await readIngredients();
    let changed = false;
    const linked = recipeIngredients.map((ingredient) => {
      let definition = ingredient.catalogId
        ? catalog.find((entry) => entry.id === ingredient.catalogId)
        : null;
      if (!definition && ingredient.name) {
        definition = catalog.find((entry) => normaliseName(entry.name) === normaliseName(ingredient.name));
      }
      if (!definition) {
        definition = normaliseIngredientDefinition(ingredient);
        catalog.push(definition);
        changed = true;
      }
      return definition;
    });
    if (changed) {
      catalog.sort((a, b) => a.name.localeCompare(b.name, 'fi'));
      await writeIngredients(catalog);
    }
    return linked;
  });
}

export function hydrateIngredientUsage(usage = {}, definition = null) {
  if (!definition) return usage;
  return {
    ...definition,
    id: cleanText(usage.id) || randomUUID(),
    catalogId: definition.id,
    quantity: cleanNumber(usage.quantity, 0),
    unit: cleanText(usage.unit, 'g'),
    unitEn: cleanText(usage.unitEn),
    grams: cleanNumber(usage.grams, 0),
    note: cleanText(usage.note),
    noteEn: cleanText(usage.noteEn),
  };
}
