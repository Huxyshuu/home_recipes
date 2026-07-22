import path from 'node:path';
import { promises as fs } from 'node:fs';

const DEFAULT_MAX_FOODS = 250;
const DEFAULT_MAX_QUERIES = 100;

function normaliseQuery(query) {
  return String(query || '').trim().toLocaleLowerCase('fi-FI');
}

function timestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyCache() {
  return {
    version: 1,
    updatedAt: null,
    foods: {},
    queries: {},
  };
}

function newestFirst(entries) {
  return entries.sort((a, b) => timestamp(b[1]?.lastAccessedAt || b[1]?.cachedAt) - timestamp(a[1]?.lastAccessedAt || a[1]?.cachedAt));
}

export function createFineliCache({
  filePath = path.resolve(process.cwd(), 'data', 'fineli-cache.json'),
  maxFoods = DEFAULT_MAX_FOODS,
  maxQueries = DEFAULT_MAX_QUERIES,
} = {}) {
  let mutationQueue = Promise.resolve();

  async function read() {
    try {
      const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
      return {
        ...emptyCache(),
        ...payload,
        foods: payload?.foods && typeof payload.foods === 'object' ? payload.foods : {},
        queries: payload?.queries && typeof payload.queries === 'object' ? payload.queries : {},
      };
    } catch (error) {
      if (error.code === 'ENOENT') return emptyCache();
      throw error;
    }
  }

  function trim(cache) {
    cache.foods = Object.fromEntries(newestFirst(Object.entries(cache.foods)).slice(0, maxFoods));
    cache.queries = Object.fromEntries(newestFirst(Object.entries(cache.queries)).slice(0, maxQueries));
    return cache;
  }

  async function write(cache) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const now = new Date().toISOString();
    const payload = trim({ ...cache, updatedAt: now });
    const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
    return payload;
  }

  function mutate(mutator) {
    const operation = mutationQueue.then(async () => {
      const cache = await read();
      await mutator(cache);
      return write(cache);
    });
    mutationQueue = operation.catch(() => undefined);
    return operation;
  }

  async function getFood(id) {
    const key = String(id);
    const cache = await read();
    const entry = cache.foods[key];
    if (!entry?.food) return null;
    return entry;
  }

  async function putFood(food) {
    if (food?.id === null || food?.id === undefined) return null;
    const now = new Date().toISOString();
    const key = String(food.id);
    await mutate((cache) => {
      cache.foods[key] = {
        food,
        cachedAt: cache.foods[key]?.cachedAt || now,
        refreshedAt: now,
        lastAccessedAt: now,
      };
    });
    return getFood(key);
  }

  async function getSearch(query) {
    const key = normaliseQuery(query);
    if (!key) return null;
    const cache = await read();
    const entry = cache.queries[key];
    if (!entry?.results) return null;
    return entry;
  }

  async function putSearch(query, results) {
    const key = normaliseQuery(query);
    if (!key) return null;
    const now = new Date().toISOString();
    await mutate((cache) => {
      cache.queries[key] = {
        query: String(query).trim(),
        results,
        cachedAt: now,
        lastAccessedAt: now,
      };
    });
    return getSearch(key);
  }

  async function listFoods({ query = '', limit = 100 } = {}) {
    const cache = await read();
    const needle = normaliseQuery(query);
    const boundedLimit = Math.max(1, Math.min(Number(limit) || 100, 250));
    return newestFirst(Object.entries(cache.foods))
      .map(([, entry]) => ({
        ...entry.food,
        cachedAt: entry.refreshedAt || entry.cachedAt,
      }))
      .filter((food) => {
        if (!needle) return true;
        const searchable = [food.name, food.type, ...(food.aliases || [])].join(' ').toLocaleLowerCase('fi-FI');
        return searchable.includes(needle);
      })
      .slice(0, boundedLimit);
  }

  async function stats() {
    const cache = await read();
    return {
      foods: Object.keys(cache.foods).length,
      searches: Object.keys(cache.queries).length,
      updatedAt: cache.updatedAt,
      limits: { foods: maxFoods, searches: maxQueries },
    };
  }

  return { getFood, putFood, getSearch, putSearch, listFoods, stats, read };
}
