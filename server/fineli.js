import { createFineliCache } from './fineliCache.js';

const FINELI_BASE = 'https://fineli.fi/fineli/api/v1';
const REQUEST_TIMEOUT_MS = 12000;
const MAX_ATTEMPTS = 3;
const SEARCH_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const FOOD_CACHE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const defaultCache = createFineliCache();
let componentCodesPromise = null;

function localised(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return value.fi || value.en || value.sv || Object.values(value).find((entry) => typeof entry === 'string') || '';
}

function numeric(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rounded(value) {
  return Math.round((numeric(value) || 0) * 10) / 10;
}

function findCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['foods', 'content', 'items', 'results', 'data']) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

function getFoodName(item) {
  return localised(item?.name)
    || localised(item?.foodName)
    || localised(item?.description)
    || localised(item?.shortName)
    || localised(item?.food?.name)
    || `Fineli food ${item?.id ?? ''}`.trim();
}

function getFoodType(item) {
  return localised(item?.type?.description)
    || localised(item?.foodType?.description)
    || localised(item?.functionClass?.description)
    || '';
}

function validId(value) {
  return /^\d+$/.test(String(value));
}

function ageMs(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? Date.now() - parsed : Number.POSITIVE_INFINITY;
}

export function normaliseSearchResults(payload) {
  return findCollection(payload)
    .map((item) => ({
      id: item?.id ?? item?.foodId ?? item?.food?.id ?? item?.indexableId ?? null,
      name: getFoodName(item),
      type: getFoodType(item),
    }))
    .filter((item) => item.id !== null && validId(item.id) && item.name)
    .filter((item, index, all) => all.findIndex((candidate) => String(candidate.id) === String(item.id)) === index);
}

function detectCode(node) {
  const candidates = [
    node?.code,
    node?.indexableId,
    node?.componentCode,
    node?.foodComponentCode,
    node?.component?.code,
    node?.component?.indexableId,
    node?.foodComponent?.code,
    node?.foodComponent?.indexableId,
    node?.nutrient?.code,
    node?.eufdName?.code,
    node?.eurofirName?.code,
    node?.type?.code,
  ];
  return candidates.find((value) => typeof value === 'string')?.toUpperCase() || '';
}

function detectValue(node) {
  const candidates = [node?.value, node?.amount, node?.quantity, node?.componentValue, node?.valuePer100g, node?.content];
  for (const candidate of candidates) {
    const parsed = numeric(candidate);
    if (parsed !== null) return parsed;
  }
  return null;
}

function detectUnit(node) {
  return (
    localised(node?.unit)
    || localised(node?.unitOfMeasurement?.abbreviation)
    || localised(node?.component?.unitOfMeasurement?.abbreviation)
    || localised(node?.foodComponent?.unitOfMeasurement?.abbreviation)
    || ''
  ).toLowerCase();
}

function collectEntries(node, output, visited, depth = 0) {
  if (node === null || node === undefined || depth > 8 || typeof node !== 'object' || visited.has(node)) return;
  visited.add(node);

  const code = detectCode(node);
  const value = detectValue(node);
  if (code && value !== null) output.push({ code, value, unit: detectUnit(node) });

  if (Array.isArray(node)) {
    node.forEach((entry) => collectEntries(entry, output, visited, depth + 1));
    return;
  }
  Object.values(node).forEach((entry) => collectEntries(entry, output, visited, depth + 1));
}

function firstEntry(entries, codes) {
  return entries.find((entry) => codes.includes(entry.code));
}

function mappedDataEntries(payload, componentCodes = []) {
  if (!Array.isArray(payload?.data) || !componentCodes.length) return [];
  return payload.data.map((value, index) => ({
    code: componentCodes[index]?.code || '',
    unit: componentCodes[index]?.unit || '',
    value: numeric(value),
  })).filter((entry) => entry.code && entry.value !== null);
}

function normaliseMeasures(payload) {
  return (Array.isArray(payload?.units) ? payload.units : [])
    .map((unit) => ({
      code: unit?.code || '',
      name: localised(unit?.description) || localised(unit?.abbreviation),
      abbreviation: localised(unit?.abbreviation),
      grams: numeric(unit?.mass),
    }))
    .filter((unit) => unit.abbreviation && unit.grams !== null);
}

