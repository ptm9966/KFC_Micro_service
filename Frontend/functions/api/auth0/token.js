function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid request body' }, 400);
  }

  const code = typeof body?.code === 'string' ? body.code : '';
  if (!code) return jsonResponse({ message: 'Authorization code is required' }, 400);
  const profile = body?.profile && typeof body.profile === 'object' ? body.profile : {};

  if (!env.AUTH0_DOMAIN || !env.AUTH0_CLIENT_ID || !env.AUTH0_CLIENT_SECRET) {
    return jsonResponse({ message: 'Auth0 token exchange is not configured' }, 503);
  }

  const origin = new URL(request.url).origin;
  const response = await fetch(`https://${env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: env.AUTH0_CLIENT_ID,
      client_secret: env.AUTH0_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/callback`,
    }),
  });

  if (!response.ok) {
    console.error('Auth0 token exchange failed:', response.status);
    return jsonResponse({ message: 'Unable to complete Auth0 login' }, 502);
  }

  const tokens = await response.json();
  let user = null;

  if (tokens.id_token) {
    try {
      user = JSON.parse(atob(tokens.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return jsonResponse({ message: 'Invalid Auth0 identity token' }, 502);
    }
  }

  if (!user?.sub || !user.email) {
    return jsonResponse({ message: 'Auth0 identity is missing an ID or email' }, 502);
  }

  if (!env.FIRESTORE_SYNC_URL || !env.FIRESTORE_SYNC_SECRET) {
    return jsonResponse({ message: 'Firestore sync is not configured' }, 503);
  }

  const syncResponse = await fetch(`${env.FIRESTORE_SYNC_URL}/sync-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Firestore-Sync-Secret': env.FIRESTORE_SYNC_SECRET,
    },
    body: JSON.stringify({
      auth0Id: user.sub,
      email: user.email,
      name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user.name || user.nickname || '',
      firstName: profile.firstName || user.given_name || '',
      lastName: profile.lastName || user.family_name || '',
      mobile: profile.mobile || user.phone_number || '',
      username: profile.username || user.nickname || '',
    }),
  });

  if (!syncResponse.ok) {
    console.error('Firestore user sync failed:', syncResponse.status);
    return jsonResponse({ message: 'Authentication succeeded, but user sync failed' }, 502);
  }

  return jsonResponse({
    id_token: tokens.id_token,
    user: {
      name: user?.name || user?.nickname || user?.email || 'Auth0 User',
      email: user?.email || '',
      sub: user?.sub || '',
    },
  });
}