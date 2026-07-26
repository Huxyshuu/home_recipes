import React, { useMemo, useState } from 'react';
import Header from './components/Header';
import Icon from './components/Icon';
import RecipeGrid from './components/RecipeGrid';
import RecipeDetail from './components/RecipeDetail';
import RecipeEditor from './components/RecipeEditor';
import StatsDashboard from './components/StatsDashboard';
import RoutinePage from './components/RoutinePage';
import NutritionGuide from './components/NutritionGuide';
import SubstitutionsPage from './components/SubstitutionsPage';
import GroceryCart from './components/GroceryCart';
import IngredientLibrary from './components/IngredientLibrary';
import { useRecipes } from './hooks/useRecipes';
import { useShoppingCart } from './hooks/useShoppingCart';
import { recipeNutrition } from './utils/nutrition';
import { todayGreeting } from './utils/format';
import { buildShoppingWindowItems } from './utils/shopping';
import { shoppingWindows } from './data/mealPlan';
import { recipeEditPath, recipePath, useRoute, viewPath } from './hooks/useRoute';
import { useAuth } from './auth/AuthGate';

function RouteNotFound({ onHome }) {
  return (
    <main className="page">
      <section className="empty-state panel route-empty-state">
        <span className="empty-icon"><Icon name="book" size={36} /></span>
        <h1>That page is not in the recipe book</h1>
        <p>The recipe may have been removed, or the address may be incomplete.</p>
        <button className="button button-primary" type="button" onClick={onHome}>Open all recipes</button>
      </section>
    </main>
  );
}

