function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function baseAmount(amount, unit) {
  const value = positive(amount);
  const cleanUnit = String(unit || '').toLowerCase();
  if (cleanUnit === 'kg' || cleanUnit === 'l') return value * 1000;
  if (['g', 'ml', 'pc', 'pcs', 'kpl'].includes(cleanUnit)) return value;
  return value;
}

function ingredientUsage(ingredient) {
  const unit = String(ingredient.unit || '').toLowerCase();
  if (['pc', 'pcs', 'kpl'].includes(unit)) return { amount: positive(ingredient.quantity), unit: 'pcs' };
  if (unit === 'ml' || unit === 'l') return { amount: baseAmount(ingredient.quantity, unit), unit: 'ml' };
  return { amount: positive(ingredient.grams) || baseAmount(ingredient.quantity, unit), unit: 'g' };
}

export function ingredientPrice(ingredient, scale = 1) {
  const price = ingredient?.retail?.selectedPrice;
  if (!price) return null;
  const usage = ingredientUsage(ingredient);
  const scaledAmount = usage.amount * positive(scale || 1);
  const priceUnit = String(price.priceUnit || '').toLowerCase();
  const unitPrice = positive(price.unitPriceEur);

  if (unitPrice > 0) {
    if (priceUnit === 'kg' && usage.unit === 'g') return scaledAmount / 1000 * unitPrice;
    if (priceUnit === 'l' && usage.unit === 'ml') return scaledAmount / 1000 * unitPrice;
    if (['pc', 'pcs', 'kpl'].includes(priceUnit) && usage.unit === 'pcs') return scaledAmount * unitPrice;
  }

  const packagePrice = positive(price.packagePriceEur);
  const packageSize = baseAmount(price.packageSize, price.packageUnit);
  if (packagePrice > 0 && packageSize > 0) {
    const packageUnit = String(price.packageUnit || '').toLowerCase();
    const compatible = (usage.unit === 'g' && ['g', 'kg'].includes(packageUnit))
      || (usage.unit === 'ml' && ['ml', 'l'].includes(packageUnit))
      || (usage.unit === 'pcs' && ['pc', 'pcs', 'kpl'].includes(packageUnit));
    if (compatible) return scaledAmount / packageSize * packagePrice;
  }
  return null;
}

export function recipePrice(recipe, scale = 1) {
  const ingredients = recipe?.ingredients || [];
  let total = 0;
  let priced = 0;
  const lines = ingredients.map((ingredient) => {
    const cost = ingredientPrice(ingredient, scale);
    if (cost !== null) {
      total += cost;
      priced += 1;
    }
    return { ingredient, cost };
  });
  const servings = Math.max(1, Number(recipe?.servings || 1) * Number(scale || 1));
  const complete = ingredients.length > 0 && priced === ingredients.length;
  return {
    total,
    perServing: total / servings,
    pricedIngredients: priced,
    ingredientCount: ingredients.length,
    coverage: ingredients.length ? Math.round(priced / ingredients.length * 100) : 0,
    complete,
    lines,
  };
}

export function formatEuro(value) {
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
}
