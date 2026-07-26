# Firebase deployment checklist

Use this checklist after reading the main README.

## Firebase console

- [ ] Create a Firebase project.
- [ ] Register a Web app.
- [ ] Enable Authentication → Email/Password.
- [ ] Create one Home Recipes user.
- [ ] Copy that user's UID.
- [ ] Create Cloud Firestore.
- [ ] Choose a Firestore region suitable for your use.

## Repository

- [ ] Copy `.env.example` to `.env.local`.
- [ ] Fill all Firebase web configuration fields.
- [ ] Set `VITE_FIREBASE_SHARED_EMAIL` to the created user's email.
- [ ] Replace `REPLACE_WITH_FIREBASE_AUTH_UID` in `firestore.rules`.
- [ ] Copy `.firebaserc.example` to `.firebaserc`.
- [ ] Set the Firebase project ID in `.firebaserc`.
- [ ] Confirm `.env.local` and `.firebaserc` are not committed.

## Cloudinary

- [ ] Create a dedicated unsigned preset.
- [ ] Restrict file types to JPEG, PNG, and WebP.
- [ ] Restrict file size and folder/preset behavior.
- [ ] Put the cloud name and preset in `.env.local`.
- [ ] Never add an API secret to a `VITE_` variable.

## Validate

```bash
npm install
npm test
npm run build:cloud
firebase emulators:start --only hosting,firestore
```

Check login, seed creation, a recipe deep link, browser Back, ingredient propagation, cart synchronization, and image upload.

## Deploy

```bash
firebase login
npm run deploy:firebase
```

Open the provided Hosting URL, log in, and confirm `meta/bootstrap` plus recipe and ingredient collections in Firestore.

## Optional custom domain and GitHub automation

A Firebase Hosting custom domain can be connected from the Hosting console. After the first manual deployment, `firebase init hosting:github` can generate preview and production workflows for this repository.
