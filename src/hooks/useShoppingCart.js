import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { mergeShoppingItems, recipeShoppingItems } from '../utils/shopping';

const emptyCart = { name: 'My grocery cart', items: [], updatedAt: '' };

export function useShoppingCart() {
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cartRef = useRef(emptyCart);
  const saveQueueRef = useRef(Promise.resolve());
  const revisionRef = useRef(0);

  const applyCart = useCallback((next) => {
    cartRef.current = next;
    setCart(next);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      applyCart(await api.getCart());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [applyCart]);

  useEffect(() => api.subscribeCart((next) => {
    applyCart(next);
    setLoading(false);
    setError('');
  }, (requestError) => {
    setError(requestError.message);
    setLoading(false);
  }), [applyCart]);

  const commit = useCallback((updater) => {
    const nextCart = typeof updater === 'function' ? updater(cartRef.current) : updater;
    const revision = revisionRef.current + 1;
    revisionRef.current = revision;
    applyCart(nextCart);
    setError('');

    const task = saveQueueRef.current.then(() => api.saveCart(nextCart));
    saveQueueRef.current = task.catch(() => undefined);
    return task.then((saved) => {
      if (revision === revisionRef.current) applyCart(saved);
      return saved;
    }).catch(async (requestError) => {
      if (revision === revisionRef.current) {
        setError(requestError.message);
        try {
          applyCart(await api.getCart());
        } catch {
          // Keep the optimistic list visible if the backend is unavailable.
        }
      }
      throw requestError;
    });
  }, [applyCart]);

  const addRecipe = useCallback((recipe, multiplier = 1) => {
    const additions = recipeShoppingItems(recipe, multiplier, recipe.title);
    return commit((current) => ({
      ...current,
      name: current.name || 'My grocery cart',
      items: mergeShoppingItems([...(current.items || []), ...additions]),
    }));
  }, [commit]);

  const replace = useCallback((name, items) => commit({ name, items: mergeShoppingItems(items) }), [commit]);
  const toggle = useCallback((id) => commit((current) => ({
    ...current,
    items: current.items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item),
  })), [commit]);
  const remove = useCallback((id) => commit((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) })), [commit]);
  const clearChecked = useCallback(() => commit((current) => ({ ...current, items: current.items.filter((item) => !item.checked) })), [commit]);
  const clearAll = useCallback(() => commit((current) => ({ ...current, items: [] })), [commit]);

  return { cart, loading, error, refresh, addRecipe, replace, toggle, remove, clearChecked, clearAll };
}
