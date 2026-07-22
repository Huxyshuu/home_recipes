# Home Recipes architecture

## Runtime model

A single Node/Express process serves the React bundle, recipe and shared-ingredient APIs, image uploads, the Fineli proxy/cache and the shared grocery cart. Browser clients run on the same trusted local network.

```text
Browser clients
  ├─ Recipes / cooking mode
  ├─ Shared ingredient library
  ├─ Routine / guides / substitutions
  └─ Grocery cart
          │ HTTP on LAN
          ▼
Express server :8787
  ├─ data/recipes.json
  ├─ data/ingredients.json
  ├─ data/shopping-cart.json
  ├─ data/fineli-cache.json
  ├─ uploads/
  └─ Fineli upstream API
```

## Normalised ingredient model

Ingredient information is split deliberately into a shared definition and recipe-specific usage.

`data/ingredients.json` is the single source of truth for fields that should propagate globally:

```json
{
  "id": "ingredient-kaurahiutale",
  "name": "Kaurahiutale",
  "fineliFoodId": 1234,
  "nutritionPer100g": {},
  "retail": {}
}
```

`data/recipes.json` stores only how the recipe uses that shared ingredient:

```json
{
  "id": "protein-overnight-oats-i1",
  "catalogId": "ingredient-kaurahiutale",
  "quantity": 60,
  "unit": "g",
  "grams": 60,
  "note": ""
}
```

`server/recipeStore.js` hydrates API responses by joining each usage to its catalog record. Therefore one update to a catalog item changes every recipe response, nutrition calculation, retailer link and price calculation that uses it. Recipe quantities and preparation notes are never overwritten by a global ingredient update.

Older ingredient snapshots are migrated automatically on first read: unique definitions are created, recipes receive `catalogId` links and the normalised JSON is written atomically.

## Frontend

`src/App.jsx` owns top-level navigation. Main views are:

- `RecipeGrid` and `RecipeDetail`;
- `IngredientLibrary`;
- `RoutinePage`;
- `NutritionGuide`;
- `SubstitutionsPage`;
- `GroceryCart`;
- `StatsDashboard`.

The recipe editor loads the ingredient catalog. A row can select an existing shared definition or create a new one. Shared fields are saved through `/api/ingredients`; the recipe itself stores the resulting `catalogId` and recipe-specific usage fields.

## API surface

```text
GET  /api/ingredients
POST /api/ingredients
PUT  /api/ingredients/:id
GET  /api/recipes
POST /api/recipes
PUT  /api/recipes/:id
DELETE /api/recipes/:id
GET  /api/cart
PUT  /api/cart
```

`GET /api/ingredients` also reports the recipes using each ingredient, which powers the usage count and recipe chips in the Ingredients view.

## Fineli synchronisation

Bulk Fineli sync now operates on the 47 unique catalog records instead of duplicated recipe occurrences. It updates `data/ingredients.json` once, then updates recipe-level sync status. API recipe reads immediately expose the new values through hydration.

## Grocery cart and pricing

Frontend shopping and pricing utilities receive hydrated recipes, so aggregation and cost calculations use the latest shared ingredient names, categories, retailer links and prices. Amounts still come from each recipe usage.

## Persistence and compatibility

Recipe, ingredient and cart stores have independent serialised mutation queues and use temporary-file + rename writes. Vite's legacy bundle targets Android 4.4 / Chrome 49, and core layouts continue to use flexbox rather than CSS Grid.
