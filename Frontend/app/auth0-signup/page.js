'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const AUTH0_DOMAIN = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'dev-6l85tc0ex15xt2oe.us.auth0.com';
const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'YrM6Y9CEDia7lM1b5UBZJJdD0IY97iDE';
const AUTH0_CONNECTION = process.env.NEXT_PUBLIC_AUTH0_CONNECTION || '';

function getAuth0CallbackUrl() {
  return process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL || `${window.location.origin}/callback`;
}

export default function Auth0SignupPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('signup');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextEmail = params.get('email') || '';
    const nextMode = params.get('mode') || 'signup';

    setEmail(nextEmail);
    setMode(nextMode);
  }, []);

  const handleSignup = () => {
    if (mode === 'signup') {
      sessionStorage.setItem('pending-auth0-profile', JSON.stringify({
        firstName,
        lastName,
        mobile,
        username,
        email,
      }));
    }

    const authUrl = new URL(`https://${AUTH0_DOMAIN}/authorize`);
    authUrl.searchParams.set('client_id', AUTH0_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', getAuth0CallbackUrl());
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('screen_hint', mode === 'login' ? 'login' : 'signup');
    if (email) authUrl.searchParams.set('login_hint', email);
    if (AUTH0_CONNECTION) authUrl.searchParams.set('connection', AUTH0_CONNECTION);
    window.location.href = authUrl.toString();
  };

  return (
    <main className="rewards-login-page account-setup-page">
      <div className="rewards-login-brand setup-brand">
        <Link href="/login" className="setup-back">‹ Back</Link>
        <Link href="/" aria-label="KFC home"><span className="brand-mark">KFC</span><span className="brand-name">King of Good Food</span></Link>
        <Link href="/" className="rewards-close" aria-label="Close sign up">×</Link>
      </div>
      {mode === 'signup' && <div className="setup-progress"><span className="active">1</span><i /><span>2</span><div><small>Profile</small><small>Verify</small></div></div>}
      <section className="account-setup-card">
        <p className="rewards-kicker">KFC Rewards</p>
        <h1>{mode === 'login' ? 'Sign in to your account' : 'Set up your account'}</h1>
        <form className="rewards-form" onSubmit={(event) => { event.preventDefault(); handleSignup(); }}>
          {mode === 'signup' && <>
            <label htmlFor="setup-first-name">First name <span>*</span></label>
            <input id="setup-first-name" className="text-input" placeholder="Enter first name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
            <label htmlFor="setup-last-name">Last name <span>*</span></label>
            <input id="setup-last-name" className="text-input" placeholder="Enter last name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          </>}
          <label htmlFor="setup-email">Email <span>*</span></label>
          <input id="setup-email" className="text-input setup-readonly" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter email" required />
          {mode === 'signup' && <>
            <label htmlFor="setup-mobile">Mobile number <span>*</span></label>
            <input id="setup-mobile" className="text-input" placeholder="Enter your mobile number" value={mobile} onChange={(event) => setMobile(event.target.value)} required />
            <label htmlFor="setup-username">Username <span>*</span></label>
            <input id="setup-username" className="text-input" placeholder="Choose a username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          </>}
          <button className="primary-btn rewards-submit" type="submit">Continue to Auth0</button>
        </form>
        <p className="rewards-legal">By continuing, I agree to KFC&apos;s <u>Terms of Use</u> and <u>Privacy Policy</u>.</p>
      </section>
    </main>
  );
}