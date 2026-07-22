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

export const api = {
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
};
