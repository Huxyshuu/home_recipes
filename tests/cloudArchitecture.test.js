import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';

async function read(path) {
  return fs.readFile(path, 'utf8');
}

test('public build includes Firebase authentication, Firestore and Cloudinary adapters', async () => {
  const [pkg, authGate, firebaseData, rules] = await Promise.all([
    read('package.json'),
    read('src/auth/AuthGate.jsx'),
    read('src/services/firebaseData.js'),
    read('firestore.rules'),
  ]);
  assert.match(pkg, /"firebase"/);
  assert.match(authGate, /signInWithEmailAndPassword/);
  assert.match(authGate, /sharedLoginEmail/);
  assert.match(authGate, /browser data/);
  assert.match(firebaseData, /collection\(db, 'recipes'\)/);
  assert.match(firebaseData, /api\.cloudinary\.com/);
  assert.match(rules, /request\.auth\.uid/);
});

test('recipe routes are addressable and hosting rewrites deep links to the SPA', async () => {
  const [router, app, hosting] = await Promise.all([
    read('src/hooks/useRoute.js'),
    read('src/App.jsx'),
    read('firebase.json'),
  ]);
  assert.match(router, /\/recipes\\\/\(\[\^\/\]\+\)/);
  assert.match(router, /pushState/);
  assert.match(router, /popstate/);
  assert.match(app, /recipePath\(recipe\.id\)/);
  assert.match(hosting, /"source": "\*\*"/);
  assert.match(hosting, /"destination": "\/index\.html"/);
});

test('local JSON mode remains available for LAN use', async () => {
  const [modeFile, packageFile, apiClient] = await Promise.all([
    read('.env.lan'),
    read('package.json'),
    read('src/api/client.js'),
  ]);
  assert.match(modeFile, /VITE_DATA_BACKEND=local/);
  assert.match(packageFile, /build:local/);
  assert.match(packageFile, /npm run build:local && npm start/);
  assert.match(apiClient, /const localService/);
  assert.match(apiClient, /runtimeConfig\.backend === 'local'/);
});
