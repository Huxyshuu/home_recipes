# Validation report — v0.5.0

## Completed in the release workspace

- All project JavaScript and JSX files parsed successfully with the TypeScript transpiler parser.
- `node --test tests/*.test.js` passed: **23/23 tests**.
- The suite verifies:
  - 14 recipes remain present.
  - 47 shared ingredient definitions remain linked correctly.
  - Shared ingredient updates propagate through recipe hydration.
  - Recipe, retail, and nutrition data retain expected structure.
  - Firebase configuration and authentication modules exist.
  - Cloudinary upload support exists.
  - Public recipe routes and edit routes are parsed correctly.
  - Firebase Hosting contains the SPA rewrite needed for deep links.
  - Local JSON/Express mode remains available.

## Source review

- Firestore seed batch is below Firestore's per-batch write limit for the current data set.
- Firestore rules default to denying access until the single-user UID placeholder is replaced.
- Passwords are not stored in source or environment variables.
- Firebase authentication explicitly uses browser-local persistence.
- Cloudinary uploads enforce image MIME type and an 8 MB client-side limit.
- The local Express server already provides an SPA fallback for routed URLs.

## Build limitation in this workspace

A full fresh `npm install` and Vite production build could not be completed because the available package registry gateway returned service-unavailable/time-out responses while fetching dependencies. The old generated `dist` and stale v0.4.1 lock file were removed from the release so they cannot be mistaken for a validated v0.5.0 build.

Before deployment, run:

```bash
npm install
npm test
npm run build:cloud
```

Then test at minimum:

1. First password login creates the Firestore seed.
2. Reloading and restarting the browser does not ask for the password again.
3. Signing out does ask again.
4. Opening `/recipes/<existing-id>` directly loads the correct recipe.
5. Back and Forward restore the previous app views.
6. Editing one shared ingredient updates all recipes that use it.
7. Uploading a recipe image returns a Cloudinary HTTPS URL.
8. A second device receives recipe and grocery-cart updates.
9. An unauthenticated Firestore request is denied.
10. `npm run lan` still serves the local JSON version.
