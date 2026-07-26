import { runtimeConfig } from '../config/runtime';

let clientPromise = null;

export async function getFirebaseClient() {
  if (clientPromise) return clientPromise;

  clientPromise = Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]).then(async ([appModule, authModule, firestoreModule]) => {
    const app = appModule.getApps().length
      ? appModule.getApp()
      : appModule.initializeApp(runtimeConfig.firebase);
    const auth = authModule.getAuth(app);
    await authModule.setPersistence(auth, authModule.browserLocalPersistence);
    const db = firestoreModule.getFirestore(app);

    return {
      app,
      auth,
      db,
      authModule,
      firestoreModule,
    };
  });

  return clientPromise;
}
