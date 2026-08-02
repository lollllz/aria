import type { Config, Context } from '@netlify/functions'
import { sql, json, preflight } from './_neon.mts'

// POST /api/auth  { credential }  -> verify the Google ID token, upsert the user.
export default async (req: Request, _ctx: Context) => {
  const pre = preflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  try {
    const { credential } = await req.json()
    if (!credential) return json({ error: 'credential required' }, 400)

    // Verify the token with Google (checks signature + expiry).
    const res = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential))
    if (!res.ok) return json({ error: 'invalid token' }, 401)
    const p = (await res.json()) as Record<string, string>

    // Confirm the token was minted for OUR app and by Google.
    if (process.env.GOOGLE_CLIENT_ID && p.aud !== process.env.GOOGLE_CLIENT_ID) return json({ error: 'audience mismatch' }, 401)
    if (p.iss !== 'https://accounts.google.com' && p.iss !== 'accounts.google.com') return json({ error: 'issuer mismatch' }, 401)
    if (!p.email) return json({ error: 'no email in token' }, 401)

    const rows = await sql`
      insert into users (email, name, google_sub, picture)
      values (${p.email}, ${p.name ?? p.email}, ${p.sub}, ${p.picture ?? null})
      on conflict (email) do update
        set name = excluded.name, picture = excluded.picture, google_sub = excluded.google_sub
      returning id, name, email, picture`
    return json(rows[0])
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}

export const config: Config = { path: '/api/auth' }
