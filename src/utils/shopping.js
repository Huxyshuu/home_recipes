import { quickMeals, shoppingWindows, weeklyRoutine } from '../data/mealPlan.js';

export const shoppingCategoryOrder = [
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

const nameAliases = {
  kananmuna: 'Kananmuna',
  kananmunat: 'Kananmuna',
  banaani: 'Banaani, kuorittu',
  banaanit: 'Banaani, kuorittu',
  herne: 'Herne, pakaste',
  herneet: 'Herne, pakaste',
  'herne, pakaste': 'Herne, pakaste',
  skyr: 'Skyr, maustamaton',
  'skyr, maustamaton': 'Skyr, maustamaton',
  kaurahiutale: 'Kaurahiutale',
  kaurahiutaleet: 'Kaurahiutale',
  'maitorahka, rasvaton': 'Maitorahka, rasvaton',
  'raejuusto, vähärasvainen': 'Raejuusto, vähärasvainen',
  'kreikkalainen jogurtti, vähärasvainen': 'Kreikkalainen jogurtti, vähärasvainen',
  'täysjyväpasta, kuiva': 'Täysjyväpasta, kuiva',
  'riisi, pitkäjyväinen, raaka': 'Riisi, pitkäjyväinen, raaka',
};

export function normaliseUnit(unit) {
  const value = String(unit || 'g').trim().toLowerCase();
  if (['pc', 'pcs', 'piece', 'pieces', 'kpl'].includes(value)) return 'kpl';
  if (['slice', 'slices'].includes(value)) return 'slices';
  if (['tablespoon', 'tablespoons'].includes(value)) return 'tbsp';
  if (['teaspoon', 'teaspoons'].includes(value)) return 'tsp';
  return value || 'g';
}

export function canonicalShoppingName(name) {
  const key = String(name || '').trim().toLowerCase();
  return nameAliases[key] || String(name || '').trim();
}

export function formatCartQuantity(quantity) {
  const value = Number(quantity || 0);
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

export function mergeShoppingItems(items) {
  const merged = new Map();
  items.forEach((item) => {
    const name = canonicalShoppingName(item.name);
    const unit = normaliseUnit(item.unit);
    const key = `${name.toLowerCase()}::${unit}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += Number(item.quantity || 0);
      existing.sources = [...new Set([...(existing.sources || []), ...(item.sources || [])])];
      existing.retail = existing.retail || item.retail || null;
      return;
    }
    merged.set(key, {
      id: item.id || `cart-${Date.now()}-${Math.random()}`,
      name,
      quantity: Number(item.quantity || 0),
      unit,
      category: item.category || item.shoppingCategory || 'Muut',
      checked: Boolean(item.checked),
      sources: [...new Set(item.sources || [])],
      retail: item.retail || null,
    });
  });
  return [...merged.values()].sort((a, b) => {
    const categoryDifference = shoppingCategoryOrder.indexOf(a.category) - shoppingCategoryOrder.indexOf(b.category);
    if (categoryDifference !== 0) return categoryDifference;
    return a.name.localeCompare(b.name);
  });
}

export function recipeShoppingItems(recipe, multiplier = 1, source = '') {
  return (recipe.ingredients || []).map((ingredient) => ({
    name: ingredient.name,
    quantity: Number(ingredient.quantity || 0) * multiplier,
    unit: ingredient.unit,
    category: ingredient.shoppingCategory || 'Muut',
    retail: ingredient.retail || null,
    checked: false,
    sources: source ? [source] : [recipe.title],
  }));
}

export function buildShoppingWindowItems(recipes, windowId) {
  const windowConfig = shoppingWindows[windowId];
  if (!windowConfig) return [];
  const recipeBySlug = new Map(recipes.map((recipe) => [recipe.slug, recipe]));
  const items = [];

  windowConfig.selections.forEach((selection) => {
    const day = weeklyRoutine.find((entry) => entry.day === selection.day);
    if (!day) return;
    day.meals.filter((meal) => selection.slots.includes(meal.slot)).forEach((meal) => {
      if (meal.recipeSlug) {
        const recipe = recipeBySlug.get(meal.recipeSlug);
        if (recipe) items.push(...recipeShoppingItems(recipe, 1, `${day.weekday}: ${recipe.title}`));
        return;
      }
      const quickMeal = quickMeals[meal.quickMealId];
      if (!quickMeal) return;
      quickMeal.ingredients.forEach((ingredient) => items.push({
        name: ingredient.name,
        quantity: Number(ingredient.quantity || 0),
        unit: ingredient.unit,
        category: ingredient.shoppingCategory || 'Muut',
    retail: ingredient.retail || null,
        checked: false,
        sources: [`${day.weekday}: ${quickMeal.title}`],
      }));
    });
  });

  return mergeShoppingItems(items);
}
