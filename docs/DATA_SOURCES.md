# Data sources and provenance

## Supplied meal-system research plan

The 14 recipes and seven-day routine originate from the supplied **Seven day Finnish meal system for building muscle while losing fat** document. Its calories and macros are planning estimates; actual values can change with brands, cooking loss, serving sizes, and product labels.

## Fineli

LettuceCook stores Finnish search terms, selected Fineli food IDs, Finnish food names, household measures, per-100-g nutrition, synchronization timestamps, and match methods in the shared ingredient catalog.

- Local mode uses the server-side Fineli implementation and cache.
- Cloud mode uses the browser adapter or the optional HTTPS proxy configured with `VITE_FINELI_PROXY_URL`.
- Unresolved or ambiguous foods are reported rather than silently accepted.
- Recipe nutrition changes to ingredient-calculated values only when the required shared ingredients are sufficiently resolved.

Fineli data is provided by the Finnish Institute for Health and Welfare under CC BY 4.0. Fineli is a registered trademark of THL.

## S-kaupat and K-Ruoka

Each shared ingredient can contain retailer search links and a reviewed direct product page. Saved prices are snapshots associated with a retailer, store or context, package size, unit basis, and observation date. They are not universal live prices and should be checked before shopping.

The application calculates a complete recipe total only when all required ingredients have usable saved prices. Partial coverage is shown as a covered subtotal rather than presented as a precise full cost.

## Cloudinary

Cloudinary stores user-uploaded recipe images in the public cloud deployment. The recipe database stores the returned secure URL rather than image bytes. Existing bundled SVG recipe covers remain part of the application source.

## Firebase

Firestore stores application data supplied by the user and the seed JSON in this repository. Firebase Authentication stores the single account credential. The application does not store or log the shared password.
