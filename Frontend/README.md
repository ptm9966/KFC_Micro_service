# KFC Frontend

This folder contains the Next.js storefront, built as static files for Cloudflare Pages. Cloudflare Pages Functions in `functions/` provide server-side Auth0 endpoints.

## Signup and Auth0 Flow

The email-first signup flow is:

1. The user opens `/login` and submits an email. `app/login/page.js` sends it to the Firestore Worker at `NEXT_PUBLIC_FIRESTORE_VALIDATION_URL/validate`.
2. The Worker in `../firestore-validation-worker/src/index.js` looks for that email in the Firestore `users` collection. If found, the frontend starts Auth0 login. If not found, it starts Auth0 signup by redirecting to `/authorize` with `screen_hint=signup`.
3. Auth0 displays its hosted signup screens. The custom screen source in `public/auth0-acul/` is intended for Auth0 Universal Login/ACUL configuration; these files are not Next.js routes and are not automatically used just because they are in `public/`.
4. The signup screen template is `public/auth0-acul/signup-id/index.html`, which loads `public/auth0-acul/assets/acul.js`. That script collects the signup profile and passes it to Auth0's ACUL signup manager. The password screen template is `public/auth0-acul/signup-password/index.html` and also loads `assets/acul.js`.
5. After Auth0 completes, it redirects to `/callback`. `app/callback/page.js` posts the authorization code to `/api/auth0/token`.
6. `functions/api/auth0/token.js` exchanges the code with Auth0, then sends the identity and available profile fields to the Worker's `/sync-user` endpoint. The Worker upserts the record in Firestore using the Auth0 subject as its document ID.

**Auth0 custom screen setup:** configure the Auth0 Universal Login/ACUL screens to use the templates and scripts in `public/auth0-acul/`. For deployment, ensure those static assets are available at the URLs referenced by the configured Auth0 screens. The `public/auth0-acul/signup-id.js` file is an alternate signup script; the checked-in `signup-id/index.html` currently loads `assets/acul.js`, not `signup-id.js`.

**Email prefill check:** `app/login/page.js` sends a new email in the `ext-email` parameter, while the currently referenced `assets/acul.js` reads `login_hint` when pre-filling its profile form. Check this parameter mapping in the Auth0 custom screen configuration/script if the email is blank on Auth0's signup screen.

The local `app/auth0-signup/page.js` is a separate profile form and is not the page reached by the `/login` email-first redirect. The regular `app/signup/page.js` is another separate flow: it posts credentials to the users microservice and does not use this Auth0-to-Firestore signup path.

If `NEXT_PUBLIC_AUTH0_DOMAIN`, `NEXT_PUBLIC_AUTH0_CLIENT_ID`, or `NEXT_PUBLIC_FIRESTORE_VALIDATION_URL` is missing, `/login` skips the email validation step and shows the regular mobile/password login form. `/signup` continues to use the users-service registration form; its Auth0 signup option is shown only when the Auth0 domain and client ID are configured.

===================== ******************** ======================= *********==================


## Requirements

- Node.js 20 or newer
- npm 10 or newer

Run all commands in this guide from `KFC_Micro_service/Frontend`.

## Local Setup

In PowerShell, from the repository root:

```powershell
Set-Location .\Frontend
npm install --legacy-peer-deps
Copy-Item .env.example .env
```

Edit `.env` and set the variables described below. Keep `.env` private; do not commit credentials.

### Next.js Development Server

```powershell
npm run dev
```

Open `http://localhost:3000`. This is useful for developing Next.js pages, but it does not run Cloudflare Pages Functions. The Auth0 callback endpoint at `/api/auth0/token` therefore will not be available in this mode.

### Cloudflare Pages Local Runtime

Use this to test the static export together with Pages Functions:

```powershell
npm run build
npx wrangler pages dev ./out --port 8788
```

Open `http://localhost:8788`. Wrangler serves the generated `out/` site and discovers the `functions/` directory. Stop the server with `Ctrl+C`.

## Environment Variables

### Next.js and Contentful

These values are read during the Next.js build. Set them in `.env` before running `npm run build`.

