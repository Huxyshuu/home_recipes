import express from 'express';
import compression from 'compression';
import multer from 'multer';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  createRecipe,
  deleteRecipe,
  readRecipes,
  updateRecipe,
} from './recipeStore.js';
import { getFineliFood, listCachedFineliFoods, searchFineli } from './fineli.js';
import { readCart, writeCart } from './cartStore.js';

const app = express();
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.resolve(process.cwd());
const DIST_DIR = path.join(ROOT, 'dist');
const UPLOAD_DIR = path.join(ROOT, 'uploads');

await fs.mkdir(UPLOAD_DIR, { recursive: true });

const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, UPLOAD_DIR),
  filename: (_request, file, callback) => {
    const extension = ALLOWED_IMAGE_TYPES.get(file.mimetype) || '.jpg';
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(new Error('Only JPEG, PNG, and WebP image uploads are allowed.'));
      return;
    }
    callback(null, true);
  },
});

app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use('/api/nutrition', (_request, response, next) => {
  response.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'Home Recipes', time: new Date().toISOString() });
});

app.get('/api/recipes', async (_request, response, next) => {
  try {
    response.json(await readRecipes());
  } catch (error) {
    next(error);
  }
});

app.post('/api/recipes', async (request, response, next) => {
  try {
    response.status(201).json(await createRecipe(request.body));
  } catch (error) {
    next(error);
  }
});

app.put('/api/recipes/:id', async (request, response, next) => {
  try {
    const recipe = await updateRecipe(request.params.id, request.body);
    if (!recipe) {
      response.status(404).json({ error: 'Recipe not found.' });
      return;
    }
    response.json(recipe);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/recipes/:id', async (request, response, next) => {
  try {
    const deleted = await deleteRecipe(request.params.id);
    if (!deleted) {
      response.status(404).json({ error: 'Recipe not found.' });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/cart', async (_request, response, next) => {
  try {
    response.json(await readCart());
  } catch (error) {
    next(error);
  }
});

app.put('/api/cart', async (request, response, next) => {
  try {
    response.json(await writeCart(request.body));
  } catch (error) {
    next(error);
  }
});

app.post('/api/uploads', upload.single('image'), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'No image was uploaded.' });
    return;
  }
  response.status(201).json({ url: `/uploads/${request.file.filename}` });
});

app.get('/api/nutrition/cache', async (request, response, next) => {
  try {
    response.json(await listCachedFineliFoods({
      query: String(request.query.q || ''),
      limit: request.query.limit,
    }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/nutrition/search', async (request, response, next) => {
  try {
    const query = String(request.query.q || '').trim();
    if (query.length < 2) {
      response.json({ results: [], source: 'none', stale: false });
      return;
    }
    response.json(await searchFineli(query, { forceRefresh: request.query.refresh === '1' }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/nutrition/foods/:id', async (request, response, next) => {
  try {
    response.json(await getFineliFood(request.params.id, { forceRefresh: request.query.refresh === '1' }));
  } catch (error) {
    next(error);
  }
});

try {
  await fs.access(DIST_DIR);
  app.use(express.static(DIST_DIR, { maxAge: '1h' }));
  app.get('*', (_request, response) => response.sendFile(path.join(DIST_DIR, 'index.html')));
} catch {
  app.get('/', (_request, response) => {
    response.status(503).send(
      '<h1>Home Recipes API is running</h1><p>Run <code>npm run build</code> before opening the production interface.</p>',
    );
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);
  const message = error.message || 'Unexpected server error.';
  let status = 500;
  if (error instanceof multer.MulterError || message.startsWith('Only JPEG') || message.startsWith('Invalid Fineli') || message.startsWith('Nutrition search')) status = 400;
  else if (error.status === 404) status = 404;
  else if (message.startsWith('Fineli') || message.includes('Fineli returned')) status = 502;
  response.status(status).json({ error: message });
});

app.listen(PORT, HOST, () => {
  console.log(`Home Recipes is available at http://${HOST}:${PORT}`);
  console.log(`On another device, open http://<this-computer-ip>:${PORT}`);
});
