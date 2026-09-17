'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Auth0CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('Auth0 callback error:', error);
      router.replace('/login?error=auth0');
      return;
    }

    if (code) {
      const user = {
        name: 'Auth0 User',
        email: 'auth0-user@example.com',
      };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', code);
      window.dispatchEvent(new Event('user-session-change'));
      router.replace('/menu');
      return;
    }

    router.replace('/login');
  }, [router]);

  return (
    <main className="page-shell">
      <div className="auth-wrap">
        <div className="auth-card">
          <h1 className="page-title">Completing sign in...</h1>
          <p className="page-subtitle">You are being redirected back to the app.</p>
        </div>
      </div>
    </main>
  );
}
