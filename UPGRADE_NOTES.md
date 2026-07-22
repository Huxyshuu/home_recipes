# Upgrade notes — Home Recipes 0.4.1

## Shared ingredient library

Version 0.4.1 adds `data/ingredients.json` as the single editable list for shared ingredient information. Open **Ingredients** in the app to change nutrition, Fineli mapping, store links or price once for every recipe using that ingredient.

Recipe-specific quantity, unit, gram weight and preparation notes remain separate.

## Upgrade

```bash
unzip home-recipes-v0.4.1-shared-ingredients.zip
cd home_recipes
npm install
npm test
npm run lan
```

Back up both data files before replacing an existing installation:

```bash
cp data/recipes.json ~/home-recipes-recipes-backup.json
cp data/ingredients.json ~/home-recipes-ingredients-backup.json 2>/dev/null || true
```

An older recipe file that still embeds complete ingredient records is automatically migrated on first load. Home Recipes creates unique shared definitions and links each recipe occurrence using `catalogId`.

## Editing ingredients

1. Open **Ingredients**.
2. Search for the ingredient.
3. Update the Fineli selection, nutrition, S/K links or price.
4. Save the shared ingredient.
5. Every linked recipe uses the update immediately.

The recipe editor also includes a **Shared ingredient record** selector. Shared fields changed there are saved globally when the recipe is saved.
