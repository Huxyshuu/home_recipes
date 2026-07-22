# Home Recipes

Home Recipes is a lightweight, local-first recipe book, cooking companion and weekly meal-planning app for a kitchen tablet, computer and phone on the same Wi-Fi network.

This release adds a central shared ingredient library and is designed around a practical muscle-gain / gradual-fat-loss routine for a 93 kg user targeting 80–85 kg. It includes 14 Finnish-language weekly favourites, a seven-day rotation, live Fineli nutrition synchronisation, S-kaupat/K-Ruoka product links, transparent recipe-price coverage and a shared Sunday/Wednesday grocery cart.

The application remains suitable for the Huawei MediaPad T1 10 / T1-A21L generation of hardware. The production build includes a legacy JavaScript bundle, uses system fonts, keeps dependencies modest and avoids relying on modern CSS Grid for core layouts.

## What is included

### Recipe library

- Responsive recipe library with search, category and difficulty filters, favourites and sorting.
- Fourteen complete weekly-plan recipes, all marked as favourites.
- Finnish recipe titles, descriptions, ingredients, notes, timed steps, grocery categories and tags, while preserving English fallback fields in the JSON.
- Text-free responsive covers and robust image-area styling that no longer crops recipe labels or overlaps card controls.
- Recipe editor with image upload, Fineli search, retailer links and saved price fields.
- Central **Ingredients** view: update one ingredient once and every linked recipe immediately receives the same name, Fineli record, nutrition, shop links and price. Recipe quantities, units, gram weights and preparation notes remain recipe-specific.
- Scalable portions, per-ingredient retailer shortcuts, price coverage, total price/per-serving calculation and a one-tap **Add to grocery cart** action.

### Weekly routine

- Seven-day meal rotation with breakfast, lunch, dinner, a skyr snack and a whey/banana training snack.
- Approximate daily calories, protein, carbohydrate, fat and fibre.
- Sunday and Wednesday shopping windows.
- One-tap combined carts that aggregate repeated ingredients.

### Nutrition guide and substitutions

- Compact guide cards for energy, protein, carbohydrate, fat, fibre, Finnish micronutrient considerations and foods to limit.
- Direct links to the sports-nutrition position paper, Nordic Nutrition Recommendations 2023, Finnish Food Authority pages and Fineli.
- Ingredient substitution cards for animal protein, fish, vegetarian protein, carbohydrate bases, vegetables and dairy/plant alternatives.
- A clear note that the weekly calorie level is a starting template, not an individually calculated medical diet.

### Shared grocery cart

- Cart stored in `data/shopping-cart.json` by the local server.
- Accessible from the tablet, PC or phone on the same network.
- Ingredient aggregation by name and unit.
- Grocery-department grouping, check-off state, source-meal notes, remove checked and clear-all controls.
- Refresh button for seeing changes made on another device.

### Cooking and nutrition tools

- Full-screen cooking mode that shows every recipe step simultaneously.
- Independent step timers with a traditional kitchen-timer sound, vibration where supported, pause/resume/reset and `+1 min`.
- Finnish nutrition lookup through the open Fineli API maintained by THL.
- One-click or command-line bulk synchronisation of every unique shared ingredient. The app writes the exact Fineli food ID, Finnish food name, household measures, per-100-g values, sync time and match provenance once into `data/ingredients.json`; linked recipes read that shared record automatically.
- Conservative matching: an ingredient is not silently guessed when no sufficiently close Fineli result exists; unresolved foods remain listed for review.
- Local Fineli food/search cache with stale-cache fallback and bounded atomic storage.
- Local JSON recipe database with serialized atomic writes.

## Technology

- Frontend: Vite, React 18, SCSS
- Older-browser support: `@vitejs/plugin-legacy` and a fetch polyfill
- Backend: Node.js and Express
- Recipe storage: `data/recipes.json` (recipe-level fields and ingredient usage amounts)
- Shared ingredient storage: `data/ingredients.json` (names, Fineli data, nutrition, retailer links and prices)
- Shared grocery cart: `data/shopping-cart.json`
- Fineli cache: `data/fineli-cache.json`
- Uploaded images: `uploads/`

## Requirements

Install Node.js 18.18 or newer on the computer that hosts the application. Node.js 20 LTS or newer is recommended.

The tablet and phone only need a browser.

## Install

```bash
npm install
```

## Development mode

```bash
npm run dev
```

This starts:

- Vite frontend: `http://localhost:5173`
- Express API: `http://localhost:8787`

The old tablet should use the production build because Vite's development client expects a more modern browser.

