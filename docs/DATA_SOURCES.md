# Data sources and provenance

## Supplied meal-system research plan

The 14 recipes and the seven-day routine originate from the supplied **Seven day Finnish meal system for building muscle while losing fat** document. Its calorie and macro figures are planning estimates and the document explicitly notes that actual values vary by brand, cooking loss and product label.

## Fineli

Home Recipes retrieves food records from THL Fineli through the server-side endpoints implemented in `server/fineli.js`. A successful bulk sync stores the Fineli identifier, Finnish name, household measures, per-100-g nutrition, timestamp and match method. Unresolved foods are reported and keep the plan estimate active.

Fineli data is provided by the Finnish Institute for Health and Welfare under CC BY 4.0. Fineli is a registered trademark of THL.

## S-kaupat and K-Ruoka

Each ingredient includes retailer search links. A direct product page may be saved when a suitable product has been reviewed. Product prices are snapshots tied to a store and observation date; they are not universal prices and must be rechecked before shopping. The app calculates costs only from explicit saved price data.
