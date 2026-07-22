import React from 'react';
import Icon from './Icon';
import { nutritionCoverage, recipeNutrition, roundNutrition } from '../utils/nutrition';

export default function StatsDashboard({ recipes }) {
  const total = recipes.length;
  const categories = [...new Set(recipes.map((recipe) => recipe.category).filter(Boolean))];
  const averageTime = total
    ? Math.round(recipes.reduce((sum, recipe) => sum + Number(recipe.prepMinutes || 0) + Number(recipe.cookMinutes || 0), 0) / total)
    : 0;
  const coverage = total
    ? Math.round(recipes.reduce((sum, recipe) => sum + nutritionCoverage(recipe), 0) / total)
    : 0;
  const averageKcal = total
    ? Math.round(recipes.reduce((sum, recipe) => sum + recipeNutrition(recipe).perServing.kcal, 0) / total)
    : 0;

  const categoryCounts = categories
    .map((category) => ({ category, count: recipes.filter((recipe) => recipe.category === category).length }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...categoryCounts.map((entry) => entry.count));

  const tagCounts = {};
  recipes.forEach((recipe) => (recipe.tags || []).forEach((tag) => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }));
  const popularTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <main className="page stats-page">
      <section className="page-intro">
        <div>
          <span className="eyebrow">Your kitchen library</span>
          <h1>Recipe database at a glance</h1>
          <p>Simple indicators that become more useful as your collection grows.</p>
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric-card"><span><Icon name="book" /></span><strong>{total}</strong><small>recipes</small></div>
        <div className="metric-card"><span><Icon name="clock" /></span><strong>{averageTime}</strong><small>average minutes</small></div>
        <div className="metric-card"><span><Icon name="flame" /></span><strong>{averageKcal}</strong><small>average kcal / portion</small></div>
        <div className="metric-card"><span><Icon name="chart" /></span><strong>{coverage}%</strong><small>nutrition coverage</small></div>
      </section>

      <section className="stats-layout">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Distribution</span><h2>Recipes by category</h2></div>
          </div>
          {categoryCounts.length ? categoryCounts.map((entry) => (
            <div className="bar-row" key={entry.category}>
              <div className="bar-label"><span>{entry.category}</span><strong>{entry.count}</strong></div>
              <div className="bar-track"><span style={{ width: `${(entry.count / maxCount) * 100}%` }} /></div>
            </div>
          )) : <p className="muted">Add recipes to see category patterns.</p>}
        </div>

        <div className="panel insight-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Collection</span><h2>Popular tags</h2></div>
          </div>
          <div className="tag-cloud">
            {popularTags.length ? popularTags.map(([tag, count]) => (
              <span key={tag}>{tag}<small>{count}</small></span>
            )) : <p className="muted">Tags appear here as you use them.</p>}
          </div>
          <div className="stats-note">
            <Icon name="info" />
            <p>Calories are calculated from each ingredient’s stored per-100-gram values and divided by recipe servings.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
