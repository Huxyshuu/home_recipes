import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import CookingMode from './CookingMode';
import { formatQuantity, formatTime } from '../utils/format';
import { nutritionCoverage, recipeNutrition, roundNutrition } from '../utils/nutrition';

function progressKey(recipeId) {
  return `home-recipes-progress-${recipeId}`;
}

function readProgress(recipeId) {
  const current = localStorage.getItem(progressKey(recipeId));
  const legacy = localStorage.getItem(`reseptikoti-progress-${recipeId}`);
  return JSON.parse(current || legacy || '{}').steps || {};
}

export default function RecipeDetail({ recipe, onClose, onEdit, onDelete, onFavourite, onAddToCart }) {
  const [servings, setServings] = useState(Number(recipe.servings || 1));
  const [cooking, setCooking] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      return readProgress(recipe.id);
    } catch {
      return {};
    }
  });
  const scale = servings / Math.max(1, Number(recipe.servings || 1));
  const nutritionResult = useMemo(() => recipeNutrition(recipe), [recipe]);
  const nutrition = nutritionResult.perServing;
  const coverage = nutritionCoverage(recipe);

  useEffect(() => {
    try {
      localStorage.setItem(progressKey(recipe.id), JSON.stringify({ steps: completedSteps }));
    } catch {
      // Cooking remains usable when storage is unavailable or full.
    }
  }, [completedSteps, recipe.id]);

  function closeCooking() {
    try {
      setCompletedSteps(readProgress(recipe.id));
    } catch {
      setCompletedSteps({});
    }
    setCooking(false);
  }

  if (cooking) return <CookingMode recipe={recipe} scale={scale} onClose={closeCooking} />;

  function confirmDelete() {
    if (window.confirm(`Delete “${recipe.title}”? This cannot be undone.`)) onDelete(recipe.id);
  }

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" aria-label={recipe.title}>
      <div className="detail-shell">
        <header className="detail-topbar">
          <button className="button button-ghost" type="button" onClick={onClose}><Icon name="back" size={18} /> Back to recipes</button>
          <div className="detail-actions">
            <button className={`icon-button ${recipe.favourite ? 'is-active' : ''}`} type="button" onClick={() => onFavourite(recipe)} aria-label="Toggle favourite"><Icon name="heart" /></button>
            <button className="button button-secondary" type="button" onClick={() => onEdit(recipe)}><Icon name="edit" size={17} /> Edit</button>
            <button className="icon-button danger" type="button" onClick={confirmDelete} aria-label="Delete recipe"><Icon name="trash" /></button>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          </div>
        </header>

        <div className="detail-hero">
          <div className="detail-cover">{recipe.image ? <img src={recipe.image} alt="" /> : <div className="image-fallback"><Icon name="chef" size={56} /></div>}</div>
          <div className="detail-intro">
            <span className="eyebrow">{recipe.cuisine} · {recipe.category}</span>
            <h1>{recipe.title}</h1>
            <p>{recipe.description}</p>
            <div className="detail-meta">
              <span><Icon name="clock" /> <strong>{formatTime(Number(recipe.prepMinutes || 0) + Number(recipe.cookMinutes || 0))}</strong><small>Total time</small></span>
              <span><Icon name="chef" /> <strong>{recipe.difficulty}</strong><small>Difficulty</small></span>
              <span><Icon name="flame" /> <strong>{roundNutrition(nutrition.kcal)} kcal</strong><small>{nutritionResult.source === 'planned' ? 'Plan estimate' : 'Per portion'}</small></span>
            </div>
            <div className="detail-tags">{(recipe.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="detail-primary-actions">
              <button className="button button-primary cook-button" type="button" onClick={() => setCooking(true)}><Icon name="chef" size={20} /> Start cooking mode</button>
              <button className="button button-secondary" type="button" onClick={() => onAddToCart(recipe, scale)}><Icon name="cart" size={19} /> Add {servings} portion{servings === 1 ? '' : 's'} to cart</button>
            </div>
          </div>
        </div>

        <div className="detail-content">
          <section className="ingredients-panel panel">
            <div className="panel-heading servings-heading">
              <div><span className="eyebrow">Mise en place</span><h2>Ingredients</h2></div>
              <div className="servings-control"><button type="button" onClick={() => setServings(Math.max(1, servings - 1))}>−</button><span><strong>{servings}</strong><small>portions</small></span><button type="button" onClick={() => setServings(servings + 1)}>+</button></div>
            </div>
            <div className="ingredient-checklist">
              {(recipe.ingredients || []).map((ingredient) => (
                <button className={checkedIngredients[ingredient.id] ? 'is-checked' : ''} key={ingredient.id} type="button" onClick={() => setCheckedIngredients((current) => ({ ...current, [ingredient.id]: !current[ingredient.id] }))}>
                  <span className="check-box"><Icon name="check" size={15} /></span>
                  <strong>{formatQuantity(Number(ingredient.quantity || 0) * scale)} {ingredient.unit}</strong>
                  <span>{ingredient.name}{ingredient.note ? <small>{ingredient.note}</small> : null}</span>
                </button>
              ))}
            </div>
          </section>

          <aside className="nutrition-panel panel">
            <div className="panel-heading"><div><span className="eyebrow">{nutritionResult.source === 'planned' ? 'Weekly-plan estimate' : 'Estimated'}</span><h2>Per portion</h2></div></div>
            <div className="calorie-ring"><strong>{roundNutrition(nutrition.kcal)}</strong><span>kcal</span></div>
            <div className="macro-list">
              <div><span>Protein</span><strong>{roundNutrition(nutrition.protein, 1)} g</strong></div>
              <div><span>Carbohydrate</span><strong>{roundNutrition(nutrition.carbs, 1)} g</strong></div>
              <div><span>Fat</span><strong>{roundNutrition(nutrition.fat, 1)} g</strong></div>
              <div><span>Fibre</span><strong>{roundNutrition(nutrition.fibre, 1)} g</strong></div>
            </div>
            <div className="coverage-note"><span style={{ width: `${coverage}%` }} /><small>{coverage}% of ingredients have stored calorie data</small></div>
            {nutritionResult.source === 'planned' ? (
              <p className="source-note">The displayed macros are the fixed research-plan estimate supplied with this weekly favourite. Package brands and the ingredient snapshot can differ; edit the recipe to switch back to ingredient-based calculation.</p>
            ) : <p className="source-note">Calculated from stored per-100-g ingredient values. Fineli-linked data remains editable.</p>}
          </aside>

          <section className="method-panel panel">
            <div className="panel-heading"><div><span className="eyebrow">Method</span><h2>Cook step by step</h2></div><button className="text-button" type="button" onClick={() => setCompletedSteps({})}>Reset checks</button></div>
            <div className="method-list">
              {(recipe.steps || []).map((step, index) => (
                <button className={completedSteps[step.id] ? 'is-complete' : ''} key={step.id} type="button" onClick={() => setCompletedSteps((current) => ({ ...current, [step.id]: !current[step.id] }))}>
                  <span className="method-number">{completedSteps[step.id] ? <Icon name="check" /> : index + 1}</span>
                  <span><strong>{step.title}</strong><p>{step.text}</p>{step.timerMinutes ? <small><Icon name="clock" size={14} /> {step.timerMinutes} min timer</small> : null}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {(recipe.notes || recipe.sourceUrl) ? <section className="recipe-notes panel"><div><span className="eyebrow">Finishing details</span><h2>Source, substitutions and notes</h2></div>{recipe.notes ? <p>{recipe.notes}</p> : null}{recipe.sourceUrl ? <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">Recipe or reference source <Icon name="external" size={16} /></a> : null}</section> : null}
      </div>
    </div>
  );
}
