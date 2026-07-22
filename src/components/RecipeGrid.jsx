import React from 'react';
import RecipeCard from './RecipeCard';
import Icon from './Icon';

export default function RecipeGrid({ recipes, onOpen, onFavourite, onAddToCart, onAdd }) {
  if (!recipes.length) {
    return (
      <div className="empty-state panel">
        <span className="empty-icon"><Icon name="book" size={36} /></span>
        <h2>No recipes match</h2>
        <p>Try clearing a filter, or add something dependable to your kitchen library.</p>
        <button className="button button-primary" type="button" onClick={onAdd}>
          <Icon name="plus" size={18} /> Add a recipe
        </button>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onOpen={onOpen}
          onFavourite={onFavourite}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
