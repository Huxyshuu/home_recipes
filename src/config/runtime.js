const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const firebaseConfigured = Boolean(
  firebaseConfig.apiKey
  && firebaseConfig.authDomain
  && firebaseConfig.projectId
  && firebaseConfig.appId,
);

export const runtimeConfig = {
  backend: env.VITE_DATA_BACKEND || (firebaseConfigured ? 'firebase' : 'local'),
  firebaseConfigured,
  firebase: firebaseConfig,
  sharedLoginEmail: env.VITE_FIREBASE_SHARED_EMAIL || '',
  cloudinary: {
    cloudName: env.VITE_CLOUDINARY_CLOUD_NAME || '',
    unsignedUploadPreset: env.VITE_CLOUDINARY_UNSIGNED_UPLOAD_PRESET || '',
  },
  fineliProxyUrl: (env.VITE_FINELI_PROXY_URL || '').replace(/\/$/, ''),
};

export function firebaseConfigurationError() {
  if (runtimeConfig.backend !== 'firebase') return '';
  const missing = [];
  if (!runtimeConfig.firebase.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!runtimeConfig.firebase.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!runtimeConfig.firebase.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!runtimeConfig.firebase.appId) missing.push('VITE_FIREBASE_APP_ID');
  if (!runtimeConfig.sharedLoginEmail) missing.push('VITE_FIREBASE_SHARED_EMAIL');
  return missing.length ? `Missing Firebase settings: ${missing.join(', ')}` : '';
}
