# Home Recipes

Home Recipes is a cloud-first personal recipe book for the Finnish meal plan in this repository. The main deployment uses **Firebase Hosting**, **Firebase Authentication**, **Cloud Firestore**, and **Cloudinary**, so the same recipes, shared ingredients, grocery cart, nutrition data, prices, and images are available from a phone or computer anywhere with internet access.

The original local JSON/Express mode remains available for development, offline work, and use on a home network.

## What version 0.5.0 adds

- A public Firebase-hosted single-page application.
- Password-only login screen backed by one Firebase Email/Password account.
- Persistent login on each device through Firebase local authentication persistence.
- Cloud Firestore as the primary recipe, ingredient, and cart database.
- Real-time updates between signed-in devices.
- Cloudinary image uploads in cloud mode.
- Direct URL routes for every recipe, for example `/recipes/mealplan-protein-overnight-oats`.
- Normal browser history: links, refresh, deep links, and the Back button work as expected.
- Automatic first-login import of the repository's 14 recipes, 47 shared ingredients, and current grocery cart.
- The complete local Express/JSON backend is retained.

## Cloud and local architecture

| Concern | Public cloud mode | Local mode |
|---|---|---|
| Website | Firebase Hosting | Express serves the Vite build |
| Authentication | Firebase Email/Password | None |
| Recipes | Firestore `recipes` collection | `data/recipes.json` |
| Shared ingredients | Firestore `ingredients` collection | `data/ingredients.json` |
| Grocery cart | Firestore `appState/sharedCart` | `data/shopping-cart.json` |
| Recipe images | Cloudinary | `uploads/` |
| Live updates | Firestore listeners | Local API refresh |
| Fineli | Browser request or optional proxy | Local server cache/proxy |

The central ingredient library remains the source of truth. A recipe stores only the ingredient reference, amount, unit, gram weight, and recipe-specific preparation note. Updating nutrition, retailer links, or price for one shared ingredient updates every recipe that uses it.

## Public deployment setup

### 1. Install the project

Requirements: Node.js 18.18 or newer.

```bash
npm install
npm test
```

The repository intentionally does not include a generated lock file in the release archive. The first `npm install` generates one for the environment that installs the Firebase dependency.

### 2. Create the Firebase project

In the Firebase console:

1. Create a project.
2. Open **Authentication → Sign-in method** and enable **Email/Password**.
3. Open **Authentication → Users** and create exactly one user, such as `home-recipes@example.com`, with the password you want to type in the app.
4. Copy that user's Firebase **UID**.
5. Open `firestore.rules` and replace `REPLACE_WITH_FIREBASE_AUTH_UID` with the copied UID.
6. Create a Cloud Firestore database.
7. Add a Web app in **Project settings → Your apps** and copy its configuration values.

The app never stores the password in source code or an environment file. The email address is configured in the frontend, while Firebase verifies the password.

### 3. Configure the environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```dotenv
VITE_DATA_BACKEND=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_SHARED_EMAIL=home-recipes@example.com

VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UNSIGNED_UPLOAD_PRESET=...
VITE_FINELI_PROXY_URL=
```

Do not commit `.env.local`.

### 4. Configure Cloudinary

Create an **unsigned upload preset** in Cloudinary and put its name in `.env.local`. Restrict the preset to the Home Recipes use case:

- Accept only JPEG, PNG, and WebP.
- Set a sensible maximum file size; the app also enforces 8 MB.
- Restrict uploads to a dedicated folder or preset policy.
- Do not put a Cloudinary API secret in the browser application.

Unsigned uploads are convenient for a small private app, but the preset identifier is visible in the built frontend. For a larger multi-user service, replace this with signed uploads through a trusted backend or serverless function.

### 5. Select the Firebase project

Install and authenticate the Firebase CLI:

```bash
npm install --global firebase-tools
firebase login
cp .firebaserc.example .firebaserc
```

Edit `.firebaserc` and replace `YOUR_FIREBASE_PROJECT_ID`.

### 6. Deploy

```bash
npm run deploy:firebase
```

This performs a production Vite build and deploys Hosting, Firestore rules, and indexes. Firebase Hosting rewrites every route to `index.html`, so direct links such as `/recipes/<id>` continue working after refresh.

The first successful login initializes an empty Firestore database from the repository data. It creates:

- 14 recipe documents
- 47 shared ingredient documents
- the current shared grocery cart
- `meta/bootstrap`, which prevents duplicate seeding

After that first import, Firestore is the cloud source of truth. Editing the JSON seed files does not overwrite an already initialized cloud database.

## Password and remembered login

The login screen asks only for the shared password. Internally, it signs into the single email account configured through `VITE_FIREBASE_SHARED_EMAIL`.

Firebase authentication persistence is explicitly set to browser-local storage. Therefore, the password is normally requested once per browser profile/device. Login is requested again after signing out, clearing site data, using private browsing, revoking the session, or deleting the Firebase user.

Use the **Sign out** control in the header on a shared or lost device.

## URL routes

| URL | View |
|---|---|
| `/` | Recipe library |
| `/recipes/:id` | Recipe detail |
| `/recipes/:id/edit` | Recipe editor |
| `/recipes/new` | New recipe |
| `/routine` | Seven-day routine |
| `/ingredients` | Shared ingredient library |
| `/guide` | Nutrition and Fineli tools |
| `/substitutions` | Ingredient substitutions |
| `/cart` | Grocery cart |
| `/stats` | Statistics |

Routing uses the browser History API. Opening a recipe creates a history entry, closing it returns to the previous page when possible, and the browser Back/Forward buttons follow the user's actual path through the app.

## Running locally

### Local JSON development mode

```bash
npm run dev
```

This starts:

- Vite on `http://localhost:5173`
- Express API on `http://localhost:8787`

