# Secrets checklist for the new Lovable account

## 1. You paste only one secret: RESEND_API_KEY

- Where to get it: resend.com, sign in, API Keys, Create API Key with sending permission.
- Format: starts with `re_`.
- Used by: the feedback email sender, which emails submitted feedback to pydikalvasrikanth@gmail.com.
- Note: sending from `onboarding@resend.dev` only delivers to the Resend account owner. To email other people, verify a domain in Resend and send from it.

That is the key the new agent is asking for. Nothing else needs to be typed in by hand.

## 2. Auto-provisioned — do not paste, do not copy from this project

- `LOVABLE_API_KEY` — created automatically when Cloud is enabled on the new project. Powers all AI calls and the email queue.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

Copying the old values across would point the new app at the old database. Let the new project generate its own.

## 3. Google sign-in: reuse your own OAuth client

Keeping your own client keeps "Lovable" off the consent screen, matching the current setup.

- In Google Cloud Console, Credentials, your existing OAuth 2.0 Web client, copy the client ID and client secret.
- Add these to the new account's Auth Settings, Google provider: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- In Google Cloud Console, add as authorized redirect URIs: the callback URL shown in the new account's Google provider settings, plus the new preview and published origins.
- Add the new domains under Authorized domains on the consent screen.

## 4. Not a secret: VITE_SITE_URL

Set it in the new project's `.env` to the live site URL — the new `*.lovable.app` URL at first, then `https://smartsqlaimentor.live` after the custom domain is moved. Auth redirects and `sitemap.xml` derive from it.

## 5. Optional / skip

- `GOOGLE_SEARCH_CONSOLE_API_KEY` — came from a connector, not app code. Reconnect the connector only if you want Search Console data.

## Order of operations on the new account

1. Enable Cloud (this provisions `LOVABLE_API_KEY` and all Supabase values).
2. Apply every file in `supabase/migrations/` in filename order.
3. Set `VITE_SITE_URL`.
4. Save `RESEND_API_KEY`.
5. Configure the Google provider with your client ID and secret, then update redirect URIs in Google Cloud Console.
6. Typecheck and production build; fix only migration-caused breakage.
7. Publish, then move the custom domain and re-check the Google redirect URIs.
