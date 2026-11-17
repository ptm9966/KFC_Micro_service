'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const USERS_API_BASE_URL = process.env.NEXT_PUBLIC_USERS_API_URL || 'http://localhost:8082';
const FIRESTORE_VALIDATION_URL = process.env.NEXT_PUBLIC_FIRESTORE_VALIDATION_URL || '';
const AUTH0_DOMAIN = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '';
const EMAIL_AUTH_ENABLED = Boolean(FIRESTORE_VALIDATION_URL && AUTH0_DOMAIN && AUTH0_CLIENT_ID);
const AUTH0_CONNECTION = process.env.NEXT_PUBLIC_AUTH0_CONNECTION || '';
const getAuth0CallbackUrl = () =>
  process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/callback` : 'http://localhost:3000/callback');

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(!EMAIL_AUTH_ENABLED);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailFromQuery = params.get('email');
      const authErrorDescription = params.get('error_description');
      setShowCredentials(!EMAIL_AUTH_ENABLED || params.get('step') === 'credentials');
      setAuthError(authErrorDescription || '');
      if (emailFromQuery) setEmail(emailFromQuery);

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        router.replace('/menu');
      }
    }
  }, [router]);

  const handleAuth0Login = () => {
    redirectToAuth0('login');
  };

  const redirectToAuth0 = (mode, submittedEmail = '') => {
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
      throw new Error('Auth0 is not configured');
    }

    const authUrl = new URL(`https://${AUTH0_DOMAIN}/authorize`);
    authUrl.searchParams.set('client_id', AUTH0_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', getAuth0CallbackUrl());
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('screen_hint', mode);
    if (submittedEmail) {
      const normalizedEmail = submittedEmail.trim().toLowerCase();
      if (mode === 'signup') {
        authUrl.searchParams.set('ext-email', normalizedEmail);
      } else {
        authUrl.searchParams.set('login_hint', normalizedEmail);
      }
    }
    if (AUTH0_CONNECTION) authUrl.searchParams.set('connection', AUTH0_CONNECTION);
    window.location.assign(authUrl.toString());
  };

  const continueWithEmail = (event) => {
    event.preventDefault();
    checkUserAccount(email);
  };

  const checkUserAccount = async (submittedEmail) => {
    try {
      setLoading(true);
      const response = await fetch(`${FIRESTORE_VALIDATION_URL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: submittedEmail }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to check account');

      if (data.valid) {
        redirectToAuth0('login', submittedEmail);
      } else {
        redirectToAuth0('signup', submittedEmail);
      }
    } catch (error) {
      console.error('Firestore email check failed:', error);
      alert(error.message === 'Auth0 is not configured'
        ? 'Auth0 is not configured. Please check the frontend environment variables.'
        : 'Unable to check your account right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  async function loginUser(event) {
    event.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(`${USERS_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Please check mobile number or password');
        return;
      }

      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || { name: 'KFC User' }));
        window.dispatchEvent(new Event('user-session-change'));
        router.replace('/menu');
      } else {
        alert('Please check mobile number or password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Please signup first');
      router.push('/signup');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="rewards-login-page">
      <div className="rewards-login-brand">
        <Link href="/" aria-label="KFC home"><span className="brand-mark">KFC</span><span className="brand-name">King of Good Food</span></Link>
        <Link href="/" className="rewards-close" aria-label="Close sign in">×</Link>
      </div>
      <div className="rewards-login-overlay">
        <section className="rewards-login-card">
          {authError && (
            <p className="rewards-helper" role="alert">
              Auth0 could not complete authentication: {authError}
              {authError.toLowerCase().includes('create script') && (
                <> Enable the Create script in the Auth0 Database connection settings.</>
              )}
            </p>
          )}
          {showCredentials ? (
            <>
              <p className="rewards-kicker">KFC Rewards</p>
              <h1>Sign in to your account</h1>
              <form className="rewards-form" onSubmit={loginUser}>
                <label htmlFor="login-mobile">Mobile number <span>*</span></label>
                <input id="login-mobile" className="text-input" placeholder="Enter mobile number" value={mobile} onChange={(event) => setMobile(event.target.value)} required />
                <label htmlFor="login-password">Password <span>*</span></label>
                <input id="login-password" className="text-input" type="password" placeholder="Enter password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <p className="rewards-helper">Signing in as {email}</p>
                <button className="primary-btn rewards-submit" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
              <p className="rewards-help"><Link href="/login">Use a different email</Link></p>
              <p className="rewards-help">Don&apos;t have an account? <Link href="/signup">Sign up</Link></p>
            </>
          ) : (
            <>
              <p className="rewards-kicker">KFC Rewards</p>
              <h1>Join to get exclusive rewards</h1>
              <form className="rewards-form" onSubmit={continueWithEmail}>
                <label htmlFor="rewards-email">Email <span>*</span></label>
                <input id="rewards-email" className="text-input" type="email" placeholder="Enter email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <p className="rewards-helper">We&apos;ll check for an existing account and guide you next.</p>
                <button className="primary-btn rewards-submit" type="submit" disabled={loading}>
                  {loading ? 'Checking...' : 'Continue'}
                </button>
              </form>
              <p className="rewards-legal">By continuing, I agree to KFC&apos;s <u>Terms of Use</u> and <u>Privacy Policy</u>.</p>
              <p className="rewards-help"><Link href="/signup">Need help with sign-in/sign-up?</Link></p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
