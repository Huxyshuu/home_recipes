import { getFineliFood, searchFineli } from './fineli.js';
import { readIngredients, writeIngredients } from './ingredientStore.js';
import { readRawRecipes, writeRecipes } from './recipeStore.js';

function normalise(value) {
  return String(value || '')
    .toLocaleLowerCase('fi-FI')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9åäö]+/g, ' ')
    .trim();
}

function candidateScore(candidate, query, preferredTerms) {
  const name = normalise(candidate.name);
  const cleanQuery = normalise(query);
  const terms = (preferredTerms || []).map(normalise).filter(Boolean);
  let score = 0;
  if (name === cleanQuery) score += 100;
  if (name.startsWith(cleanQuery)) score += 45;
  if (name.includes(cleanQuery)) score += 25;
  if (terms.length && terms.every((term) => name.includes(term))) score += 65;
  score += terms.filter((term) => name.includes(term)).length * 12;
  if (/raaka|kuiva|pakaste|rasvaton|vähärasvainen/.test(cleanQuery) && name.includes(cleanQuery.split(' ').at(-1))) score += 8;
  return score;
}

function selectCandidate(results, query, preferredTerms) {
  const ranked = [...results]
    .map((candidate) => ({ candidate, score: candidateScore(candidate, query, preferredTerms) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 20) return null;
  const method = ranked[0].score >= 100 ? 'exact-name' : ranked[0].score >= 65 ? 'preferred-terms' : 'best-token-match';
  return { ...ranked[0].candidate, matchMethod: method, matchScore: ranked[0].score };
}

export async function syncRecipesWithFineli({ forceRefresh = false } = {}) {
  const [catalog, recipes] = await Promise.all([readIngredients(), readRawRecipes()]);
  const unresolved = [];
  const resolvedIds = new Set();
  const syncedAt = new Date().toISOString();

  const nextCatalog = [];
  for (const ingredient of catalog) {
    try {
      let selected;
      if (ingredient.fineliFoodId) {
        selected = {
          id: ingredient.fineliFoodId,
          name: ingredient.fineliFoodName || ingredient.name,
          matchMethod: 'stored-id',
          matchScore: 999,
        };
      } else {
        const search = await searchFineli(ingredient.fineliQuery || ingredient.name, { forceRefresh });
        selected = selectCandidate(search.results, ingredient.fineliQuery || ingredient.name, ingredient.fineliPreferredTerms);
      }
      if (!selected) {
        unresolved.push({ name: ingredient.name, query: ingredient.fineliQuery || ingredient.name, reason: 'No sufficiently close Fineli match.' });
        nextCatalog.push(ingredient);
        continue;
      }
      const food = await getFineliFood(selected.id, { forceRefresh });
      resolvedIds.add(ingredient.id);
      nextCatalog.push({
        ...ingredient,
        fineliFoodId: food.id,
        fineliFoodName: food.name,
        fineliMeasures: food.measures || [],
        nutritionPer100g: food.nutritionPer100g,
        nutritionSource: {
          provider: 'THL Fineli API',
          status: 'verified-api',
          syncedAt,
          matchMethod: selected.matchMethod,
        },
        updatedAt: syncedAt,
      });
    } catch (error) {
      unresolved.push({ name: ingredient.name, query: ingredient.fineliQuery || ingredient.name, reason: error.message });
      nextCatalog.push(ingredient);
    }
  }

  const statusById = new Map(nextCatalog.map((ingredient) => [ingredient.id, ingredient.nutritionSource?.status]));
  let updatedIngredientOccurrences = 0;
  const nextRecipes = recipes.map((recipe) => {
    const usages = recipe.ingredients || [];
    const resolvedCount = usages.filter((usage) => statusById.get(usage.catalogId) === 'verified-api').length;
    updatedIngredientOccurrences += usages.filter((usage) => resolvedIds.has(usage.catalogId)).length;
    const allResolved = usages.length > 0 && resolvedCount === usages.length;
    return {
      ...recipe,
      useIngredientNutrition: allResolved,
      nutritionStatus: allResolved ? 'fineli-synced' : resolvedCount ? 'fineli-partial' : 'fineli-sync-required',
      fineliSyncedAt: resolvedCount ? syncedAt : recipe.fineliSyncedAt || '',
      updatedAt: resolvedCount ? syncedAt : recipe.updatedAt,
    };
  });

  await Promise.all([writeIngredients(nextCatalog), writeRecipes(nextRecipes)]);
  return {
    syncedAt,
    recipes: nextRecipes.length,
    uniqueIngredients: nextCatalog.length,
    resolvedUniqueIngredients: nextCatalog.length - unresolved.length,
    unresolvedUniqueIngredients: unresolved.length,
    updatedIngredientOccurrences,
    unresolved,
  };
}