export default function App() {
  const { recipes, loading, error, refresh, save, remove } = useRecipes();
  const shoppingCart = useShoppingCart();
  const { route, navigate, closeToPreviousOr } = useRoute();
  const { mode, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [notice, setNotice] = useState('');

  const selected = route.recipeId ? recipes.find((recipe) => recipe.id === route.recipeId) || null : null;
  const categories = useMemo(() => ['All', ...new Set(recipes.map((recipe) => recipe.category).filter(Boolean))], [recipes]);
  const difficulties = useMemo(() => ['All', ...new Set(recipes.map((recipe) => recipe.difficulty).filter(Boolean))], [recipes]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const result = recipes.filter((recipe) => {
      const haystack = [recipe.title, recipe.titleEn, recipe.description, recipe.descriptionEn, recipe.category, recipe.categoryEn, recipe.cuisine, recipe.cuisineEn, ...(recipe.tags || []), ...(recipe.tagsEn || []), ...(recipe.ingredients || []).flatMap((ingredient) => [ingredient.name, ingredient.nameEn])].join(' ').toLowerCase();
      return (!needle || haystack.includes(needle))
        && (category === 'All' || recipe.category === category)
        && (difficulty === 'All' || recipe.difficulty === difficulty)
        && (!favouritesOnly || recipe.favourite);
    });

    return [...result].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'quickest') return (a.prepMinutes + a.cookMinutes) - (b.prepMinutes + b.cookMinutes);
      if (sort === 'calories') return recipeNutrition(a).perServing.kcal - recipeNutrition(b).perServing.kcal;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
  }, [recipes, search, category, difficulty, favouritesOnly, sort]);

  const quickStats = useMemo(() => {
    const totalKcal = recipes.reduce((sum, recipe) => sum + recipeNutrition(recipe).perServing.kcal, 0);
    return {
      recipes: recipes.length,
      favourites: recipes.filter((recipe) => recipe.favourite).length,
      averageKcal: recipes.length ? Math.round(totalKcal / recipes.length) : 0,
    };
  }, [recipes]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  }

  async function saveRecipe(recipe) {
    const existed = Boolean(recipe.id);
    const saved = await save(recipe);
    navigate(recipePath(saved.id), { replace: true });
    showNotice(existed ? 'Recipe updated.' : 'Recipe added to your kitchen.');
  }

  async function deleteRecipe(id) {
    await remove(id);
    navigate('/', { replace: true });
    showNotice('Recipe deleted.');
  }

  async function toggleFavourite(recipe) {
    try {
      await save({ ...recipe, favourite: !recipe.favourite });
    } catch (requestError) {
      showNotice(requestError.message);
    }
  }

  async function addRecipeToCart(recipe, multiplier = 1) {
    try {
      await shoppingCart.addRecipe(recipe, multiplier);
      showNotice(`${recipe.title} added to the grocery cart.`);
    } catch (requestError) {
      showNotice(requestError.message);
    }
  }

  async function buildRoutineCart(windowId) {
    const config = shoppingWindows[windowId];
    if (!config) return;
    if (shoppingCart.cart.items.length && !window.confirm(`Replace the current grocery cart with “${config.title}”?`)) return;
    try {
      const items = buildShoppingWindowItems(recipes, windowId);
      await shoppingCart.replace(config.title, items);
      navigate('/cart');
      showNotice(`${config.title} created with ${items.length} combined ingredients.`);
    } catch (requestError) {
      showNotice(requestError.message);
    }
  }

  if (route.name === 'recipe-new') {
    return <RecipeEditor recipe={null} onCancel={() => closeToPreviousOr('/')} onSave={saveRecipe} />;
  }

  if (route.name === 'recipe-edit') {
    if (loading) return <div className="editor-shell"><div className="loading-state panel"><span className="spinner" /><p>Opening the recipe editor…</p></div></div>;
    if (!selected) return <RouteNotFound onHome={() => navigate('/', { replace: true })} />;
    return <RecipeEditor recipe={selected} onCancel={() => closeToPreviousOr(recipePath(selected.id))} onSave={saveRecipe} />;
  }

  function renderLibrary() {
    return (
      <main className="page library-page">
        <section className="library-hero">
          <div className="hero-copy">
            <span className="eyebrow">{todayGreeting()}</span>
            <h1>What shall we cook?</h1>
            <p>Your reliable weekly favourites, cooking steps, grocery cart and Finnish nutrition references in one calm kitchen view.</p>
            <div className="hero-search">
              <Icon name="search" size={21} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes, ingredients, or tags…" />
              {search ? <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><Icon name="close" size={17} /></button> : null}
            </div>
          </div>
          <div className="hero-stats">
            <div><strong>{quickStats.recipes}</strong><span>Recipes</span></div>
            <div><strong>{quickStats.favourites}</strong><span>Favourites</span></div>
            <div><strong>{quickStats.averageKcal}</strong><span>Avg. kcal</span></div>
          </div>
        </section>

        <section className="library-toolbar panel">
          <div className="toolbar-label"><Icon name="filter" size={18} /><span>Filter your library</span></div>
          <div className="toolbar-controls">
            <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>{difficulties.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Recently updated</option><option value="title">Title A–Z</option><option value="quickest">Quickest first</option><option value="calories">Lowest calories</option></select></label>
            <button className={`favourite-filter ${favouritesOnly ? 'is-active' : ''}`} type="button" onClick={() => setFavouritesOnly((value) => !value)}><Icon name="heart" size={17} /> Favourites</button>
          </div>
        </section>

        <section className="library-heading">
          <div><span className="eyebrow">Kitchen collection</span><h2>{filtered.length === recipes.length ? 'All recipes' : `${filtered.length} matching recipes`}</h2></div>
          <button className="button button-primary mobile-add" type="button" onClick={() => navigate('/recipes/new')}><Icon name="plus" size={17} /> Add</button>
        </section>

        {loading ? <div className="loading-state panel"><span className="spinner" /><p>{mode === 'firebase' ? 'Opening the cloud recipe book…' : 'Opening your recipe book…'}</p></div> : null}
        {error ? <div className="error-state panel"><Icon name="info" size={26} /><div><strong>Could not load the recipe database</strong><p>{error}</p><button className="button button-secondary" type="button" onClick={refresh}>Try again</button></div></div> : null}
        {!loading && !error ? <RecipeGrid recipes={filtered} onOpen={(recipe) => navigate(recipePath(recipe.id))} onFavourite={toggleFavourite} onAddToCart={addRecipeToCart} onAdd={() => navigate('/recipes/new')} /> : null}

        <footer className="app-footer">
          <span>Nutrition data integration: Finnish Institute for Health and Welfare, Fineli (CC BY 4.0).</span>
          <span>{mode === 'firebase' ? 'Firebase cloud sync · Cloudinary images · Available anywhere' : 'Local JSON mode · Shared on the home network'}</span>
        </footer>
      </main>
    );
  }

  function renderView() {
    if (route.name === 'not-found') return <RouteNotFound onHome={() => navigate('/', { replace: true })} />;
    if (route.view === 'ingredients') return <IngredientLibrary onIngredientsUpdated={refresh} />;
    if (route.view === 'routine') return <RoutinePage recipes={recipes} onOpenRecipe={(recipe) => navigate(recipePath(recipe.id))} onBuildCart={buildRoutineCart} />;
    if (route.view === 'guide') return <NutritionGuide onRecipesUpdated={refresh} />;
    if (route.view === 'substitutions') return <SubstitutionsPage />;
    if (route.view === 'cart') return <GroceryCart cart={shoppingCart.cart} loading={shoppingCart.loading} error={shoppingCart.error} onRefresh={shoppingCart.refresh} onToggle={shoppingCart.toggle} onRemove={shoppingCart.remove} onClearChecked={shoppingCart.clearChecked} onClearAll={shoppingCart.clearAll} backend={mode} />;
    if (route.view === 'stats') return <StatsDashboard recipes={recipes} />;
    return renderLibrary();
  }

  const detailMissing = route.name === 'recipe-detail' && !loading && !selected;

  return (
    <div className="app-shell">
      <Header
        view={route.view}
        onChangeView={(next) => navigate(viewPath(next))}
        onAdd={() => navigate('/recipes/new')}
        cartCount={shoppingCart.cart.items.length}
        backend={mode}
        onLogout={mode === 'firebase' ? logout : null}
      />
      {detailMissing ? <RouteNotFound onHome={() => navigate('/', { replace: true })} /> : renderView()}
      {route.name === 'recipe-detail' && selected ? (
        <RecipeDetail
          recipe={selected}
          onClose={() => closeToPreviousOr('/')}
          onEdit={(recipe) => navigate(recipeEditPath(recipe.id))}
          onDelete={deleteRecipe}
          onFavourite={toggleFavourite}
          onAddToCart={addRecipeToCart}
        />
      ) : null}
      {notice ? <div className="toast"><Icon name="check" size={18} /> {notice}</div> : null}
    </div>
  );
}
