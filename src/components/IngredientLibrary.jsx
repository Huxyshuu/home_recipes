import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import Icon from './Icon';
import NutritionSearch from './NutritionSearch';

const categories = [
  'Hedelmät ja vihannekset',
  'Liha ja kala',
  'Kasviproteiinit',
  'Maitotuotteet ja kylmätuotteet',
  'Pakasteet',
  'Leivät',
  'Viljat ja kuiva-aineet',
  'Pähkinät ja siemenet',
  'Kuivakaappi',
  'Muut',
];

function emptyIngredient() {
  return {
    name: '',
    nameEn: '',
    shoppingCategory: 'Muut',
    shoppingCategoryEn: '',
    fineliQuery: '',
    fineliPreferredTerms: [],
    fineliFoodId: null,
    fineliFoodName: '',
    fineliMeasures: [],
    nutritionSource: null,
    retail: { sKaupatUrl: '', kRuokaUrl: '', selectedPrice: null },
    nutritionPer100g: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
    usedInRecipes: [],
    usageCount: 0,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fineliStatus(ingredient) {
  if (ingredient.nutritionSource?.status === 'verified-api') return 'Fineli verified';
  if (ingredient.fineliFoodName) return 'Fineli linked';
  return 'Needs Fineli review';
}

export default function IngredientLibrary({ onIngredientsUpdated }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [preferredTerms, setPreferredTerms] = useState('');
  const [saving, setSaving] = useState(false);
  const [showFineli, setShowFineli] = useState(false);
  const [notice, setNotice] = useState('');

  async function refresh(selectId = selectedId) {
    setLoading(true);
    setError('');
    try {
      const result = await api.listIngredients();
      setIngredients(result);
      if (selectId) {
        const selected = result.find((item) => item.id === selectId);
        if (selected) openIngredient(selected);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(null);
    // The first load intentionally runs only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fi-FI');
    if (!needle) return ingredients;
    return ingredients.filter((ingredient) => [
      ingredient.name,
      ingredient.nameEn,
      ingredient.shoppingCategory,
      ingredient.fineliFoodName,
      ...(ingredient.usedInRecipes || []).map((recipe) => recipe.title),
    ].join(' ').toLocaleLowerCase('fi-FI').includes(needle));
  }, [ingredients, search]);

  const stats = useMemo(() => ({
    total: ingredients.length,
    shared: ingredients.filter((ingredient) => ingredient.usageCount > 1).length,
    verified: ingredients.filter((ingredient) => ingredient.nutritionSource?.status === 'verified-api').length,
    priced: ingredients.filter((ingredient) => ingredient.retail?.selectedPrice).length,
  }), [ingredients]);

  function openIngredient(ingredient) {
    setSelectedId(ingredient.id || null);
    setDraft(clone(ingredient));
    setPreferredTerms((ingredient.fineliPreferredTerms || []).join(', '));
    setShowFineli(false);
    setError('');
  }

  function createNew() {
    setSelectedId(null);
    setDraft(emptyIngredient());
    setPreferredTerms('');
    setShowFineli(false);
    setError('');
  }

  function patch(fields) {
    setDraft((current) => ({ ...current, ...fields }));
  }

  function patchRetail(fields) {
    setDraft((current) => ({
      ...current,
      retail: { ...(current.retail || {}), ...fields },
    }));
  }

  function patchSelectedPrice(fields) {
    setDraft((current) => ({
      ...current,
      retail: {
        ...(current.retail || {}),
        selectedPrice: { ...(current.retail?.selectedPrice || {}), ...fields },
      },
    }));
  }

  function patchNutrition(key, value) {
    setDraft((current) => ({
      ...current,
      nutritionPer100g: { ...(current.nutritionPer100g || {}), [key]: Number(value) || 0 },
    }));
  }

  async function saveIngredient(event) {
    event.preventDefault();
    if (!draft?.name?.trim()) {
      setError('Give the ingredient a Finnish name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...draft,
        fineliQuery: draft.fineliQuery?.trim() || draft.name.trim(),
        fineliPreferredTerms: preferredTerms.split(',').map((term) => term.trim()).filter(Boolean),
      };
      const saved = selectedId
        ? await api.updateIngredient(selectedId, payload)
        : await api.createIngredient(payload);
      setNotice('Ingredient saved. Every linked recipe now uses this information.');
      window.setTimeout(() => setNotice(''), 3500);
      await refresh(saved.id);
      await onIngredientsUpdated?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page ingredient-library-page">
      <section className="ingredient-library-hero">
        <div>
          <span className="eyebrow">One source of truth</span>
          <h1>Ingredient library</h1>
          <p>Edit nutrition, Fineli links, shop links or prices here once. Every recipe linked to that ingredient receives the update automatically while keeping its own quantity and preparation note.</p>
        </div>
        <div className="ingredient-library-stats">
          <div><strong>{stats.total}</strong><span>Unique ingredients</span></div>
          <div><strong>{stats.shared}</strong><span>Used in 2+ recipes</span></div>
          <div><strong>{stats.verified}</strong><span>Fineli verified</span></div>
          <div><strong>{stats.priced}</strong><span>With a saved price</span></div>
        </div>
      </section>

      <section className="ingredient-library-toolbar panel">
        <label className="ingredient-library-search">
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ingredient, category, Fineli name or recipe…" />
        </label>
        <button className="button button-primary" type="button" onClick={createNew}><Icon name="plus" size={17} /> Add ingredient</button>
      </section>

      {error && !draft ? <p className="form-error">{error}</p> : null}
      {loading ? <div className="loading-state panel"><span className="spinner" /><p>Opening the ingredient library…</p></div> : null}

      {!loading ? <section className={`ingredient-library-layout ${draft ? 'has-editor' : ''}`}>
        <div className="ingredient-master-list panel">
          <div className="ingredient-master-list-heading">
            <div><span className="eyebrow">Shared records</span><h2>{filtered.length} ingredients</h2></div>
            <small>The recipe amount is not stored here.</small>
          </div>
          <div className="ingredient-master-scroll">
            {filtered.map((ingredient) => (
              <button className={`ingredient-master-row ${selectedId === ingredient.id ? 'is-active' : ''}`} type="button" key={ingredient.id} onClick={() => openIngredient(ingredient)}>
                <span className="ingredient-master-main">
                  <strong>{ingredient.name}</strong>
                  <small>{[ingredient.nameEn, ingredient.shoppingCategory].filter(Boolean).join(' · ')}</small>
                  <span className="ingredient-master-badges">
                    <em className={ingredient.nutritionSource?.status === 'verified-api' ? 'is-good' : ''}>{fineliStatus(ingredient)}</em>
                    {ingredient.retail?.selectedPrice ? <em className="is-good">Price saved</em> : <em>No price</em>}
                  </span>
                </span>
                <span className="ingredient-master-usage"><strong>{ingredient.usageCount || 0}</strong><small>recipes</small><Icon name="chevron" size={16} /></span>
              </button>
            ))}
            {!filtered.length ? <div className="ingredient-master-empty"><Icon name="search" size={28} /><p>No ingredients match that search.</p></div> : null}
          </div>
        </div>

        {draft ? <form className="ingredient-master-editor panel" onSubmit={saveIngredient}>
          <div className="ingredient-master-editor-heading">
            <div><span className="eyebrow">{selectedId ? 'Update shared ingredient' : 'Create shared ingredient'}</span><h2>{draft.name || 'New ingredient'}</h2></div>
            <button className="icon-button" type="button" onClick={() => { setDraft(null); setSelectedId(null); }} aria-label="Close ingredient editor"><Icon name="close" size={18} /></button>
          </div>

          <div className="shared-data-callout">
            <Icon name="refresh" size={19} />
            <p><strong>Global update:</strong> these fields are shared. Recipe-specific quantity, unit, gram weight and preparation notes remain unchanged.</p>
          </div>

          <div className="form-grid two-columns">
            <label className="field"><span>Finnish name</span><input value={draft.name || ''} onChange={(event) => patch({ name: event.target.value })} placeholder="Kaurahiutale" /></label>
            <label className="field"><span>English name</span><input value={draft.nameEn || ''} onChange={(event) => patch({ nameEn: event.target.value })} placeholder="Rolled oats" /></label>
            <label className="field"><span>Grocery category</span><select value={draft.shoppingCategory || 'Muut'} onChange={(event) => patch({ shoppingCategory: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="field"><span>Fineli query</span><input value={draft.fineliQuery || ''} onChange={(event) => patch({ fineliQuery: event.target.value })} placeholder="kaurahiutale" /></label>
            <label className="field full"><span>Preferred Fineli terms, separated by commas</span><input value={preferredTerms} onChange={(event) => setPreferredTerms(event.target.value)} placeholder="kaura, hiutale" /></label>
          </div>

          <div className="ingredient-fineli-actions">
            <div>
              <strong>{draft.fineliFoodName || 'No Fineli food selected'}</strong>
              <small>{draft.nutritionSource?.status === 'verified-api' ? `Verified ${draft.nutritionSource.syncedAt || ''}` : 'Search by the Finnish ingredient name and review the selected food.'}</small>
            </div>
            <button className="button button-soft" type="button" onClick={() => setShowFineli((value) => !value)}><Icon name="search" size={17} /> {showFineli ? 'Close Fineli' : 'Choose from Fineli'}</button>
          </div>

          {showFineli ? <NutritionSearch ingredientName={draft.fineliQuery || draft.name} onClose={() => setShowFineli(false)} onSelect={(selection) => patch({
            ...selection,
            nutritionSource: {
              provider: 'THL Fineli API',
              status: 'verified-api',
              syncedAt: new Date().toISOString(),
              matchMethod: 'manual-selection',
            },
          })} /> : null}

          <details className="ingredient-master-section" open>
            <summary>Retail links and shared price</summary>
            <div className="retail-link-fields">
              <label className="field"><span>S-kaupat URL</span><input type="url" value={draft.retail?.sKaupatUrl || ''} onChange={(event) => patchRetail({ sKaupatUrl: event.target.value })} placeholder="https://www.s-kaupat.fi/…" /></label>
              <label className="field"><span>K-Ruoka URL</span><input type="url" value={draft.retail?.kRuokaUrl || ''} onChange={(event) => patchRetail({ kRuokaUrl: event.target.value })} placeholder="https://www.k-ruoka.fi/…" /></label>
            </div>
            <div className="retail-price-fields">
              <label className="field"><span>Retailer</span><input value={draft.retail?.selectedPrice?.retailer || ''} onChange={(event) => patchSelectedPrice({ retailer: event.target.value })} placeholder="S-kaupat" /></label>
              <label className="field"><span>Product name</span><input value={draft.retail?.selectedPrice?.productName || ''} onChange={(event) => patchSelectedPrice({ productName: event.target.value })} /></label>
              <label className="field"><span>Direct price URL</span><input type="url" value={draft.retail?.selectedPrice?.sourceUrl || ''} onChange={(event) => patchSelectedPrice({ sourceUrl: event.target.value })} /></label>
              <label className="field price-small"><span>Unit price €</span><input type="number" min="0" step="0.01" value={draft.retail?.selectedPrice?.unitPriceEur || ''} onChange={(event) => patchSelectedPrice({ unitPriceEur: Number(event.target.value) })} /></label>
              <label className="field price-small"><span>Price per</span><select value={draft.retail?.selectedPrice?.priceUnit || 'kg'} onChange={(event) => patchSelectedPrice({ priceUnit: event.target.value })}><option value="kg">kg</option><option value="l">l</option><option value="pcs">piece</option></select></label>
              <label className="field price-small"><span>Package €</span><input type="number" min="0" step="0.01" value={draft.retail?.selectedPrice?.packagePriceEur || ''} onChange={(event) => patchSelectedPrice({ packagePriceEur: Number(event.target.value) })} /></label>
              <label className="field price-small"><span>Package size</span><input type="number" min="0" step="0.1" value={draft.retail?.selectedPrice?.packageSize || ''} onChange={(event) => patchSelectedPrice({ packageSize: Number(event.target.value) })} /></label>
              <label className="field price-small"><span>Unit</span><select value={draft.retail?.selectedPrice?.packageUnit || 'g'} onChange={(event) => patchSelectedPrice({ packageUnit: event.target.value })}><option>g</option><option>kg</option><option>ml</option><option>l</option><option value="pcs">pcs</option></select></label>
              <label className="field"><span>Store</span><input value={draft.retail?.selectedPrice?.store || ''} onChange={(event) => patchSelectedPrice({ store: event.target.value })} placeholder="Prisma or K-Citymarket" /></label>
              <label className="field"><span>Checked date</span><input type="date" value={draft.retail?.selectedPrice?.observedAt || ''} onChange={(event) => patchSelectedPrice({ observedAt: event.target.value })} /></label>
            </div>
          </details>

          <details className="ingredient-master-section">
            <summary>Nutrition per 100 g</summary>
            <div className="macro-inputs">
              {['kcal', 'protein', 'carbs', 'fat', 'fibre'].map((key) => <label key={key}><span>{key}</span><input type="number" step="0.1" value={draft.nutritionPer100g?.[key] || 0} onChange={(event) => patchNutrition(key, event.target.value)} /></label>)}
            </div>
          </details>

          {selectedId ? <div className="ingredient-used-in">
            <strong>Used in {draft.usageCount || 0} recipe{draft.usageCount === 1 ? '' : 's'}</strong>
            <div>{(draft.usedInRecipes || []).map((recipe) => <span key={recipe.id}>{recipe.title}</span>)}</div>
          </div> : null}

          {error ? <p className="form-error">{error}</p> : null}
          <div className="ingredient-master-actions">
            <button className="button button-secondary" type="button" onClick={() => { setDraft(null); setSelectedId(null); }}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save shared ingredient'}</button>
          </div>
        </form> : <div className="ingredient-library-placeholder panel">
          <Icon name="guide" size={38} />
          <h2>Select an ingredient</h2>
          <p>Open a shared record to update it once for every recipe. The list also shows exactly which recipes use it.</p>
        </div>}
      </section> : null}

      {notice ? <div className="toast"><Icon name="check" size={18} /> {notice}</div> : null}
    </main>
  );
}
