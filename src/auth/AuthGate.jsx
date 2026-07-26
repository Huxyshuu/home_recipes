import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { firebaseConfigurationError, runtimeConfig } from '../config/runtime';
import { getFirebaseClient } from '../services/firebaseClient';

const AuthContext = createContext({
  mode: 'local',
  user: null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function SetupError({ message }) {
  return (
    <main className="auth-page">
      <section className="auth-card panel">
        <span className="auth-mark"><Icon name="info" size={30} /></span>
        <span className="eyebrow">Cloud setup required</span>
        <h1>Cloud connection needs attention</h1>
        <p>{message}</p>
        <p className="auth-help">Copy <code>.env.example</code> to <code>.env.local</code>, add your Firebase web app values, and restart the development server.</p>
      </section>
    </main>
  );
}

function PasswordLogin({ onSignedIn }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError('');
    try {
      const { auth, authModule } = await getFirebaseClient();
      const credential = await authModule.signInWithEmailAndPassword(
        auth,
        runtimeConfig.sharedLoginEmail,
        password,
      );
      onSignedIn(credential.user);
    } catch (requestError) {
      if (requestError?.code === 'auth/network-request-failed') {
        setError('The login service could not be reached. Check the internet connection and try again.');
      } else if (requestError?.code === 'auth/too-many-requests') {
        setError('Firebase temporarily blocked repeated attempts. Wait a moment and try again.');
      } else {
        setError('The password was not accepted. Check it and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card panel">
        <span className="auth-mark"><Icon name="chef" size={30} /></span>
        <span className="eyebrow">Private kitchen</span>
        <h1>Open LettuceCook</h1>
        <p>Enter the shared password once. This device will stay signed in until you sign out, clear browser data, or the Firebase session is revoked.</p>
        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button button-primary" type="submit" disabled={submitting || !password}>
            <Icon name="shield" size={18} /> {submitting ? 'Opening…' : 'Open recipe book'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AuthGate({ children }) {
  const mode = runtimeConfig.backend;
  const [user, setUser] = useState(mode === 'local' ? { uid: 'local-user' } : null);
  const [loading, setLoading] = useState(mode === 'firebase');
  const [initialisationError, setInitialisationError] = useState('');
  const setupError = firebaseConfigurationError();

  useEffect(() => {
    if (mode !== 'firebase' || setupError) return undefined;
    let unsubscribe = () => {};
    let active = true;

    getFirebaseClient()
      .then(({ auth, authModule }) => {
        if (!active) return;
        unsubscribe = authModule.onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        });
      })
      .catch((requestError) => {
        if (!active) return;
        setInitialisationError(requestError?.message || 'Firebase could not be initialized.');
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [mode, setupError]);

  const value = useMemo(() => ({
    mode,
    user,
    logout: async () => {
      if (mode !== 'firebase') return;
      const { auth, authModule } = await getFirebaseClient();
      await authModule.signOut(auth);
    },
  }), [mode, user]);

  if (setupError) return <SetupError message={setupError} />;
  if (initialisationError) return <SetupError message={initialisationError} />;
  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-card panel auth-loading"><span className="spinner" /><p>Restoring this device’s session…</p></section>
      </main>
    );
  }
  if (mode === 'firebase' && !user) return <PasswordLogin onSignedIn={setUser} />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
