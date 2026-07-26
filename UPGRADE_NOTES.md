# Upgrade notes — LettuceCook v0.6.0

## Rebrand and data compatibility

The application is now named **LettuceCook**. Existing Firestore collections, recipe IDs, ingredient IDs, retailer records, Cloudinary image URLs, and local JSON files remain compatible and are not renamed or deleted.

Browser cooking-progress keys now use the `lettucecook-progress-` prefix. Old `home-recipes-progress-` entries are intentionally left untouched; they contain only temporary checkbox progress and can be removed through browser site-data settings.

## Mobile navigation

On screens up to 760 px wide, the desktop navigation is replaced by a fixed bottom toolbar. Recipes, Routine, Ingredients, and Cart are always visible. Guide, Swaps, Stats, Add recipe, and Sign out are available through More.

## No destructive local migration

The existing `data/recipes.json`, `data/ingredients.json`, `data/shopping-cart.json`, and local uploads remain usable. `npm run dev` and `npm run lan` deliberately force local mode.

## Moving the current data into Firestore

1. Configure Firebase and Cloudinary as described in `README.md`.
2. Replace the UID placeholder in `firestore.rules`.
3. Deploy with `npm run deploy:firebase`.
4. Log in once.

When `meta/bootstrap` is absent, the application uploads the bundled seed data to Firestore in one batch. It does not seed again after the marker exists.

If you already created Firestore documents manually, create `meta/bootstrap` before opening the app or review the automatic import behavior first.

## Authentication model

The UI asks only for a password, but the implementation uses one Firebase Email/Password user whose email is set in `VITE_FIREBASE_SHARED_EMAIL`. Existing users must create this account in Firebase Authentication; the application does not create accounts or expose registration.

The session is persisted locally per browser/device. Signing out or clearing browser site data removes that remembered login.

## Security-rule action required

Change this value before deployment:

```text
REPLACE_WITH_FIREBASE_AUTH_UID
```

Use the exact UID from Firebase Authentication. Leaving the placeholder prevents all cloud database access, which is safer than accidentally making the database public.

## Images

Existing local SVG and `/uploads/...` references continue to work locally. New uploads in Firebase mode use Cloudinary. To make an old local upload public, upload it again through the recipe editor or move it to Cloudinary and update the recipe URL.

## Lock file

The release archive omits the older `package-lock.json` because it does not contain the new Firebase dependency. Run `npm install` once and commit the newly generated lock file before using `npm ci` or automated deployment.
