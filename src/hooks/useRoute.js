import { useCallback, useEffect, useMemo, useState } from 'react';

const VIEW_PATHS = {
  library: '/',
  routine: '/routine',
  ingredients: '/ingredients',
  guide: '/guide',
  substitutions: '/substitutions',
  cart: '/cart',
  stats: '/stats',
};

function normalisePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function parseRoute(pathname = window.location.pathname) {
  const path = normalisePath(pathname);
  if (path === '/') return { name: 'library', view: 'library', path };
  if (path === '/routine') return { name: 'routine', view: 'routine', path };
  if (path === '/ingredients') return { name: 'ingredients', view: 'ingredients', path };
  if (path === '/guide') return { name: 'guide', view: 'guide', path };
  if (path === '/substitutions') return { name: 'substitutions', view: 'substitutions', path };
  if (path === '/cart') return { name: 'cart', view: 'cart', path };
  if (path === '/stats') return { name: 'stats', view: 'stats', path };
  if (path === '/recipes/new') return { name: 'recipe-new', view: 'library', path };

  const editMatch = path.match(/^\/recipes\/([^/]+)\/edit$/);
  if (editMatch) return { name: 'recipe-edit', view: 'library', recipeId: decodeURIComponent(editMatch[1]), path };

  const recipeMatch = path.match(/^\/recipes\/([^/]+)$/);
  if (recipeMatch) return { name: 'recipe-detail', view: 'library', recipeId: decodeURIComponent(recipeMatch[1]), path };

  return { name: 'not-found', view: 'library', path };
}

export function viewPath(view) {
  return VIEW_PATHS[view] || '/';
}

export function recipePath(id) {
  return `/recipes/${encodeURIComponent(id)}`;
}

export function recipeEditPath(id) {
  return `${recipePath(id)}/edit`;
}

export function useRoute() {
  const [locationKey, setLocationKey] = useState(() => `${window.location.pathname}${window.location.search}`);

  useEffect(() => {
    const onPopState = () => setLocationKey(`${window.location.pathname}${window.location.search}`);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const route = useMemo(() => parseRoute(window.location.pathname), [locationKey]);

  const navigate = useCallback((path, { replace = false } = {}) => {
    const nextPath = normalisePath(path);
    const state = { homeRecipesNavigation: true, from: window.location.pathname };
    if (replace) window.history.replaceState(state, '', nextPath);
    else window.history.pushState(state, '', nextPath);
    setLocationKey(`${window.location.pathname}${window.location.search}`);
    window.scrollTo?.({ top: 0, behavior: 'auto' });
  }, []);

  const closeToPreviousOr = useCallback((fallback = '/') => {
    if (window.history.state?.homeRecipesNavigation) {
      window.history.back();
      return;
    }
    navigate(fallback, { replace: true });
  }, [navigate]);

  return { route, navigate, closeToPreviousOr };
}
