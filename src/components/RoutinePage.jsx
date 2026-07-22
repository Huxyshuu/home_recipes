import React, { useMemo } from 'react';
import Icon from './Icon';
import SourceLinks from './SourceLinks';
import { quickMeals, shoppingWindows, weeklyRoutine } from '../data/mealPlan';

function MacroStrip({ totals }) {
  return (
    <div className="routine-macros">
      <span><strong>{totals.kcal}</strong><small>kcal</small></span>
      <span><strong>{totals.protein} g</strong><small>protein</small></span>
      <span><strong>{totals.carbs} g</strong><small>carbs</small></span>
      <span><strong>{totals.fat} g</strong><small>fat</small></span>
      <span><strong>{totals.fibre} g</strong><small>fibre</small></span>
    </div>
  );
}

export default function RoutinePage({ recipes, onOpenRecipe, onBuildCart }) {
  const recipeBySlug = useMemo(() => new Map(recipes.map((recipe) => [recipe.slug, recipe])), [recipes]);

  return (
    <main className="page guide-page routine-page">
      <section className="guide-hero routine-hero">
        <div>
          <span className="eyebrow">Simple weekly system</span>
          <h1>Your seven-day routine</h1>
          <p>Four main eating moments plus one training snack. Repeat the same dependable foods, shop twice, and avoid deciding from scratch every day.</p>
        </div>
        <div className="guide-target-card">
          <span>Starting target</span>
          <strong>180–190 g protein</strong>
          <small>About 2,290–2,410 kcal per day</small>
        </div>
      </section>

      <section className="routine-advice panel">
        <Icon name="info" size={22} />
        <div>
          <strong>How to use it</strong>
          <p>Place the whey + banana before or after lifting. On a non-training day, it is the easiest item to remove when appetite is low. The daily totals are planning estimates rather than a medical prescription.</p>
        </div>
      </section>

      <section className="shopping-window-grid">
        {Object.values(shoppingWindows).map((windowConfig) => (
          <article className="panel shopping-window-card" key={windowConfig.id}>
            <span className="shopping-window-icon"><Icon name="cart" size={23} /></span>
            <div>
              <span className="eyebrow">Two-shop rhythm</span>
              <h2>{windowConfig.title}</h2>
              <p>{windowConfig.subtitle}</p>
            </div>
            <button className="button button-primary" type="button" onClick={() => onBuildCart(windowConfig.id)}>
              <Icon name="cart" size={17} /> Create this cart
            </button>
          </article>
        ))}
      </section>

      <section className="weekly-days">
        {weeklyRoutine.map((day) => (
          <article className="panel routine-day" key={day.day}>
            <header className="routine-day-header">
              <div className="day-badge"><span>Day</span><strong>{day.day}</strong></div>
              <div><span className="eyebrow">{day.weekday}</span><h2>{day.meals[0].recipeSlug ? recipeBySlug.get(day.meals[0].recipeSlug)?.title : 'Weekly plan'}</h2></div>
            </header>
            <div className="routine-meal-list">
              {day.meals.map((meal) => {
                const recipe = meal.recipeSlug ? recipeBySlug.get(meal.recipeSlug) : null;
                const quickMeal = meal.quickMealId ? quickMeals[meal.quickMealId] : null;
                const title = recipe?.title || quickMeal?.title || 'Meal';
                return (
                  <button
                    className={`routine-meal ${recipe ? 'is-link' : ''}`}
                    key={`${day.day}-${meal.slot}`}
                    type="button"
                    onClick={() => recipe && onOpenRecipe(recipe)}
                    disabled={!recipe}
                  >
                    <span>{meal.slot}</span>
                    <strong>{title}</strong>
                    {quickMeal ? <small>{quickMeal.note}</small> : <small>Open the full recipe and cooking steps</small>}
                    {recipe ? <Icon name="chevron" size={17} /> : null}
                  </button>
                );
              })}
            </div>
            <MacroStrip totals={day.totals} />
          </article>
        ))}
      </section>

      <section className="panel routine-summary">
        <div>
          <span className="eyebrow">Why this rotation works</span>
          <h2>Repetition without nutritional tunnel vision</h2>
        </div>
        <p>The week repeatedly uses high-protein dairy, includes fish three times, legumes several times, keeps red meat to one modest meal, and fills the rest with whole grains, potatoes, vegetables, berries and soft fats. It is intentionally plain enough to repeat and varied enough to cover the major food groups.</p>
        <SourceLinks sourceIds={['sports-position', 'nnr-2023', 'finland-adults']} />
      </section>
    </main>
  );
}
