'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const USERS_API_BASE_URL = process.env.NEXT_PUBLIC_USERS_API_URL || 'http://localhost:8082';
const AUTH0_DOMAIN = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '';
const AUTH0_ENABLED = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID);
const getAuth0CallbackUrl = () =>
  process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/callback` : 'http://localhost:3000/callback');

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailFromQuery = new URLSearchParams(window.location.search).get('email');
    if (emailFromQuery) setEmail(emailFromQuery);
  }, []);

  const handleAuth0Signup = () => {
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
      alert('Auth0 is not configured yet. Add NEXT_PUBLIC_AUTH0_DOMAIN and NEXT_PUBLIC_AUTH0_CLIENT_ID to your frontend environment.');
      return;
    }

    const authUrl = new URL(`https://${AUTH0_DOMAIN}/authorize`);
    authUrl.searchParams.set('client_id', AUTH0_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', getAuth0CallbackUrl());
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('screen_hint', 'signup');
    window.location.href = authUrl.toString();
  };

  async function registerUser(event) {
    event.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(`${USERS_API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Signup failed');
        return;
      }

      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || { name }));
        window.dispatchEvent(new Event('user-session-change'));
      }

      alert(data.message || 'Signup successful');
      router.replace('/login');
    } catch (error) {
      console.error('Signup failed:', error);
      alert('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="auth-wrap">
        <div className="auth-card">
          <h1 className="page-title" style={{ marginBottom: 8 }}>Create an Account</h1>
          <p className="page-subtitle">Join today and enjoy order tracking and exclusive deals.</p>

          <form className="auth-form" onSubmit={registerUser}>
            <input
              className="text-input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="text-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="text-input"
              placeholder="Mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
            <input
              className="text-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            {AUTH0_ENABLED && (
              <button className="secondary-btn" type="button" onClick={handleAuth0Signup}>
                Continue with Auth0
              </button>
            )}
          </form>

          <p style={{ marginTop: 18 }}>
            Already a member?{' '}
            <Link href="/login" className="auth-link">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
