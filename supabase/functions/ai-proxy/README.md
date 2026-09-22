# ai-proxy

Authenticated Supabase Edge Function that proxies OpenAI chat completions.
The browser never sees the OpenAI key.

## What it enforces

- Valid Supabase user JWT (`Authorization: Bearer <token>`), otherwise `401`.
- Model whitelist: `gpt-4o` (default), `gpt-4o-mini`.
- `max_tokens` capped at 4000; max 10 messages / 200k chars.
- Errors return `{ error: { code, message } }` and never include the key.

## Deploy

1. Set the secret (use a NEW key, see step 4):

   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

2. Deploy the function (JWT verification stays enabled):

   ```bash
   supabase functions deploy ai-proxy
   ```

3. Apply the migration `supabase/migrations/20260922_phase0_secure_system_config.sql`
   (`supabase db push`, or run it in the SQL editor). It deletes the
   `openai_api_key` row and restricts `system_config` to superadmins.

4. ROTATE the old OpenAI key. It was stored in `system_config` and readable
   from the browser, so treat it as compromised: revoke it at
   https://platform.openai.com/api-keys after the new secret is live.

## Local testing

```bash
supabase functions serve ai-proxy --env-file ./supabase/.env.local
```
