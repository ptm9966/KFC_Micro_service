'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Auth0CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      console.error('Auth0 callback error:', error, errorDescription);
      const query = new URLSearchParams({ error: 'auth0', reason: error });
      if (errorDescription) query.set('error_description', errorDescription);
      router.replace(`/login?${query.toString()}`);
      return;
    }

    if (code) {
      const exchangeCode = async () => {
        let pendingProfile = null;
        try {
          pendingProfile = JSON.parse(sessionStorage.getItem('pending-auth0-profile') || 'null');
        } catch {
          pendingProfile = null;
        }

        const exchangeResponse = await fetch('/api/auth0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, profile: pendingProfile }),
        });

        const rawText = await exchangeResponse.text();
        let session = {};

        if (rawText) {
          try {
            session = JSON.parse(rawText);
          } catch (parseError) {
            console.error('Auth0 callback received non-JSON response:', rawText, parseError);
            const query = new URLSearchParams({
              error: 'auth0-token',
              error_description: exchangeResponse.status === 405
                ? 'The callback API route is not available in the current deployment. The app is configured for a static export but the Auth0 token exchange requires a server-side endpoint.'
                : rawText || 'Auth0 token exchange returned an invalid response.',
            });
            router.replace(`/login?${query.toString()}`);
            return;
          }
        }

        if (!exchangeResponse.ok || !session.id_token) {
          console.error('Auth0 code exchange failed:', {
            status: exchangeResponse.status,
            session,
            rawText,
          });
          const query = new URLSearchParams({
            error: 'auth0-token',
            error_description: session?.message || rawText || `Auth0 token exchange failed with status ${exchangeResponse.status}.`,
          });
          router.replace(`/login?${query.toString()}`);
          return;
        }

        try {
          sessionStorage.removeItem('pending-auth0-profile');
        } catch {
          // Storage may be unavailable after the Auth0 redirect.
        }

        localStorage.setItem('user', JSON.stringify({ ...session.user, ...pendingProfile }));
        localStorage.setItem('id_token', session.id_token);
        localStorage.setItem('token', session.id_token);
        localStorage.setItem('auth_token', session.id_token);
        window.dispatchEvent(new Event('user-session-change'));
        router.replace('/menu');
      };

      exchangeCode().catch((exchangeError) => {
        console.error('Auth0 callback failed:', exchangeError);
        router.replace('/login?error=auth0-token');
      });
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