`npm run dev` is an alias for `npm run dev:local`, which forces the local backend even when `.env.local` contains Firebase settings.

### Test the cloud frontend locally

With Firebase values in `.env.local`:

```bash
npm run dev:cloud
```

This uses the real Firebase project and Cloudinary configuration while serving the frontend from Vite.

### Production-style local/LAN mode

```bash
npm run lan
```

Then open:

```text
http://localhost:8787
```

Another device on the same network can use `http://<computer-LAN-IP>:8787`. The local server has an SPA fallback, so routed recipe URLs work there too.

### Build commands

```bash
npm run build:cloud
npm run build:local
```

`build:cloud` uses `.env.local` and Firebase. `build:local` uses `.env.lan`, which explicitly selects the JSON backend.

## Firestore security

The included rules deny all access unless the request is authenticated as the exact UID entered in `firestore.rules`:

```text
request.auth.uid == '<your single Home Recipes user UID>'
```

Do not deploy the placeholder rule unchanged. Firebase Authentication alone is not a substitute for Firestore rules.

## Fineli notes

The existing ingredient records keep their Finnish search terms, Fineli IDs, measures, nutrition values, source status, and synchronization timestamps.

- Local mode uses the Express Fineli integration and cache.
- Cloud mode can call Fineli from the browser.
- If the browser is blocked by CORS or a network policy, set `VITE_FINELI_PROXY_URL` to a compatible HTTPS proxy based on the existing Home Recipes nutrition endpoints.
- A bulk sync reports unresolved ingredients rather than silently assigning an uncertain match.

Nutrition and retailer prices remain snapshots and should be reviewed when exact label-level accuracy matters.

## Data model

```text
recipes/{recipeId}
  ingredient usages: catalogId, quantity, unit, grams, recipe note

ingredients/{ingredientId}
  shared names, Fineli data, nutrition, retailer URLs, selected price

appState/sharedCart
  shared grocery cart

meta/bootstrap
  cloud database initialization marker
```

Recipe documents do not duplicate shared ingredient nutrition or price records. The frontend joins recipes and ingredients in real time.

## Tests

```bash
npm test
```

The suite checks recipe integrity, shared ingredient links and propagation, retail data, nutrition behavior, routing, Firebase architecture, Cloudinary upload support, Firebase Hosting rewrites, and preservation of local mode.

## Updating the GitHub repository

After reviewing the release:

```bash
git checkout -b firebase-cloud-v0.5.0
git add .
git commit -m "Add Firebase cloud deployment, persistent auth and URL routing"
git push -u origin firebase-cloud-v0.5.0
```

Deploy from that branch manually with `npm run deploy:firebase`. For automated GitHub deployments, run `firebase init hosting:github` after the first manual deployment and follow Firebase's prompts to add the repository secret and generated workflow.

## Attribution

Fineli data is provided by the Finnish Institute for Health and Welfare under CC BY 4.0. Fineli is a registered trademark of THL. See `docs/DATA_SOURCES.md` for recipe, nutrition, and retail-data provenance.
