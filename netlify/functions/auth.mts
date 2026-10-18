import type { Config, Context } from '@netlify/functions'
import { json, preflight } from './_neon.mts'
import { currentUser } from './_identity.mts'

// GET /api/auth: resolve the verified Identity session to its Neon profile.
export default async (req: Request, _ctx: Context) => {
  const pre = preflight(req)
  if (pre) return pre
  if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405)
  try {
    const user = await currentUser()
    return user ? json(user) : json({ error: 'sign in required' }, 401)
  } catch {
    return json({ error: 'could not load account' }, 500)
  }
}
export const config: Config = { path: '/api/auth' }
