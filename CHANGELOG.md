# Changelog

## 0.4.1 — Shared ingredient library

- Added a central Ingredients view containing 47 unique shared ingredient records.
- Split shared food data from recipe-specific quantity, unit, gram weight and preparation notes.
- Added `data/ingredients.json` as the single source of truth for names, categories, Fineli records, nutrition, retailer links and prices.
- Linked all 84 ingredient occurrences in the 14 recipes through stable `catalogId` values.
- Added ingredient API endpoints and per-ingredient recipe usage counts.
- Updated the recipe editor with a shared-record selector and global ingredient saving.
- Changed Fineli bulk sync to update each unique catalog ingredient once rather than duplicated recipe entries.
- Added automatic migration for older recipe files containing embedded ingredient snapshots.
- Added regression coverage proving that one catalog update propagates to every linked recipe while preserving different recipe quantities.

## 0.4.0 — Finnish data, Fineli sync and retailer pricing

- Fixed recipe-card and detail-cover layout so text and controls no longer overlap or get cropped inside recipe artwork.
- Replaced the labelled covers with 14 text-free responsive SVG illustrations.
- Translated all 14 recipes, ingredients, notes, steps, categories, tags and shopping groups into Finnish while preserving English fallback fields.
- Added Finnish Fineli search queries, preferred matching terms and per-ingredient provenance.
- Added conservative bulk Fineli synchronisation through the UI, API and command line.
- Recipes only switch to ingredient-calculated nutrition when every ingredient has a resolved Fineli record.
- Added S-kaupat and K-Ruoka links for every ingredient, with support for direct product URLs.
- Added store/date-aware saved prices, per-ingredient cost, recipe total, per-serving price and coverage percentage.
- Added retailer links to recipe details and the shared grocery cart.
- Preserved the exact supplied English JSON as `data/recipes.en-backup.json`.

## 0.3.0 — Weekly routine and shared grocery cart

- Added Routine, Nutrition Guide, Substitutions and Grocery Cart tabs.
- Added a complete seven-day body-recomposition meal routine and 14 complete weekly-plan favourites.
- Added detailed steps, timer values, grocery categories, substitutions, source provenance and shared grocery-cart generation.

## 0.2.1 — Timer sound update

- Replaced the short tone with a longer traditional kitchen-timer pattern.

## 0.2.0 — Home Recipes redesign and Fineli hardening

- Renamed the app to Home Recipes.
- Added pastel pink and blue styling, Fineli cache hardening and cooking timers.
