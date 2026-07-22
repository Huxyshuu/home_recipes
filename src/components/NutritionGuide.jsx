import React, { useState } from 'react';
import Icon from './Icon';
import SourceLinks from './SourceLinks';
import { api } from '../api/client';
import { nutritionGuide, researchSources } from '../data/mealPlan';

export default function NutritionGuide({ onRecipesUpdated }) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState('');

  async function syncFineli(forceRefresh = false) {
    setSyncing(true);
    setSyncError('');
    try {
      const result = await api.syncRecipeNutrition({ forceRefresh });
      setSyncResult(result);
      await onRecipesUpdated?.();
    } catch (error) {
      setSyncError(error.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <main className="page guide-page">
      <section className="guide-hero">
        <div>
          <span className="eyebrow">Remember the reason</span>
          <h1>Nutrition guide</h1>
          <p>A compact explanation of what the routine is trying to achieve for a 93 kg lifter aiming to move gradually toward 80–85 kg while protecting training and muscle.</p>
        </div>
        <div className="guide-target-card">
          <span>Priority order</span>
          <strong>Consistency → protein → food quality</strong>
          <small>Then adjust total food using your trend and recovery</small>
        </div>
      </section>

      <section className="fineli-sync-panel panel">
        <div className="fineli-sync-copy">
          <span className="eyebrow">THL Fineli open data</span>
          <h2>Update all 14 recipes from the live Finnish food database</h2>
          <p>The Finnish ingredient names are already prepared for matching. This replaces legacy per-100-g estimates with values returned by the Fineli API and switches fully matched recipes to ingredient-based nutrition.</p>
          <small>Internet is required. Ambiguous or missing foods are left unchanged and listed for review instead of being guessed.</small>
        </div>
        <div className="fineli-sync-actions">
          <button className="button button-primary" type="button" onClick={() => syncFineli(false)} disabled={syncing}><Icon name="refresh" size={18} /> {syncing ? 'Synchronising…' : 'Sync Fineli data'}</button>
          <button className="button button-secondary" type="button" onClick={() => syncFineli(true)} disabled={syncing}>Force fresh API data</button>
        </div>
        {syncResult ? <div className={`sync-result ${syncResult.unresolvedUniqueIngredients ? 'has-warning' : 'is-success'}`}>
          <Icon name={syncResult.unresolvedUniqueIngredients ? 'info' : 'check'} size={19} />
          <div><strong>{syncResult.resolvedUniqueIngredients}/{syncResult.uniqueIngredients} unique ingredients matched</strong><p>{syncResult.updatedIngredientOccurrences} recipe ingredient entries updated. {syncResult.unresolvedUniqueIngredients ? `${syncResult.unresolvedUniqueIngredients} need manual review.` : 'All recipes now use Fineli ingredient values.'}</p>{syncResult.unresolved?.length ? <details><summary>Show unresolved ingredients</summary><ul>{syncResult.unresolved.map((entry) => <li key={`${entry.name}-${entry.query}`}><strong>{entry.name}</strong>: {entry.reason}</li>)}</ul></details> : null}</div>
        </div> : null}
        {syncError ? <p className="form-error">{syncError}</p> : null}
      </section>

      <section className="guide-disclaimer panel">
        <Icon name="info" size={23} />
        <p>This is general meal-planning guidance, not diagnosis or an individually calculated medical diet. Health conditions, medication, allergies, kidney disease, diabetes, gastrointestinal problems or a history of disordered eating should be discussed with a qualified healthcare professional or registered dietitian.</p>
      </section>

      <section className="guide-card-grid">
        {nutritionGuide.map((entry, index) => (
          <details className="panel guide-card" key={entry.id} open={index < 2}>
            <summary>
              <span className="guide-card-icon"><Icon name={entry.id === 'protein' ? 'strength' : entry.id === 'limit' ? 'shield' : 'guide'} size={22} /></span>
              <span><small>{entry.target}</small><strong>{entry.title}</strong></span>
              <Icon name="chevron" size={18} />
            </summary>
            <div className="guide-card-body">
              <p>{entry.body}</p>
              <ul>{entry.actions.map((action) => <li key={action}>{action}</li>)}</ul>
              <SourceLinks sourceIds={entry.sourceIds} compact />
            </div>
          </details>
        ))}
      </section>

      <section className="panel source-library">
        <div className="panel-heading"><div><span className="eyebrow">Verify it yourself</span><h2>Source library</h2></div></div>
        <div className="source-library-list">
          {researchSources.map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              <span><strong>{source.label}</strong><small>{source.note}</small></span>
              <Icon name="external" size={17} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