## Run on the local Wi-Fi network

```bash
npm run lan
```

The complete app is then served from port `8787`.

Find the host computer's local IP address.

### Ubuntu / Linux

```bash
hostname -I
```

### Windows PowerShell

```powershell
ipconfig
```

Open the address on the tablet or phone, for example:

```text
http://192.168.1.45:8787
```

Replace the example with the host computer's actual Wi-Fi address. All devices must be on the same local network, and the host computer must remain powered on.

### Restrict Ubuntu's firewall rule to the home network

For an address such as `192.168.1.45`, a common subnet is `192.168.1.0/24`:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 8787 proto tcp
sudo ufw status numbered
```

Do not configure router port forwarding for port `8787`.

## Using the meal routine

1. Open **Routine**.
2. Use **Create this cart** under Sunday shop before the week begins.
3. Open **Cart** on your phone and check groceries off in the store.
4. On Wednesday, create the Wednesday cart for the second half of the week.
5. Open any routine meal to see full ingredients, substitutions and cooking steps.
6. Put **Whey + Banana** before or after lifting. On a non-training day with low appetite, that is the first optional item to remove.

The 2,290–2,410 kcal daily range is a structured starting point. It is not a personalised maintenance-calorie calculation because the app does not know height, age, sex, steps or training volume. Use consistency, body-weight trend, gym performance, hunger and recovery to decide whether later adjustment is needed.

## Shared ingredient workflow

Open **Ingredients** from the main navigation. The page contains the 47 unique seed ingredients and shows how many recipes use each one.

Shared fields include:

- Finnish and English names;
- grocery category;
- Fineli query, food ID, measures and per-100-g nutrition;
- S-kaupat and K-Ruoka links;
- selected product, price, store and observation date.

Recipe-specific fields remain in `data/recipes.json`:

- quantity and unit;
- gram weight;
- preparation note.

For example, changing the saved price of **Rypsiöljy** once updates the cost calculation in all seven recipes that use it, without changing the amount of oil in any recipe. The recipe editor also links each row to a shared ingredient record; saving shared fields there updates the same central record.

## Recipe nutrition behavior

The 14 weekly favourites contain two nutrition layers:

1. `plannedNutritionPerServing`: the approximate planning value from the supplied research plan.
2. The linked record in `data/ingredients.json`: the food values used for exact ingredient calculations after a successful Fineli sync.

The supplied JSON initially keeps the researched plan estimate active and marks every ingredient as awaiting Fineli synchronisation. This is intentional: values are never presented as API-verified until the app has actually received and stored a Fineli food record.

Run the synchronisation after installing the project:

```bash
npm run sync:fineli
```

To ignore fresh cache entries and request Fineli again:

```bash
npm run sync:fineli:fresh
```

The same operation is available inside **Nutrition Guide → Sync Fineli data**. A recipe switches to ingredient-based nutrition only when all its ingredients have resolved Fineli records. Partial or ambiguous matches remain visible for review instead of being guessed.

Nutrition can still vary because of product brand, cooking loss, drained weight and edible portion. Fineli describes foods rather than a particular supermarket package, so package labels remain the best source for brand-specific values.


## Retailer links and recipe pricing

Every shared ingredient contains Finnish search links for both S-kaupat and K-Ruoka. When a specific product has been verified, the link can be replaced with its direct product page in **Ingredients** or from a linked recipe editor. The change applies to every recipe using that ingredient.

Retail prices depend on the selected store, date, campaign and package. Home Recipes therefore does not invent or silently scrape a universal price. A saved price record contains its retailer, product, direct source URL, unit/package price, store and observation date. Only those saved records contribute to:

- ingredient cost;
- recipe total;
- price per serving;
- price coverage percentage.

The seed data includes two verified examples to demonstrate the workflow. All other ingredients have working retailer searches and display **Price not saved** until a product and current price are reviewed.

## Grocery cart behavior

The shared cart file is:

```text
data/shopping-cart.json
```

When a routine cart is built:

- repeated ingredients are combined when their canonical name and unit match;
- meal sources are retained for context;
- items are grouped by grocery department;
- the current cart is replaced after confirmation.

Adding an individual recipe merges its ingredients into the existing cart. Portion changes in the recipe detail scale the added quantities.

The cart does not use live push updates. Tap **Refresh** on another device to load the latest checks.

## Data files

### Recipes and ingredient usage

```text
data/recipes.json
```

### Shared ingredient library

```text
data/ingredients.json
```

The recipe file stores each use of an ingredient by `catalogId`, together with that recipe's quantity, unit, gram weight and preparation note. The ingredient library stores the shared food identity, Fineli mapping, nutrition and retailer data.

### Shared grocery cart

```text
data/shopping-cart.json
```

### Fineli cache

```text
data/fineli-cache.json
```

### Uploaded images

```text
uploads/
```

Recipe, ingredient and cart writes use temporary files followed by rename. Mutations are serialized to reduce the risk of simultaneous tablet/PC changes overwriting one another.

## Back up an existing installation

Before replacing an older version:

```bash
cp data/recipes.json ~/home-recipes-recipes-backup.json
cp data/ingredients.json ~/home-recipes-ingredients-backup.json 2>/dev/null || true
cp data/shopping-cart.json ~/home-recipes-cart-backup.json 2>/dev/null || true
cp -r uploads ~/home-recipes-uploads-backup
```

Restore personal recipes, ingredients or uploads after extracting the new release. When Home Recipes opens an older 0.4.0-style recipe file containing full ingredient snapshots, it automatically creates shared ingredient records and replaces the snapshots with `catalogId` links. Back up the JSON files before the first launch.

## Fineli API and cache

The Express server is the only part that contacts Fineli. This avoids direct browser cross-origin and older-TLS problems on the tablet.

Documented endpoints used include:

```text
GET https://fineli.fi/fineli/api/v1/foods?q=omena
GET https://fineli.fi/fineli/api/v1/foods/11060
GET https://fineli.fi/fineli/api/v1/components/
```

Food details primarily use:

```text
energyKcal
protein
carbohydrate
fat
fiber
```

Current cache rules:

```text
Maximum selected foods: 250
Maximum saved searches: 100
Search freshness: 30 days
Food-detail freshness: 180 days
```

## Local API

```text
GET    /api/health
GET    /api/recipes
POST   /api/recipes
PUT    /api/recipes/:id
DELETE /api/recipes/:id
GET    /api/cart
PUT    /api/cart
POST   /api/uploads
GET    /api/nutrition/cache?q=...
GET    /api/nutrition/search?q=...
GET    /api/nutrition/search?q=...&refresh=1
GET    /api/nutrition/foods/:id
GET    /api/nutrition/foods/:id?refresh=1
POST   /api/nutrition/sync-recipes
```

## Tests

```bash
npm test
```

The suite covers:

- Recipe nutrition calculations
- Fineli search and food-detail normalization
- Fineli cache reuse and atomic persistence
- Concurrent recipe JSON writes
- Nested-form regression prevention
- All-step cooking mode and audible timer logic
- Fourteen complete meal-plan recipe records
- Seven valid routine days
- Sunday/Wednesday ingredient aggregation
- Shared cart atomic persistence
- Finnish recipe/ingredient completeness and retailer-link validation
- Text-free responsive recipe-cover regression
- Ingredient and recipe price calculations

## Project structure

```text
home-recipes/
├── data/
│   ├── fineli-cache.json
│   ├── recipes.json
│   ├── recipes.en-backup.json
│   └── shopping-cart.json
├── public/
│   ├── meal-plan-covers/
│   ├── app-icon.svg
│   └── manifest.webmanifest
├── server/
│   ├── cartStore.js
│   ├── fineli.js
│   ├── fineliCache.js
│   ├── fineliRecipeSync.js
│   ├── index.js
│   └── recipeStore.js
├── src/
│   ├── api/
│   ├── components/
│   ├── data/mealPlan.js
│   ├── hooks/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── scripts/
│   └── sync-fineli-recipes.js
├── tests/
├── uploads/
├── ARCHITECTURE.md
├── CHANGELOG.md
├── index.html
├── package.json
└── vite.config.js
```

## Research and recipe provenance

The recipes in this release are original Home Recipes meal-plan recipes created from the supplied seven-day Finnish meal-system research plan. They are not copied from a single online recipe page. The Finnish recipe dataset preserves the original English text in explicit `*En` fields. Plan macros remain labelled as estimates until the live Fineli synchronisation has populated verified ingredient records.

The guide links directly to:

- Academy of Nutrition and Dietetics / Dietitians of Canada / ACSM position paper on nutrition and athletic performance
- Nordic Nutrition Recommendations 2023
- Finnish Food Authority adult nutrition guidance
- Finnish Food Authority pages on salt, iodine and vitamin D
- THL Fineli open-data information

## Licence and attribution

Application code: MIT.

Fineli data is separate third-party data provided by the Finnish Institute for Health and Welfare (THL) under CC BY 4.0. Fineli is a registered trademark of THL; this application is not produced, endorsed or operated by THL.
