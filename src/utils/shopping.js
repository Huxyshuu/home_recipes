import { quickMeals, shoppingWindows, weeklyRoutine } from '../data/mealPlan.js';

export const shoppingCategoryOrder = [
  'Produce',
  'Meat & fish',
  'Plant protein',
  'Dairy & chilled',
  'Frozen',
  'Bakery',
  'Grains',
  'Nuts & seeds',
  'Pantry',
  'Other',
];

const nameAliases = {
  egg: 'Eggs',
  eggs: 'Eggs',
  banana: 'Bananas',
  bananas: 'Bananas',
  'frozen pea': 'Frozen peas',
  peas: 'Frozen peas',
  'frozen peas': 'Frozen peas',
  skyr: 'Skyr',
  'rolled oats': 'Rolled oats',
  'unsweetened muesli or rolled oats': 'Unsweetened muesli or rolled oats',
  'quark or rahka': 'Quark or rahka',
  'low-fat cottage cheese': 'Low-fat cottage cheese',
  'greek yogurt': 'Greek yogurt',
  'whole-wheat pasta, dry': 'Whole-wheat pasta, dry',
  'rice, dry': 'Rice, dry',
};

export function normaliseUnit(unit) {
  const value = String(unit || 'g').trim().toLowerCase();
  if (['pc', 'pcs', 'piece', 'pieces'].includes(value)) return 'pcs';
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
      return;
    }
    merged.set(key, {
      id: item.id || `cart-${Date.now()}-${Math.random()}`,
      name,
      quantity: Number(item.quantity || 0),
      unit,
      category: item.category || item.shoppingCategory || 'Other',
      checked: Boolean(item.checked),
      sources: [...new Set(item.sources || [])],
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
    category: ingredient.shoppingCategory || 'Other',
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
        category: ingredient.shoppingCategory || 'Other',
        checked: false,
        sources: [`${day.weekday}: ${quickMeal.title}`],
      }));
    });
  });

  return mergeShoppingItems(items);
}
