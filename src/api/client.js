import { runtimeConfig } from '../config/runtime';

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error || message;
    } catch {
      // Keep the HTTP fallback message.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

const localService = {
  listIngredients: () => request('/api/ingredients'),
  createIngredient: (ingredient) => request('/api/ingredients', { method: 'POST', body: JSON.stringify(ingredient) }),
  updateIngredient: (id, ingredient) => request(`/api/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(ingredient) }),
  listRecipes: () => request('/api/recipes'),
  createRecipe: (recipe) => request('/api/recipes', { method: 'POST', body: JSON.stringify(recipe) }),
  updateRecipe: (id, recipe) => request(`/api/recipes/${id}`, { method: 'PUT', body: JSON.stringify(recipe) }),
  deleteRecipe: (id) => request(`/api/recipes/${id}`, { method: 'DELETE' }),
  getCart: () => request('/api/cart'),
  saveCart: (cart) => request('/api/cart', { method: 'PUT', body: JSON.stringify(cart) }),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/api/uploads', { method: 'POST', body: formData });
  },
  listNutritionCache: (query = '') => request(`/api/nutrition/cache?q=${encodeURIComponent(query)}&limit=100`),
  searchNutrition: (query, { refresh = false } = {}) => request(`/api/nutrition/search?q=${encodeURIComponent(query)}${refresh ? '&refresh=1' : ''}`),
  getNutritionFood: (id, { refresh = false } = {}) => request(`/api/nutrition/foods/${encodeURIComponent(id)}${refresh ? '?refresh=1' : ''}`),
  syncRecipeNutrition: ({ forceRefresh = false } = {}) => request('/api/nutrition/sync-recipes', { method: 'POST', body: JSON.stringify({ forceRefresh }) }),
};

let servicePromise = null;

async function getService() {
  if (runtimeConfig.backend === 'local') return localService;
  if (!servicePromise) {
    servicePromise = import('../services/firebaseData').then(({ firebaseDataService }) => firebaseDataService);
  }
  const service = await servicePromise;
  await service.prepare();
  return service;
}

function call(method, ...args) {
  return getService().then((service) => service[method](...args));
}

function subscribe(method, fallbackMethod, onValue, onError) {
  let active = true;
  let unsubscribe = () => {};
  getService().then((service) => {
    if (!active) return;
    if (typeof service[method] === 'function') {
      unsubscribe = service[method](onValue, onError);
      return;
    }
    service[fallbackMethod]().then((value) => {
      if (active) onValue(value);
    }).catch(onError);
  }).catch(onError);
  return () => {
    active = false;
    unsubscribe();
  };
}

export const api = {
  backend: runtimeConfig.backend,
  listIngredients: (...args) => call('listIngredients', ...args),
  createIngredient: (...args) => call('createIngredient', ...args),
  updateIngredient: (...args) => call('updateIngredient', ...args),
  subscribeIngredients: (onValue, onError) => subscribe('subscribeIngredients', 'listIngredients', onValue, onError),
  listRecipes: (...args) => call('listRecipes', ...args),
  createRecipe: (...args) => call('createRecipe', ...args),
  updateRecipe: (...args) => call('updateRecipe', ...args),
  deleteRecipe: (...args) => call('deleteRecipe', ...args),
  subscribeRecipes: (onValue, onError) => subscribe('subscribeRecipes', 'listRecipes', onValue, onError),
  getCart: (...args) => call('getCart', ...args),
  saveCart: (...args) => call('saveCart', ...args),
  subscribeCart: (onValue, onError) => subscribe('subscribeCart', 'getCart', onValue, onError),
  uploadImage: (...args) => call('uploadImage', ...args),
  listNutritionCache: (...args) => call('listNutritionCache', ...args),
  searchNutrition: (...args) => call('searchNutrition', ...args),
  getNutritionFood: (...args) => call('getNutritionFood', ...args),
  syncRecipeNutrition: (...args) => call('syncRecipeNutrition', ...args),
};
