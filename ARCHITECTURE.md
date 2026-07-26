# LettuceCook architecture — v0.6.0

## Runtime selection

`src/config/runtime.js` determines the backend:

- `VITE_DATA_BACKEND=firebase`: cloud mode.
- `VITE_DATA_BACKEND=local`: Express/JSON mode.
- If the variable is omitted, a complete Firebase web configuration selects cloud mode; otherwise local mode is used.

`src/api/client.js` is the common data interface. UI components and hooks do not need to know whether data comes from Firestore or the local REST API.

## Cloud mode

```text
Browser
  ├─ Firebase Authentication (one Email/Password user)
  ├─ Cloud Firestore
  │    ├─ recipes/{id}
  │    ├─ ingredients/{id}
  │    ├─ appState/sharedCart
  │    └─ meta/bootstrap
  ├─ Cloudinary unsigned image upload
  └─ Firebase Hosting SPA
```

### Authentication

`src/auth/AuthGate.jsx` presents a password-only form. The configured shared email is supplied internally to Firebase Email/Password authentication. `src/services/firebaseClient.js` sets `browserLocalPersistence`, so the Firebase session survives reloads and browser restarts on the same device.

Every cloud screen is behind `AuthGate`. Firestore rules additionally limit all reads and writes to one exact UID.

### Firestore bootstrap

`src/services/firebaseData.js` checks `meta/bootstrap` after authentication. If the marker does not exist, a single Firestore batch imports the bundled recipes, ingredients, and cart. The marker makes the process idempotent.

The seed is intentionally not reapplied later. This prevents a deployment from overwriting edits made in Firestore.

### Shared ingredients

Firestore recipe documents contain ingredient usages rather than copied ingredient definitions:

```json
{
  "catalogId": "rapeseed-oil",
  "quantity": 10,
  "unit": "g",
  "grams": 10,
  "note": ""
}
```

Shared names, Fineli fields, nutrition, product links, and price information live in `ingredients/{catalogId}`. Firestore listeners subscribe to both collections; `hydrateRecipes` joins them for rendering. One ingredient edit therefore propagates to all recipes.

### Realtime synchronization

`onSnapshot` listeners keep recipes, shared ingredients, and the grocery cart synchronized between signed-in devices. Writes are performed through the same service abstraction used by local mode.

### Images

In cloud mode, `uploadImage` sends JPEG, PNG, or WebP files to Cloudinary's image upload endpoint using a restricted unsigned preset. Only the returned HTTPS URL is stored in the recipe document.

No Cloudinary API secret is exposed to the browser. The unsigned preset must be constrained in Cloudinary. Signed uploads require a trusted backend and are outside this minimal single-user architecture.

## Local mode

```text
Browser → Express REST API
              ├─ data/recipes.json
              ├─ data/ingredients.json
              ├─ data/shopping-cart.json
              ├─ uploads/
              └─ Fineli cache/proxy
```

The Express server serves the built SPA and falls back to `index.html` for unknown non-API paths, preserving direct route access and browser navigation locally.

## Routing

`src/hooks/useRoute.js` uses the native History API:

- `pushState` for ordinary navigation
- `replaceState` after save/delete redirects
- `popstate` for Back/Forward
- a safe fallback when a detail/edit URL was opened directly

Recipe pages use `/recipes/:id`; editor pages use `/recipes/:id/edit`.

Firebase Hosting contains a catch-all rewrite to `/index.html`, which is required for deep SPA routes.

## Fineli

Cloud mode uses `src/services/fineliBrowser.js`; local mode uses the existing server implementation and cache. The cloud adapter supports an optional `VITE_FINELI_PROXY_URL` for environments where direct browser requests are blocked. Matching is conservative and unresolved items remain flagged for review.

## Security boundaries

- Firebase web configuration and the shared email are client configuration, not passwords.
- The password is handled by Firebase Authentication and is never bundled into the application.
- Firestore rules are the actual database authorization boundary.
- `.env.local`, `.firebaserc`, Firebase service credentials, and Cloudinary secrets are excluded from Git.
- The Cloudinary unsigned preset is intentionally public and must have narrow restrictions.
