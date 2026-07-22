import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const ROOT = path.resolve(process.cwd());
const DATA_FILE = process.env.CART_DATA_FILE
  ? path.resolve(process.env.CART_DATA_FILE)
  : path.join(ROOT, 'data', 'shopping-cart.json');

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
    await fs.writeFile(DATA_FILE, `${JSON.stringify({ name: 'My grocery cart', items: [], updatedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
  }
}

function cleanText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normaliseItem(item = {}) {
  return {
    id: cleanText(item.id) || randomUUID(),
    name: cleanText(item.name, 'Ingredient'),
    quantity: Math.max(0, cleanNumber(item.quantity, 0)),
    unit: cleanText(item.unit, 'g'),
    category: cleanText(item.category, 'Muut'),
    checked: Boolean(item.checked),
    sources: Array.isArray(item.sources)
      ? [...new Set(item.sources.map((source) => cleanText(source)).filter(Boolean))]
      : [],
    retail: item.retail && typeof item.retail === 'object' ? {
      sKaupatUrl: cleanText(item.retail.sKaupatUrl),
      kRuokaUrl: cleanText(item.retail.kRuokaUrl),
      selectedPrice: item.retail.selectedPrice && typeof item.retail.selectedPrice === 'object' ? {
        retailer: cleanText(item.retail.selectedPrice.retailer),
        productName: cleanText(item.retail.selectedPrice.productName),
        sourceUrl: cleanText(item.retail.selectedPrice.sourceUrl),
        unitPriceEur: Math.max(0, cleanNumber(item.retail.selectedPrice.unitPriceEur, 0)),
        priceUnit: cleanText(item.retail.selectedPrice.priceUnit),
        packagePriceEur: Math.max(0, cleanNumber(item.retail.selectedPrice.packagePriceEur, 0)),
        packageSize: Math.max(0, cleanNumber(item.retail.selectedPrice.packageSize, 0)),
        packageUnit: cleanText(item.retail.selectedPrice.packageUnit),
        store: cleanText(item.retail.selectedPrice.store),
        observedAt: cleanText(item.retail.selectedPrice.observedAt),
      } : null,
    } : null,
  };
}

function normaliseCart(input = {}) {
  return {
    name: cleanText(input.name, 'My grocery cart'),
    items: Array.isArray(input.items) ? input.items.map(normaliseItem) : [],
    updatedAt: new Date().toISOString(),
  };
}

export async function readCart() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return normaliseCart(parsed);
  } catch (error) {
    throw new Error(`Could not parse data/shopping-cart.json: ${error.message}`);
  }
}

export function writeCart(input) {
  return serialiseMutation(async () => {
    const cart = normaliseCart(input);
    await ensureStore();
    const temporaryFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(temporaryFile, `${JSON.stringify(cart, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryFile, DATA_FILE);
    return cart;
  });
}
