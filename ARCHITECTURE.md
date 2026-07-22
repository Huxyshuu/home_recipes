# Home Recipes architecture

## Runtime model

A single Node/Express process serves:

1. the production React bundle;
2. recipe CRUD and image uploads;
3. the Fineli proxy/cache;
4. the shared grocery cart.

The tablet, PC and phone are browser clients on the same trusted local network.

```text
Browser clients
  ├─ Recipes / cooking progress
  ├─ Routine / guides / substitutions
  └─ Grocery cart
          │ HTTP on LAN
          ▼
Express server :8787
  ├─ data/recipes.json
  ├─ data/shopping-cart.json
  ├─ data/fineli-cache.json
  ├─ uploads/
  └─ Fineli upstream API
```

## Frontend

`src/App.jsx` owns top-level navigation and overlays. Main views are deliberately separate components:

- `RecipeGrid` and `RecipeDetail`
- `RoutinePage`
- `NutritionGuide`
- `SubstitutionsPage`
- `GroceryCart`
- `StatsDashboard`

Static researched content lives in `src/data/mealPlan.js`. This keeps the routine and source library independent from mutable recipe CRUD while still resolving routine recipe slugs against `data/recipes.json`.

## Recipe model

Meal-plan recipes use the normal recipe schema plus:

```json
{
  "slug": "protein-overnight-oats",
  "plannedNutritionPerServing": {
    "kcal": 560,
    "protein": 47,
    "carbs": 58,
    "fat": 14,
    "fibre": 11
  },
  "useIngredientNutrition": false
}
```

Each ingredient may also contain:

```json
{
  "shoppingCategory": "Dairy & chilled"
}
```

`recipeNutrition()` returns the fixed weekly-plan estimate when present, unless `useIngredientNutrition` is true. It also retains the computed ingredient result so the distinction remains explicit.

## Grocery cart

The cart is server-backed rather than localStorage-backed because the intended workflow crosses devices.

`server/cartStore.js` provides:

- store initialization;
- input normalization;
- serialized writes;
- temporary-file + rename atomic persistence.

The API surface is:

```text
GET /api/cart
PUT /api/cart
```

`src/utils/shopping.js` handles:

- canonical ingredient names;
- unit normalization;
- repeated-ingredient aggregation;
- grocery-category ordering;
- Sunday/Wednesday window expansion.

A list generated on one device becomes available to another after refresh.

## Meal-plan shopping windows

Routine meals use either a `recipeSlug` or `quickMealId`. The two shopping windows select day/slot combinations rather than maintaining separate hard-coded ingredient lists. This avoids drift when recipe ingredients change.

Sunday covers Monday–Wednesday plus Thursday breakfast, lunch and daytime snacks. Wednesday covers Thursday dinner through Sunday.

## Nutrition sources

The in-app guide stores source metadata with stable public URLs. Assertions are linked to:

- the joint sports-nutrition position paper;
- Nordic Nutrition Recommendations 2023;
- Finnish Food Authority adult guidance;
- Finnish salt/iodine/vitamin-D guidance;
- THL Fineli open-data information.

The recipes themselves are original plan recipes, not copied from recipe websites.

## Compatibility

- Vite legacy plugin targets Android 4.4 and Chrome 49.
- Core layouts use flexbox rather than CSS Grid.
- Recipe covers are local SVG files.
- The server proxies Fineli so the tablet does not make direct cross-origin or modern-TLS requests.
- Cooking progress remains localStorage-based because it is device/session interaction state; the grocery cart is shared server state.

## Persistence and concurrency

Recipe and cart stores use independent mutation queues. Each write is serialized and performed through a temporary file followed by rename. This protects against partially written JSON and reduces lost updates from nearly simultaneous requests.

The cart is not real-time push synchronized. Clients explicitly refresh to load changes made elsewhere.