export function normaliseFoodDetail(payload, componentCodes = []) {
  const entries = [];
  collectEntries(payload, entries, new WeakSet());
  entries.push(...mappedDataEntries(payload, componentCodes));

  const directEnergyKcal = numeric(payload?.energyKcal);
  const directEnergyKj = numeric(payload?.energy);
  const energyEntry = firstEntry(entries, ['ENERC', 'ENERGY', 'KCAL']);
  let kcal = directEnergyKcal;
  if (kcal === null) {
    if (directEnergyKj !== null) kcal = directEnergyKj / 4.184;
    else if (energyEntry) kcal = energyEntry.unit.includes('kcal') || energyEntry.code === 'KCAL' ? energyEntry.value : energyEntry.value / 4.184;
    else kcal = 0;
  }

  const protein = numeric(payload?.protein) ?? firstEntry(entries, ['PROT', 'PROTEIN'])?.value ?? 0;
  const carbs = numeric(payload?.carbohydrate) ?? firstEntry(entries, ['CHOAVL', 'CHO', 'TOTALCAR', 'CARB', 'CARBOHYDRATE'])?.value ?? 0;
  const fat = numeric(payload?.fat) ?? firstEntry(entries, ['FAT', 'TOTALFAT'])?.value ?? 0;
  const fibre = numeric(payload?.fiber) ?? numeric(payload?.fibre) ?? firstEntry(entries, ['FIBT', 'FIBRE', 'FIBER'])?.value ?? 0;

  return {
    id: payload?.id ?? payload?.foodId ?? payload?.food?.id ?? payload?.indexableId ?? null,
    name: getFoodName(payload),
    type: getFoodType(payload),
    baseAmountGrams: numeric(payload?.mass) ?? numeric(payload?.amount) ?? 100,
    measures: normaliseMeasures(payload),
    nutritionPer100g: {
      kcal: rounded(kcal),
      protein: rounded(protein),
      carbs: rounded(carbs),
      fat: rounded(fat),
      fibre: rounded(fibre),
    },
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fineliFetch(pathname) {
  let latestError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${FINELI_BASE}${pathname}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Home-Recipes/0.4 (private local recipe application)',
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const error = new Error(`Fineli responded with HTTP ${response.status}`);
        error.status = response.status;
        error.retryable = retryable;
        throw error;
      }
      const body = await response.text();
      try {
        return JSON.parse(body);
      } catch {
        const error = new Error('Fineli returned an unexpected non-JSON response');
        error.retryable = true;
        throw error;
      }
    } catch (error) {
      latestError = error.name === 'AbortError' ? new Error('Fineli request timed out') : error;
      const retryable = error.name === 'AbortError' || error.retryable || error instanceof TypeError;
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await wait(250 * (2 ** (attempt - 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw latestError || new Error('Fineli request failed');
}

async function getComponentCodes() {
  if (!componentCodesPromise) {
    componentCodesPromise = fineliFetch('/components/')
      .then((components) => findCollection(components).map((component) => ({
        code: detectCode(component),
        unit: detectUnit(component),
      })))
      .catch(() => []);
  }
  return componentCodesPromise;
}

export async function searchFineli(query, { forceRefresh = false, cache = defaultCache } = {}) {
  const cleaned = String(query || '').trim();
  if (cleaned.length < 2 || cleaned.length > 80) throw new Error('Nutrition search must contain 2–80 characters.');
  const cached = await cache.getSearch(cleaned);
  if (!forceRefresh && cached && ageMs(cached.cachedAt) <= SEARCH_CACHE_MAX_AGE_MS) {
    return { results: cached.results, source: 'cache', cachedAt: cached.cachedAt, stale: false };
  }

  try {
    const payload = await fineliFetch(`/foods?q=${encodeURIComponent(cleaned)}`);
    const results = normaliseSearchResults(payload);
    const stored = await cache.putSearch(cleaned, results);
    return { results, source: 'fineli', cachedAt: stored?.cachedAt || new Date().toISOString(), stale: false };
  } catch (error) {
    if (cached) return { results: cached.results, source: 'cache', cachedAt: cached.cachedAt, stale: true, warning: error.message };
    throw error;
  }
}

export async function getFineliFood(id, { forceRefresh = false, cache = defaultCache } = {}) {
  if (!validId(id)) throw new Error('Invalid Fineli food identifier.');
  const cached = await cache.getFood(id);
  const cachedDate = cached?.refreshedAt || cached?.cachedAt;
  if (!forceRefresh && cached && ageMs(cachedDate) <= FOOD_CACHE_MAX_AGE_MS) {
    return { ...cached.food, cache: { source: 'cache', cachedAt: cachedDate, stale: false } };
  }

  try {
    const payload = await fineliFetch(`/foods/${encodeURIComponent(id)}`);
    let food = normaliseFoodDetail(payload);
    const macros = food.nutritionPer100g;
    if (!macros.kcal && !macros.protein && !macros.carbs && !macros.fat) {
      food = normaliseFoodDetail(payload, await getComponentCodes());
    }
    if (!food.id || !food.name) throw new Error('Fineli returned an incomplete food record.');
    const stored = await cache.putFood(food);
    return { ...food, cache: { source: 'fineli', cachedAt: stored?.refreshedAt || new Date().toISOString(), stale: false } };
  } catch (error) {
    if (cached) return { ...cached.food, cache: { source: 'cache', cachedAt: cachedDate, stale: true, warning: error.message } };
    throw error;
  }
}

export async function listCachedFineliFoods(options = {}, cache = defaultCache) {
  const [results, stats] = await Promise.all([cache.listFoods(options), cache.stats()]);
  return { results, stats };
}

export { defaultCache as fineliCache };
