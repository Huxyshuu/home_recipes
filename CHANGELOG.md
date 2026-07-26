# Changelog

## 0.5.0 — Firebase cloud website, persistent authentication, and URL routing

### Added

- Firebase Authentication with a password-only application screen backed by one configured Email/Password account.
- Browser-local Firebase session persistence, so a device normally logs in only once.
- Cloud Firestore service for recipes, the shared ingredient catalog, and the grocery cart.
- First-login Firestore bootstrap from the current 14 recipes, 47 shared ingredients, and cart seed.
- Real-time Firestore subscriptions across signed-in devices.
- Cloudinary image uploads in cloud mode.
- Direct routes for recipe details and editing.
- Back/Forward navigation using the browser History API.
- Firebase Hosting configuration with an SPA rewrite.
- UID-restricted Firestore security rules.
- Cloud/local runtime selection and separate cloud/local development and build commands.
- Cloud architecture tests and deployment documentation.

### Changed

- The frontend now uses one backend abstraction for both Firestore and the original Express API.
- Recipe details are addressable at `/recipes/:id` instead of existing only as transient UI state.
- The header shows the active backend and provides Sign out in Firebase mode.
- The grocery cart and shared ingredients react to cloud updates without manual refresh.
- The package version is now 0.5.0.

### Preserved

- Local JSON/Express operation.
- LAN access.
- Central shared ingredient propagation.
- The Finnish recipe set, Fineli fields, retailer links, price calculations, cooking mode, timers, meal routine, and nutrition guide.

### Deployment note

`firestore.rules` contains a deliberate UID placeholder and must not be deployed until it is replaced with the UID of the single Home Recipes Firebase user.

## 0.4.1 — Shared ingredient library

- Added one central record for each unique ingredient.
- Linked every recipe occurrence through `catalogId`.
- Added the Ingredients interface for updating Fineli, nutrition, retailer, and price information once.

## 0.4.0 — Finnish data, Fineli and retailers

- Translated the meal-plan recipes into Finnish while preserving English companion fields.
- Added Fineli matching and synchronization support.
- Added S-kaupat/K-Ruoka links and reviewed price fields.
- Corrected recipe-cover presentation and responsive styling.
