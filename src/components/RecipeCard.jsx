import React from 'react';
import Icon from './Icon';
import { formatTime } from '../utils/format';
import { recipeNutrition, roundNutrition } from '../utils/nutrition';

export default function RecipeCard({ recipe, onOpen, onFavourite, onAddToCart }) {
  const totalMinutes = Number(recipe.prepMinutes || 0) + Number(recipe.cookMinutes || 0);
  const nutrition = recipeNutrition(recipe).perServing;

  return (
    <article className="recipe-card">
      <button className="recipe-card-main" type="button" onClick={() => onOpen(recipe)}>
        <div className="recipe-card-image">
          {recipe.image ? <img src={recipe.image} alt="" loading="lazy" /> : <div className="image-fallback"><Icon name="chef" size={42} /></div>}
          <span className="recipe-category">{recipe.category}</span>
        </div>
        <div className="recipe-card-body">
          <div className="recipe-card-heading">
            <div>
              <h3>{recipe.title}</h3>
              <p>{recipe.description || 'A recipe ready for your kitchen.'}</p>
            </div>
          </div>
          <div className="recipe-card-meta">
            <span><Icon name="clock" size={16} /> {formatTime(totalMinutes)}</span>
            <span><Icon name="flame" size={16} /> {roundNutrition(nutrition.kcal)} kcal</span>
            <span><Icon name="users" size={16} /> {recipe.servings}</span>
          </div>
        </div>
      </button>
      <div className="recipe-card-actions">
        <button
          className="card-cart-button"
          type="button"
          onClick={() => onAddToCart(recipe)}
          aria-label={`Add ${recipe.title} to grocery cart`}
        >
          <Icon name="cart" size={18} />
        </button>
        <button
          className={`favourite-button ${recipe.favourite ? 'is-active' : ''}`}
          type="button"
          onClick={() => onFavourite(recipe)}
          aria-label={recipe.favourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Icon name="heart" size={19} />
        </button>
      </div>
    </article>
  );
}
