import { runtimeConfig } from '../config/runtime';

const FINELI_BASE = 'https://fineli.fi/fineli/api/v1';
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

export function normaliseSearchResults(payload) {
  return findCollection(payload)
    .map((item) => ({
      id: item?.id ?? item?.foodId ?? item?.food?.id ?? item?.indexableId ?? null,
      name: getFoodName(item),
      type: getFoodType(item),
    }))
    .filter((item) => item.id !== null && /^\d+$/.test(String(item.id)) && item.name)
    .filter((item, index, all) => all.findIndex((candidate) => String(candidate.id) === String(item.id)) === index);
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

  return {
    id: payload?.id ?? payload?.foodId ?? payload?.food?.id ?? payload?.indexableId ?? null,
    name: getFoodName(payload),
    type: getFoodType(payload),
    baseAmountGrams: numeric(payload?.mass) ?? numeric(payload?.amount) ?? 100,
    measures: normaliseMeasures(payload),
    nutritionPer100g: {
      kcal: rounded(kcal),
      protein: rounded(numeric(payload?.protein) ?? firstEntry(entries, ['PROT', 'PROTEIN'])?.value ?? 0),
      carbs: rounded(numeric(payload?.carbohydrate) ?? firstEntry(entries, ['CHOAVL', 'CHO', 'TOTALCAR', 'CARB', 'CARBOHYDRATE'])?.value ?? 0),
      fat: rounded(numeric(payload?.fat) ?? firstEntry(entries, ['FAT', 'TOTALFAT'])?.value ?? 0),
      fibre: rounded(numeric(payload?.fiber) ?? numeric(payload?.fibre) ?? firstEntry(entries, ['FIBT', 'FIBRE', 'FIBER'])?.value ?? 0),
    },
  };
}

function browserFineliError(error) {
  const suffix = runtimeConfig.fineliProxyUrl
    ? ''
    : ' The Fineli server may be blocking browser requests. Configure VITE_FINELI_PROXY_URL or run the Fineli sync in local mode.';
  return new Error(`${error.message || 'Fineli request failed.'}${suffix}`);
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Fineli responded with HTTP ${response.status}.`);
    return response.json();
  } catch (error) {
    throw browserFineliError(error);
  }
}

function directUrl(pathname) {
  return `${FINELI_BASE}${pathname}`;
}

export async function searchFineliBrowser(query) {
  const cleaned = String(query || '').trim();
  if (cleaned.length < 2 || cleaned.length > 80) throw new Error('Nutrition search must contain 2–80 characters.');
  if (runtimeConfig.fineliProxyUrl) {
    const payload = await fetchJson(`${runtimeConfig.fineliProxyUrl}/search?q=${encodeURIComponent(cleaned)}`);
    return payload.results ? payload : { results: normaliseSearchResults(payload), source: 'proxy', stale: false };
  }
  const payload = await fetchJson(directUrl(`/foods?q=${encodeURIComponent(cleaned)}`));
  return { results: normaliseSearchResults(payload), source: 'fineli', stale: false };
}

async function getComponentCodes() {
  if (!componentCodesPromise) {
    componentCodesPromise = fetchJson(directUrl('/components/'))
      .then((payload) => findCollection(payload).map((component) => ({
        code: detectCode(component),
        unit: detectUnit(component),
      })))
      .catch(() => []);
  }
  return componentCodesPromise;
}

export async function getFineliFoodBrowser(id) {
  if (!/^\d+$/.test(String(id))) throw new Error('Invalid Fineli food identifier.');
  if (runtimeConfig.fineliProxyUrl) {
    return fetchJson(`${runtimeConfig.fineliProxyUrl}/foods/${encodeURIComponent(id)}`);
  }
  const payload = await fetchJson(directUrl(`/foods/${encodeURIComponent(id)}`));
  let food = normaliseFoodDetail(payload);
  const macros = food.nutritionPer100g;
  if (!macros.kcal && !macros.protein && !macros.carbs && !macros.fat) {
    food = normaliseFoodDetail(payload, await getComponentCodes());
  }
  return food;
}
