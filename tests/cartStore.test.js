import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('shared grocery cart persists atomically', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'lettucecook-cart-'));
  const dataFile = path.join(directory, 'shopping-cart.json');
  process.env.CART_DATA_FILE = dataFile;
  const store = await import(`../server/cartStore.js?test=${Date.now()}`);

  try {
    const saved = await store.writeCart({
      name: 'Sunday shop',
      items: [{ name: 'Skyr', quantity: 1000, unit: 'g', category: 'Dairy & chilled', sources: ['Monday'] }],
    });
    assert.equal(saved.name, 'Sunday shop');
    assert.equal(saved.items.length, 1);
    const read = await store.readCart();
    assert.equal(read.items[0].quantity, 1000);
    const raw = await readFile(dataFile, 'utf8');
    assert.doesNotThrow(() => JSON.parse(raw));
  } finally {
    delete process.env.CART_DATA_FILE;
    await rm(directory, { recursive: true, force: true });
  }
});
