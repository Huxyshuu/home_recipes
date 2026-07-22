import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRecipes(await api.listRecipes());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(async (recipe) => {
    const saved = recipe.id
      ? await api.updateRecipe(recipe.id, recipe)
      : await api.createRecipe(recipe);
    setRecipes((current) => {
      const withoutSaved = current.filter((entry) => entry.id !== saved.id);
      return [saved, ...withoutSaved];
    });
    return saved;
  }, []);

  const remove = useCallback(async (id) => {
    await api.deleteRecipe(id);
    setRecipes((current) => current.filter((recipe) => recipe.id !== id));
  }, []);

  return { recipes, loading, error, refresh, save, remove };
}
