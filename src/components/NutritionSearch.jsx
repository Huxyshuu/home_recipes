import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import Icon from './Icon';

function sourceLabel(source, stale) {
  if (source === 'fineli') return 'Fresh from Fineli';
  if (source === 'cache' && stale) return 'Saved cache (Fineli unavailable)';
  if (source === 'cache') return 'Saved search result';
  return '';
}

export default function NutritionSearch({ ingredientName, onSelect, onClose }) {
  const [query, setQuery] = useState(ingredientName || '');
  const [results, setResults] = useState([]);
  const [cachedFoods, setCachedFoods] = useState([]);
  const [cacheStats, setCacheStats] = useState(null);
  const [searchMeta, setSearchMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.listNutritionCache()
      .then((payload) => {
        if (!active) return;
        setCachedFoods(payload.results || []);
        setCacheStats(payload.stats || null);
      })
      .catch((requestError) => {
        if (active) setError(`Could not read the local Fineli cache: ${requestError.message}`);
      })
      .finally(() => {
        if (active) setCacheLoading(false);
      });
    return () => { active = false; };
  }, []);

  const matchingCachedFoods = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fi-FI');
    if (!needle) return cachedFoods;
    return cachedFoods.filter((food) => [food.name, food.type].join(' ').toLocaleLowerCase('fi-FI').includes(needle));
  }, [cachedFoods, query]);

  async function search({ refresh = false } = {}) {
    const cleaned = query.trim();
    if (cleaned.length < 2) {
      setError('Type at least two characters to search Fineli.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = await api.searchNutrition(cleaned, { refresh });
      setResults(payload.results || []);
      setSearchMeta(payload);
      if (payload.warning) setError(`Fineli could not be reached, so saved results are shown. ${payload.warning}`);
    } catch (requestError) {
      setResults([]);
      setSearchMeta(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    search();
  }

  async function selectFood(result) {
    setLoading(true);
    setError('');
    try {
      const food = result.nutritionPer100g ? result : await api.getNutritionFood(result.id);
      onSelect({
        fineliFoodId: food.id ?? result.id,
        fineliFoodName: food.name || result.name,
        fineliMeasures: food.measures || [],
        nutritionPer100g: food.nutritionPer100g,
      });
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function renderResult(result, origin) {
    return (
      <button key={`${origin}-${result.id}`} type="button" onClick={() => selectFood(result)} disabled={loading}>
        <span>
          <strong>{result.name}</strong>
          <small>{[
            result.type,
            result.nutritionPer100g ? `${result.nutritionPer100g.kcal} kcal/100 g` : null,
            origin === 'cache' ? 'Available offline' : 'Fineli result',
          ].filter(Boolean).join(' · ')}</small>
        </span>
        <Icon name="plus" size={17} />
      </button>
    );
  }

  return (
    <div className="nutrition-search" role="search" aria-label="Search Fineli nutrition data">
      <div className="nutrition-search-heading">
        <div>
          <strong>Find in Fineli</strong>
          <small>Finnish food composition data from THL, saved locally after use</small>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close nutrition search">
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="nutrition-search-form">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. lohi, peruna, maito"
          aria-label="Fineli search term"
        />
        <button className="button button-secondary" type="button" onClick={() => search()} disabled={loading}>
          <Icon name="search" size={17} /> {loading ? 'Searching…' : 'Search Fineli'}
        </button>
      </div>

      <div className="nutrition-cache-summary">
        <Icon name="book" size={16} />
        <span>{cacheLoading ? 'Opening local cache…' : `${cacheStats?.foods || cachedFoods.length} ingredient${(cacheStats?.foods || cachedFoods.length) === 1 ? '' : 's'} saved locally`}</span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="nutrition-result-columns">
        <section className="nutrition-result-group">
          <div className="nutrition-result-heading">
            <strong>Saved ingredients</strong>
            <small>Instant and available without Internet</small>
          </div>
          <div className="nutrition-results nutrition-cache-results">
            {matchingCachedFoods.map((result) => renderResult(result, 'cache'))}
            {!cacheLoading && !matchingCachedFoods.length ? <p className="muted compact">No cached ingredients match this name yet.</p> : null}
          </div>
        </section>

        <section className="nutrition-result-group">
          <div className="nutrition-result-heading">
            <strong>Search results</strong>
            <small>{searchMeta ? sourceLabel(searchMeta.source, searchMeta.stale) : 'Search the full Fineli database'}</small>
          </div>
          <div className="nutrition-results">
            {results.map((result) => renderResult(result, 'search'))}
            {!loading && searchMeta && !results.length ? <p className="muted compact">No Fineli foods matched that search.</p> : null}
            {!searchMeta && !loading ? <p className="muted compact">Press Search Fineli to load matching foods. Enter does not submit the recipe form.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
