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
import { useRecipes } from './hooks/useRecipes';
import { useShoppingCart } from './hooks/useShoppingCart';
import { recipeNutrition } from './utils/nutrition';
import { todayGreeting } from './utils/format';
import { buildShoppingWindowItems } from './utils/shopping';
import { shoppingWindows } from './data/mealPlan';

export default function App() {
  const { recipes, loading, error, refresh, save, remove } = useRecipes();
  const shoppingCart = useShoppingCart();
  const [view, setView] = useState('library');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [notice, setNotice] = useState('');

  const categories = useMemo(() => ['All', ...new Set(recipes.map((recipe) => recipe.category).filter(Boolean))], [recipes]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const result = recipes.filter((recipe) => {
      const haystack = [recipe.title, recipe.description, recipe.category, recipe.cuisine, ...(recipe.tags || []), ...(recipe.ingredients || []).map((ingredient) => ingredient.name)].join(' ').toLowerCase();
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
      categories: Math.max(0, categories.length - 1),
      favourites: recipes.filter((recipe) => recipe.favourite).length,
      averageKcal: recipes.length ? Math.round(totalKcal / recipes.length) : 0,
    };
  }, [recipes, categories.length]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  }

  async function saveRecipe(recipe) {
    const saved = await save(recipe);
    setEditing(null);
    setSelected(saved);
    showNotice(recipe.id ? 'Recipe updated.' : 'Recipe added to your kitchen.');
  }

  async function deleteRecipe(id) {
    await remove(id);
    setSelected(null);
    showNotice('Recipe deleted.');
  }

  async function toggleFavourite(recipe) {
    try {
      const saved = await save({ ...recipe, favourite: !recipe.favourite });
      if (selected?.id === saved.id) setSelected(saved);
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
      setSelected(null);
      setView('cart');
      showNotice(`${config.title} created with ${items.length} combined ingredients.`);
    } catch (requestError) {
      showNotice(requestError.message);
    }
  }

  if (editing !== null) {
    return <RecipeEditor recipe={editing || null} onCancel={() => setEditing(null)} onSave={saveRecipe} />;
  }

  function renderView() {
    if (view === 'routine') return <RoutinePage recipes={recipes} onOpenRecipe={setSelected} onBuildCart={buildRoutineCart} />;
    if (view === 'guide') return <NutritionGuide />;
    if (view === 'substitutions') return <SubstitutionsPage />;
    if (view === 'cart') return <GroceryCart cart={shoppingCart.cart} loading={shoppingCart.loading} error={shoppingCart.error} onRefresh={shoppingCart.refresh} onToggle={shoppingCart.toggle} onRemove={shoppingCart.remove} onClearChecked={shoppingCart.clearChecked} onClearAll={shoppingCart.clearAll} />;
    if (view === 'stats') return <StatsDashboard recipes={recipes} />;

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
            <label><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All</option><option>Easy</option><option>Medium</option><option>Advanced</option></select></label>
            <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Recently updated</option><option value="title">Title A–Z</option><option value="quickest">Quickest first</option><option value="calories">Lowest calories</option></select></label>
            <button className={`favourite-filter ${favouritesOnly ? 'is-active' : ''}`} type="button" onClick={() => setFavouritesOnly((value) => !value)}><Icon name="heart" size={17} /> Favourites</button>
          </div>
        </section>

        <section className="library-heading">
          <div><span className="eyebrow">Kitchen collection</span><h2>{filtered.length === recipes.length ? 'All recipes' : `${filtered.length} matching recipes`}</h2></div>
          <button className="button button-primary mobile-add" type="button" onClick={() => setEditing(false)}><Icon name="plus" size={17} /> Add</button>
        </section>

        {loading ? <div className="loading-state panel"><span className="spinner" /><p>Opening your recipe book…</p></div> : null}
        {error ? <div className="error-state panel"><Icon name="info" size={26} /><div><strong>Could not load the recipe file</strong><p>{error}</p><button className="button button-secondary" type="button" onClick={refresh}>Try again</button></div></div> : null}
        {!loading && !error ? <RecipeGrid recipes={filtered} onOpen={setSelected} onFavourite={toggleFavourite} onAddToCart={addRecipeToCart} onAdd={() => setEditing(false)} /> : null}

        <footer className="app-footer">
          <span>Nutrition data integration: Finnish Institute for Health and Welfare, Fineli (CC BY 4.0).</span>
          <span>Local-first · Shared grocery cart · Designed for the kitchen tablet</span>
        </footer>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Header view={view} onChangeView={(next) => { setView(next); setSelected(null); }} onAdd={() => setEditing(false)} cartCount={shoppingCart.cart.items.length} />
      {renderView()}
      {selected ? <RecipeDetail recipe={selected} onClose={() => setSelected(null)} onEdit={(recipe) => setEditing(recipe)} onDelete={deleteRecipe} onFavourite={toggleFavourite} onAddToCart={addRecipeToCart} /> : null}
      {notice ? <div className="toast"><Icon name="check" size={18} /> {notice}</div> : null}
    </div>
  );
}
