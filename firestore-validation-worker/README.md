# Firestore Validation Worker

Cloudflare Worker that reads users from a Google Cloud Firestore collection and validates whether a user exists by document ID or email.

## Endpoints

- `GET /health`
- `POST /validate` with `{ "userId": "..." }` or `{ "email": "user@example.com" }`

A successful validation response has this shape:

```json
{
  "valid": true,
  "user": {
    "id": "firestore-document-id",
    "email": "user@example.com"
  }
}
```

The Worker does not return credential fields intentionally. Store passwords and private authentication material outside the user document projection, or add an explicit allowlist if more fields are required.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.dev.vars.example` to `.dev.vars` and provide a Google service account with Firestore read access.

3. Start locally:

   ```bash
   npm run dev
   ```

4. Test it:

   ```bash
   curl http://localhost:8787/health
   curl -X POST http://localhost:8787/validate -H "Content-Type: application/json" -d '{"email":"user@example.com"}'
   ```

## Deploy

Create encrypted secrets before deployment:

```bash
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put FIREBASE_CLIENT_EMAIL
npx wrangler secret put FIREBASE_PRIVATE_KEY
npx wrangler secret put FIRESTORE_SYNC_SECRET
npm run deploy
```

Set the same `FIRESTORE_SYNC_SECRET` as a server-only Cloudflare Pages environment variable. After Auth0 code exchange, the Pages Function calls `/sync-user` and the Worker upserts the authenticated user's Auth0 ID, email, name, and update time into the `users` collection.

The service account needs the `Cloud Datastore User` role, or another role that grants Firestore document reads. Set `CORS_ORIGIN` to the real frontend origin before production use.