| Variable | Purpose |
| --- | --- |
| `CONTENTFUL_SPACE_ID` | Contentful space containing the menu |
| `CONTENTFUL_ACCESS_TOKEN` | Token used to fetch menu content during build |
| `CONTENTFUL_ENVIRONMENT` | Contentful environment; defaults to `master` |
| `CONTENTFUL_MENU_CONTENT_TYPE` | Menu content type ID; defaults to `menuItem` |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 tenant or custom-domain hostname, without `https://` |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Auth0 application client ID; safe to include in browser code |
| `NEXT_PUBLIC_AUTH0_CALLBACK_URL` | Optional callback URL; otherwise the current site origin plus `/callback` is used |
| `NEXT_PUBLIC_AUTH0_CONNECTION` | Optional Auth0 connection name |
| `NEXT_PUBLIC_FIRESTORE_VALIDATION_URL` | Worker base URL used by the login email check |
| `NEXT_PUBLIC_USERS_API_URL` | Optional users service URL for password-based login/signup |

Use a **Content Delivery API (CDA) read token** for published content. The menu is fetched during the build, so changes in Contentful require a new build and deployment. Do not put Contentful management or preview tokens in `NEXT_PUBLIC_*` variables.

### Cloudflare Pages Function Bindings

Auth0 function secrets are server-side bindings, not `NEXT_PUBLIC_*` variables. For local Wrangler use, create `Frontend/.dev.vars` with the following keys and your own values:

```dotenv
AUTH0_DOMAIN=your-auth0-domain
AUTH0_CLIENT_ID=your-auth0-application-client-id
AUTH0_CLIENT_SECRET=your-auth0-application-client-secret
AUTH0_MGMT_CLIENT_ID=your-auth0-management-client-id
AUTH0_MGMT_CLIENT_SECRET=your-auth0-management-client-secret
FIRESTORE_SYNC_URL=https://your-worker.example.workers.dev
FIRESTORE_SYNC_SECRET=your-shared-sync-secret
```

Do not commit `.dev.vars`. In Cloudflare Pages project settings, add the same required values as environment variables/secrets for the appropriate deployment environments. `AUTH0_DOMAIN` in `wrangler.toml` is a non-secret local/default variable; set the production value in Cloudflare if it differs.

The token endpoint exchanges the authorization code and syncs the profile to the Firestore Worker. The email check in the login page calls the configured validation Worker directly. The Worker must be running and configured with the matching sync secret for those flows to work.

### Auth0 Dashboard Setup

Configure the Auth0 application used by this frontend:

- Set the application domain and client ID in `.env` using `NEXT_PUBLIC_AUTH0_DOMAIN` and `NEXT_PUBLIC_AUTH0_CLIENT_ID`.
- Add `http://localhost:3000/callback` and `http://localhost:8788/callback` to **Allowed Callback URLs** for the local server modes you use.
- Add the matching local origins to **Allowed Web Origins**. Add the deployed site origin and callback URL for production.
- The `/api/auth0/token` Pages Function requires the Auth0 application client secret. Store it in `.dev.vars` locally and in Cloudflare Pages secrets for deployment.
- The `/api/auth0/check-email` Pages Function requires a separate Machine-to-Machine application authorized for the Auth0 Management API with permission to read users (for example, `read:users`). Keep its client ID and secret server-side.
- If using Auth0's `firebase-database` connection, set `NEXT_PUBLIC_AUTH0_CONNECTION` to that connection name and ensure the connection is enabled for the Auth0 application.

After changing any `NEXT_PUBLIC_*` setting, rebuild the app because these values are embedded into the generated frontend bundle.

## Useful Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js development server on port 3000 |
| `npm run build` | Build and statically export the site |
| `npx wrangler pages dev ./out --port 8788` | Serve the export and Cloudflare Pages Functions locally |
| `npm test` | Run the configured test placeholder (no frontend unit suite is currently set up) |

## Folder Guide

| Path | Purpose |
| --- | --- |
| `app/` | Next.js routes and page UI: home, menu, login, signup, callback, cart, and checkout |
| `components/` | Shared frontend components such as the site shell |
| `functions/api/auth0/` | Cloudflare Pages Function endpoints for Auth0 code exchange and email lookup |
| `lib/contentful.js` | Contentful menu/category fetching and data normalization during build |
| `public/` | Static images, icons, and other assets copied to the site |
| `wrangler.toml` | Cloudflare Pages project name, build output directory, compatibility date, and local variables |
| `.env.example` | Template for frontend/build-time configuration; copy to `.env` |
| `.dev.vars` | Local-only Cloudflare Function secrets; create locally and never commit |
| `.next/`, `out/`, `node_modules/` | Generated build output and installed dependencies; do not edit or commit |

The old Create React App source and Docker/Nginx packaging files have been removed. The active frontend is the Next.js application in `app/`.