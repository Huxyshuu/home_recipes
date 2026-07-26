import seedIngredients from '../../data/ingredients.json';
import seedRecipes from '../../data/recipes.json';
import seedCart from '../../data/shopping-cart.json';
import { runtimeConfig } from '../config/runtime';
import { getFirebaseClient } from './firebaseClient';
import { getFineliFoodBrowser, searchFineliBrowser } from './fineliBrowser';
import { withRetailerLinkFallbacks } from '../utils/retailerLinks';

const BOOTSTRAP_VERSION = '0.6.0';
let bootstrapPromise = null;

function cleanClone(value) {
  return JSON.parse(JSON.stringify(value, (_key, entry) => entry === undefined ? null : entry));
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `lc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function normaliseIngredient(input = {}, existing = null) {
  const now = new Date().toISOString();
  const name = cleanText(input.name, existing?.name || 'Nimetön ainesosa');
  const retail = withRetailerLinkFallbacks(name, input.retail ?? existing?.retail);
  return cleanClone({
    ...existing,
    ...input,
    id: existing?.id || cleanText(input.id) || randomId(),
    name,
    nameEn: cleanText(input.nameEn, existing?.nameEn || ''),
    shoppingCategory: cleanText(input.shoppingCategory, existing?.shoppingCategory || 'Muut'),
    shoppingCategoryEn: cleanText(input.shoppingCategoryEn, existing?.shoppingCategoryEn || ''),
    fineliQuery: cleanText(input.fineliQuery, input.name || existing?.fineliQuery || existing?.name || ''),
    fineliPreferredTerms: Array.isArray(input.fineliPreferredTerms) ? input.fineliPreferredTerms.filter(Boolean) : (existing?.fineliPreferredTerms || []),
    fineliFoodId: input.fineliFoodId ?? existing?.fineliFoodId ?? null,
    fineliFoodName: cleanText(input.fineliFoodName, existing?.fineliFoodName || ''),
    fineliMeasures: Array.isArray(input.fineliMeasures) ? input.fineliMeasures : (existing?.fineliMeasures || []),
    nutritionSource: input.nutritionSource ?? existing?.nutritionSource ?? null,
    retail,
    nutritionPer100g: {
      kcal: cleanNumber(input.nutritionPer100g?.kcal, existing?.nutritionPer100g?.kcal || 0),
      protein: cleanNumber(input.nutritionPer100g?.protein, existing?.nutritionPer100g?.protein || 0),
      carbs: cleanNumber(input.nutritionPer100g?.carbs, existing?.nutritionPer100g?.carbs || 0),
      fat: cleanNumber(input.nutritionPer100g?.fat, existing?.nutritionPer100g?.fat || 0),
      fibre: cleanNumber(input.nutritionPer100g?.fibre, existing?.nutritionPer100g?.fibre || 0),
    },
    createdAt: existing?.createdAt || cleanText(input.createdAt, now),
    updatedAt: now,
  });
}

function ingredientUsage(input = {}) {
  return cleanClone({
    id: cleanText(input.id) || randomId(),
    catalogId: cleanText(input.catalogId),
    quantity: cleanNumber(input.quantity, 0),
    unit: cleanText(input.unit, 'g'),
    unitEn: cleanText(input.unitEn),
    grams: cleanNumber(input.grams, 0),
    note: cleanText(input.note),
    noteEn: cleanText(input.noteEn),
  });
}

function normaliseStep(step = {}, index = 0) {
  if (typeof step === 'string') return { id: randomId(), title: `Step ${index + 1}`, text: step.trim(), timerMinutes: 0 };
  return cleanClone({
    id: cleanText(step.id) || randomId(),
    title: cleanText(step.title, `Step ${index + 1}`),
    titleEn: cleanText(step.titleEn),
    text: cleanText(step.text),
    textEn: cleanText(step.textEn),
    timerMinutes: Math.max(0, cleanNumber(step.timerMinutes, 0)),
  });
}

function normaliseRecipe(input = {}, existing = null) {
  const now = new Date().toISOString();
  return cleanClone({
    ...existing,
    ...input,
    id: existing?.id || cleanText(input.id) || randomId(),
    slug: cleanText(input.slug),
    title: cleanText(input.title, 'Untitled recipe'),
    titleEn: cleanText(input.titleEn),
    description: cleanText(input.description),
    descriptionEn: cleanText(input.descriptionEn),
    category: cleanText(input.category, 'Arki'),
    categoryEn: cleanText(input.categoryEn),
    cuisine: cleanText(input.cuisine, 'Kotiruoka'),
    cuisineEn: cleanText(input.cuisineEn),
    difficulty: cleanText(input.difficulty, 'Helppo'),
    difficultyEn: cleanText(input.difficultyEn),
    prepMinutes: Math.max(0, cleanNumber(input.prepMinutes, 0)),
    cookMinutes: Math.max(0, cleanNumber(input.cookMinutes, 0)),
    servings: Math.max(1, cleanNumber(input.servings, 1)),
    tags: Array.isArray(input.tags) ? [...new Set(input.tags.filter(Boolean))] : [],
    tagsEn: Array.isArray(input.tagsEn) ? [...new Set(input.tagsEn.filter(Boolean))] : [],
    image: cleanText(input.image, existing?.image || ''),
    sourceUrl: cleanText(input.sourceUrl),
    notes: cleanText(input.notes),
    notesEn: cleanText(input.notesEn),
    favourite: Boolean(input.favourite),
    plannedNutritionPerServing: input.plannedNutritionPerServing || null,
    useIngredientNutrition: Boolean(input.useIngredientNutrition),
    nutritionStatus: cleanText(input.nutritionStatus),
    nutritionDisclaimerFi: cleanText(input.nutritionDisclaimerFi),
    fineliSyncedAt: cleanText(input.fineliSyncedAt),
    ingredients: Array.isArray(input.ingredients) ? input.ingredients.map(ingredientUsage).filter((item) => item.catalogId) : [],
    steps: Array.isArray(input.steps) ? input.steps.map(normaliseStep).filter((step) => step.text) : [],
    createdAt: existing?.createdAt || cleanText(input.createdAt, now),
    updatedAt: now,
  });
}


function ingredientWithDefaults(ingredient = {}) {
  return {
    ...ingredient,
    retail: withRetailerLinkFallbacks(ingredient.name, ingredient.retail),
  };
}

function hydrateRecipes(recipes, ingredients) {
  const catalog = new Map(ingredients.map(ingredientWithDefaults).map((ingredient) => [ingredient.id, ingredient]));
  return recipes.map((recipe) => ({
    ...recipe,
    ingredients: (recipe.ingredients || []).map((usage) => {
      const definition = catalog.get(usage.catalogId);
      return definition ? { ...definition, ...usage, catalogId: definition.id } : usage;
    }),
  }));
}

function ingredientsWithUsage(ingredients, recipes) {
  const usage = new Map();
  recipes.forEach((recipe) => {
    (recipe.ingredients || []).forEach((item) => {
      if (!item.catalogId) return;
      if (!usage.has(item.catalogId)) usage.set(item.catalogId, []);
      const list = usage.get(item.catalogId);
      if (!list.some((entry) => entry.id === recipe.id)) list.push({ id: recipe.id, title: recipe.title, slug: recipe.slug });
    });
  });
  return ingredients.map(ingredientWithDefaults).map((ingredient) => ({
    ...ingredient,
    usedInRecipes: usage.get(ingredient.id) || [],
    usageCount: (usage.get(ingredient.id) || []).length,
  }));
}

async function ensureSeeded() {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    const { db, firestoreModule: fs } = await getFirebaseClient();
    const metaRef = fs.doc(db, 'meta', 'bootstrap');
    const meta = await fs.getDoc(metaRef);
    if (meta.exists()) return meta.data();

    const batch = fs.writeBatch(db);
    seedIngredients.forEach((ingredient) => batch.set(fs.doc(db, 'ingredients', ingredient.id), cleanClone(ingredient)));
    seedRecipes.forEach((recipe) => batch.set(fs.doc(db, 'recipes', recipe.id), cleanClone(recipe)));
    batch.set(fs.doc(db, 'appState', 'sharedCart'), cleanClone(seedCart));
    batch.set(metaRef, {
      version: BOOTSTRAP_VERSION,
      seededAt: new Date().toISOString(),
      recipeCount: seedRecipes.length,
      ingredientCount: seedIngredients.length,
    });
    await batch.commit();
    return { version: BOOTSTRAP_VERSION };
  })();
  return bootstrapPromise;
}

async function loadCollections() {
  await ensureSeeded();
  const { db, firestoreModule: fs } = await getFirebaseClient();
  const [recipeSnapshot, ingredientSnapshot] = await Promise.all([
    fs.getDocs(fs.collection(db, 'recipes')),
    fs.getDocs(fs.collection(db, 'ingredients')),
  ]);
  const recipes = recipeSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const ingredients = ingredientSnapshot.docs.map((item) => ingredientWithDefaults({ id: item.id, ...item.data() }));
  return { recipes, ingredients };
}

function subscribePair(onValue, onError, projector) {
  let stopped = false;
  let unsubRecipes = () => {};
  let unsubIngredients = () => {};
  let recipes = [];
  let ingredients = [];
  let recipesReady = false;
  let ingredientsReady = false;

  const emit = () => {
    if (!stopped && recipesReady && ingredientsReady) onValue(projector(recipes, ingredients));
  };

  ensureSeeded().then(async () => {
    if (stopped) return;
    const { db, firestoreModule: fs } = await getFirebaseClient();
    unsubRecipes = fs.onSnapshot(fs.collection(db, 'recipes'), (snapshot) => {
      recipes = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      recipesReady = true;
      emit();
    }, onError);
    unsubIngredients = fs.onSnapshot(fs.collection(db, 'ingredients'), (snapshot) => {
      ingredients = snapshot.docs.map((item) => ingredientWithDefaults({ id: item.id, ...item.data() }));
      ingredientsReady = true;
      emit();
    }, onError);
  }).catch(onError);

  return () => {
    stopped = true;
    unsubRecipes();
    unsubIngredients();
  };
}

function normalise(value) {
  return String(value || '')
    .toLocaleLowerCase('fi-FI')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9åäö]+/g, ' ')
    .trim();
}

function candidateScore(candidate, query, preferredTerms) {
  const name = normalise(candidate.name);
  const cleanQuery = normalise(query);
  const terms = (preferredTerms || []).map(normalise).filter(Boolean);
  let score = 0;
  if (name === cleanQuery) score += 100;
  if (name.startsWith(cleanQuery)) score += 45;
  if (name.includes(cleanQuery)) score += 25;
  if (terms.length && terms.every((term) => name.includes(term))) score += 65;
  score += terms.filter((term) => name.includes(term)).length * 12;
  return score;
}

function selectCandidate(results, query, preferredTerms) {
  const ranked = [...results]
    .map((candidate) => ({ candidate, score: candidateScore(candidate, query, preferredTerms) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 20) return null;
  return {
    ...ranked[0].candidate,
    matchMethod: ranked[0].score >= 100 ? 'exact-name' : ranked[0].score >= 65 ? 'preferred-terms' : 'best-token-match',
  };
}

async function uploadToCloudinary(file) {
  const { cloudName, unsignedUploadPreset } = runtimeConfig.cloudinary;
  if (!cloudName || !unsignedUploadPreset) {
    throw new Error('Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UNSIGNED_UPLOAD_PRESET.');
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Only JPEG, PNG, and WebP image uploads are allowed.');
  if (file.size > 8 * 1024 * 1024) throw new Error('The image must be 8 MB or smaller.');

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', unsignedUploadPreset);
  body.append('tags', 'lettucecook');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: 'POST',
    body,
  });
  if (!response.ok) {
    let message = `Cloudinary upload failed (${response.status}).`;
    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch {
      // Keep fallback.
    }
    throw new Error(message);
  }
  const payload = await response.json();
  return { url: payload.secure_url, publicId: payload.public_id, width: payload.width, height: payload.height };
}

export const firebaseDataService = {
  async prepare() {
    return ensureSeeded();
  },

  async listRecipes() {
    const { recipes, ingredients } = await loadCollections();
    return hydrateRecipes(recipes, ingredients);
  },

  subscribeRecipes(onValue, onError) {
    return subscribePair(onValue, onError, hydrateRecipes);
  },

  async createRecipe(recipe) {
    return this.saveRecipe(recipe);
  },

  async updateRecipe(_id, recipe) {
    return this.saveRecipe(recipe);
  },

  async saveRecipe(recipe) {
    await ensureSeeded();
    const { db, firestoreModule: fs } = await getFirebaseClient();
    const normalised = normaliseRecipe(recipe, recipe.id ? recipe : null);
    await fs.setDoc(fs.doc(db, 'recipes', normalised.id), normalised);
    return { ...recipe, ...normalised, ingredients: recipe.ingredients || [] };
  },

  async deleteRecipe(id) {
    const { db, firestoreModule: fs } = await getFirebaseClient();
    await fs.deleteDoc(fs.doc(db, 'recipes', id));
  },

  async listIngredients() {
    const { recipes, ingredients } = await loadCollections();
    return ingredientsWithUsage(ingredients, recipes).sort((a, b) => a.name.localeCompare(b.name, 'fi'));
  },

  subscribeIngredients(onValue, onError) {
    return subscribePair(onValue, onError, (recipes, ingredients) => ingredientsWithUsage(ingredients, recipes).sort((a, b) => a.name.localeCompare(b.name, 'fi')));
  },

  async createIngredient(input) {
    await ensureSeeded();
    const all = await this.listIngredients();
    const existing = all.find((item) => normaliseName(item.name) === normaliseName(input.name));
    if (existing) return existing;
    const ingredient = normaliseIngredient(input);
    const { db, firestoreModule: fs } = await getFirebaseClient();
    await fs.setDoc(fs.doc(db, 'ingredients', ingredient.id), ingredient);
    return ingredient;
  },

  async updateIngredient(id, input) {
    const all = await this.listIngredients();
    const existing = all.find((item) => item.id === id);
    if (!existing) throw new Error('Ingredient not found.');
    const ingredient = normaliseIngredient(input, existing);
    const { db, firestoreModule: fs } = await getFirebaseClient();
    await fs.setDoc(fs.doc(db, 'ingredients', id), ingredient);
    return ingredient;
  },

  async getCart() {
    await ensureSeeded();
    const { db, firestoreModule: fs } = await getFirebaseClient();
    const snapshot = await fs.getDoc(fs.doc(db, 'appState', 'sharedCart'));
    return snapshot.exists() ? snapshot.data() : { name: 'My grocery cart', items: [], updatedAt: '' };
  },

  subscribeCart(onValue, onError) {
    let unsubscribe = () => {};
    let stopped = false;
    ensureSeeded().then(async () => {
      if (stopped) return;
      const { db, firestoreModule: fs } = await getFirebaseClient();
      unsubscribe = fs.onSnapshot(fs.doc(db, 'appState', 'sharedCart'), (snapshot) => {
        onValue(snapshot.exists() ? snapshot.data() : { name: 'My grocery cart', items: [], updatedAt: '' });
      }, onError);
    }).catch(onError);
    return () => { stopped = true; unsubscribe(); };
  },

  async saveCart(cart) {
    const next = cleanClone({ ...cart, updatedAt: new Date().toISOString() });
    const { db, firestoreModule: fs } = await getFirebaseClient();
    await fs.setDoc(fs.doc(db, 'appState', 'sharedCart'), next);
    return next;
  },

  uploadImage: uploadToCloudinary,

  async listNutritionCache(query = '') {
    const ingredients = await this.listIngredients();
    const needle = normalise(query);
    const results = ingredients
      .filter((item) => item.fineliFoodId && (!needle || normalise(`${item.fineliFoodName} ${item.name}`).includes(needle)))
      .map((item) => ({
        id: item.fineliFoodId,
        name: item.fineliFoodName || item.name,
        type: 'Saved shared ingredient',
        measures: item.fineliMeasures || [],
        nutritionPer100g: item.nutritionPer100g,
      }));
    return { results, stats: { foods: results.length, searches: 0 } };
  },

  searchNutrition(query) {
    return searchFineliBrowser(query);
  },

  getNutritionFood(id) {
    return getFineliFoodBrowser(id);
  },

  async syncRecipeNutrition() {
    const { recipes, ingredients } = await loadCollections();
    const unresolved = [];
    const syncedAt = new Date().toISOString();
    const nextIngredients = [];

    for (const ingredient of ingredients) {
      try {
        let candidate = ingredient.fineliFoodId ? {
          id: ingredient.fineliFoodId,
          name: ingredient.fineliFoodName || ingredient.name,
          matchMethod: 'stored-id',
        } : null;
        if (!candidate) {
          const search = await searchFineliBrowser(ingredient.fineliQuery || ingredient.name);
          candidate = selectCandidate(search.results || [], ingredient.fineliQuery || ingredient.name, ingredient.fineliPreferredTerms);
        }
        if (!candidate) {
          unresolved.push({ name: ingredient.name, query: ingredient.fineliQuery || ingredient.name, reason: 'No sufficiently close Fineli match.' });
          nextIngredients.push(ingredient);
          continue;
        }
        const food = await getFineliFoodBrowser(candidate.id);
        nextIngredients.push(normaliseIngredient({
          ...ingredient,
          fineliFoodId: food.id,
          fineliFoodName: food.name,
          fineliMeasures: food.measures || [],
          nutritionPer100g: food.nutritionPer100g,
          nutritionSource: {
            provider: 'THL Fineli API',
            status: 'verified-api',
            syncedAt,
            matchMethod: candidate.matchMethod,
          },
        }, ingredient));
      } catch (error) {
        unresolved.push({ name: ingredient.name, query: ingredient.fineliQuery || ingredient.name, reason: error.message });
        nextIngredients.push(ingredient);
      }
    }

    const statusById = new Map(nextIngredients.map((ingredient) => [ingredient.id, ingredient.nutritionSource?.status]));
    const nextRecipes = recipes.map((recipe) => {
      const usages = recipe.ingredients || [];
      const resolvedCount = usages.filter((usage) => statusById.get(usage.catalogId) === 'verified-api').length;
      const allResolved = usages.length > 0 && resolvedCount === usages.length;
      return {
        ...recipe,
        useIngredientNutrition: allResolved,
        nutritionStatus: allResolved ? 'fineli-synced' : resolvedCount ? 'fineli-partial' : 'fineli-sync-required',
        fineliSyncedAt: resolvedCount ? syncedAt : recipe.fineliSyncedAt || '',
        updatedAt: resolvedCount ? syncedAt : recipe.updatedAt,
      };
    });

    const { db, firestoreModule: fs } = await getFirebaseClient();
    const batch = fs.writeBatch(db);
    nextIngredients.forEach((ingredient) => batch.set(fs.doc(db, 'ingredients', ingredient.id), cleanClone(ingredient)));
    nextRecipes.forEach((recipe) => batch.set(fs.doc(db, 'recipes', recipe.id), cleanClone(recipe)));
    await batch.commit();

    return {
      syncedAt,
      recipes: nextRecipes.length,
      uniqueIngredients: nextIngredients.length,
      resolvedUniqueIngredients: nextIngredients.length - unresolved.length,
      unresolvedUniqueIngredients: unresolved.length,
      unresolved,
    };
  },
};
