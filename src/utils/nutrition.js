const emptyNutrition = () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });

function computedRecipeNutrition(recipe) {
  const total = (recipe.ingredients || []).reduce((sum, ingredient) => {
    const factor = Number(ingredient.grams || 0) / 100;
    const nutrition = ingredient.nutritionPer100g || {};
    sum.kcal += Number(nutrition.kcal || 0) * factor;
    sum.protein += Number(nutrition.protein || 0) * factor;
    sum.carbs += Number(nutrition.carbs || 0) * factor;
    sum.fat += Number(nutrition.fat || 0) * factor;
    sum.fibre += Number(nutrition.fibre || 0) * factor;
    return sum;
  }, emptyNutrition());

  const servings = Math.max(1, Number(recipe.servings || 1));
  const perServing = Object.keys(total).reduce((result, key) => {
    result[key] = total[key] / servings;
    return result;
  }, {});
  return { total, perServing };
}

export function recipeNutrition(recipe) {
  const computed = computedRecipeNutrition(recipe);
  const planned = recipe.plannedNutritionPerServing;
  if (!planned || recipe.useIngredientNutrition === true) {
    return { ...computed, computed, source: 'ingredients' };
  }

  const perServing = {
    kcal: Number(planned.kcal || 0),
    protein: Number(planned.protein ?? planned.protein_g ?? 0),
    carbs: Number(planned.carbs ?? planned.carbs_g ?? 0),
    fat: Number(planned.fat ?? planned.fat_g ?? 0),
    fibre: Number(planned.fibre ?? planned.fiber ?? planned.fiber_g ?? 0),
  };
  const servings = Math.max(1, Number(recipe.servings || 1));
  const total = Object.keys(perServing).reduce((result, key) => {
    result[key] = perServing[key] * servings;
    return result;
  }, {});
  return { total, perServing, computed, source: 'planned' };
}

export function roundNutrition(value, digits = 0) {
  const number = Number(value || 0);
  const multiplier = 10 ** digits;
  return Math.round(number * multiplier) / multiplier;
}

export function nutritionCoverage(recipe) {
  const ingredients = recipe.ingredients || [];
  if (!ingredients.length) return 0;
  const covered = ingredients.filter((ingredient) => Number(ingredient.nutritionPer100g?.kcal || 0) > 0).length;
  return Math.round((covered / ingredients.length) * 100);
}
