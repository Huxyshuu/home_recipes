# Changelog

## 0.3.0 — Weekly routine and shared grocery cart

- Added Routine, Nutrition Guide, Substitutions and Grocery Cart tabs.
- Added a complete seven-day body-recomposition meal routine for a 93 kg user targeting 80–85 kg.
- Replaced sample seed data with 14 complete weekly-plan favourites.
- Added detailed steps, timer values, grocery categories, recipe-specific substitutions and source provenance to all 14 recipes.
- Added fixed plan macros with a transparent switch back to ingredient-based nutrition.
- Added original pastel SVG covers for all weekly favourites.
- Added one-tap recipe-to-cart actions with portion scaling.
- Added Sunday and Wednesday combined cart generation.
- Added ingredient aggregation and grocery-department grouping.
- Added a server-backed shared grocery cart in `data/shopping-cart.json`.
- Added current source links for sports nutrition, NNR 2023, Finnish nutrition guidance and Fineli.
- Added cart, routine and data-integrity tests.

## 0.2.1 — Timer sound update

- Replaced the short tone with a longer traditional kitchen-timer pattern.

## 0.2.0 — Home Recipes redesign and Fineli hardening

- Renamed the app to Home Recipes.
- Added pastel pink and blue styling.
- Fixed nested form submission in Fineli search.
- Added a bounded local Fineli cache and stale fallback.
- Reworked cooking mode to display all steps.
- Added independent timers, sound and vibration.
