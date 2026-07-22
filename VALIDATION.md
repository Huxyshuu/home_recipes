# Validation report

Validated on July 22, 2026:

- `npm test`: 20/20 Node test cases passed.
- `npm run build`: Vite production build completed successfully, including the legacy browser bundle.
- Server modules passed `node --check`.
- Recipe, shared-ingredient and grocery-cart JSON files passed strict JSON parsing.
- The translated seed contains exactly 14 recipes, 47 shared ingredients and 84 linked ingredient occurrences.
- Every recipe occurrence references a valid shared ingredient through `catalogId`.
- A regression test confirms that updating one shared ingredient changes nutrition and price in every linked recipe while preserving different recipe gram amounts.
- A migration test confirms that older embedded ingredient snapshots are converted to the shared catalog automatically on first read.
- The ingredient API reports per-ingredient usage counts and recipe names; the seed verifies that rapeseed oil is shared by seven recipes.
- Every shared ingredient preserves an English fallback, Finnish Fineli query, S-kaupat URL and K-Ruoka URL.
- All 14 generated SVG covers have a responsive `viewBox`, explicit `preserveAspectRatio` behavior and no embedded text.
- Every routine recipe reference resolves, and Sunday/Wednesday lists contain no duplicate canonical name/unit keys after aggregation.
- Price calculations were tested for weight-based ingredients and partial coverage without fabricated prices.
- Production API health, 47-ingredient listing, 14-recipe hydrated listing and static frontend were smoke-tested locally.

Live Fineli synchronisation was not written into the delivered seed in this build environment because outbound DNS/network access was unavailable during packaging. The UI/API/CLI sync updates each unique record in `data/ingredients.json` and only marks values as verified after Fineli responds. Run `npm run sync:fineli` after installation.
