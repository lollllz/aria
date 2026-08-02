import { neon } from '@neondatabase/serverless'

// Shared Neon HTTP client. DATABASE_URL is a Netlify env var (never shipped to the browser).
export const sql = neon(process.env.DATABASE_URL as string)

// CORS: allow your GitHub Pages origin (set ALLOWED_ORIGIN in Netlify env).
const ORIGIN = process.env.ALLOWED_ORIGIN || '*'
export const cors = {
  'access-control-allow-origin': ORIGIN,
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } })

// Handle CORS preflight; returns a Response to short-circuit, or null to continue.
export const preflight = (req: Request) =>
  req.method === 'OPTIONS' ? new Response(null, { status: 204, headers: cors }) : null
