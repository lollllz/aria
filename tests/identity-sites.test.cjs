const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

async function handler(user, rows = []) {
  const calls = []
  const key = `aria-auth-test-${Math.random()}`
  globalThis[key] = {
    currentUser: async () => user,
    sql: async (strings, ...values) => { calls.push({ query: strings.join('?'), values }); return rows },
    json: (body, status = 200) => Response.json(body, { status }),
    preflight: () => null,
    verifyRequestOrigin: (req) => { if (req.headers.get('origin') !== new URL(req.url).origin) throw new Error('origin') },
  }
  const stub = 'data:text/javascript,' + encodeURIComponent(`const s=globalThis[${JSON.stringify(key)}];export const {currentUser,sql,json,preflight,verifyRequestOrigin}=s;`)
  const source = fs.readFileSync('netlify/functions/sites.mts', 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText
    .replaceAll("'./_neon.mts'", JSON.stringify(stub))
    .replaceAll("'./_identity.mts'", JSON.stringify(stub))
    .replaceAll("'@netlify/identity'", JSON.stringify(stub))
  const mod = await import('data:text/javascript,' + encodeURIComponent(code))
  return { run: mod.default, calls, cleanup: () => { delete globalThis[key] } }
}

test('cloud sites reject signed-out requests before querying the database', async () => {
  const h = await handler(null)
  try {
    const res = await h.run(new Request('https://aria.test/api/sites?userId=victim'))
    assert.equal(res.status, 401)
    assert.equal(h.calls.length, 0)
  } finally { h.cleanup() }
})

test('site listing uses verified ownership instead of a supplied user ID', async () => {
  const h = await handler({ id: 'owner' })
  try {
    assert.equal((await h.run(new Request('https://aria.test/api/sites?userId=victim'))).status, 200)
    assert.deepEqual(h.calls[0].values, ['owner'])
  } finally { h.cleanup() }
})

test('saving another owner’s site returns not found and scopes the update', async () => {
  const h = await handler({ id: 'owner' })
  try {
    const res = await h.run(new Request('https://aria.test/api/sites', { method: 'POST', headers: { origin: 'https://aria.test', 'content-type': 'application/json' }, body: JSON.stringify({ id: 'other-site', userId: 'victim', name: 'Title', data: {} }) }))
    assert.equal(res.status, 404)
    assert.match(h.calls[0].query, /user_id =/)
    assert.equal(h.calls[0].values.at(-1), 'owner')
  } finally { h.cleanup() }
})

test('cross-origin cookie-authenticated writes are rejected', async () => {
  const h = await handler({ id: 'owner' })
  try {
    const res = await h.run(new Request('https://aria.test/api/sites?id=site', { method: 'DELETE', headers: { origin: 'https://unrelated.test' } }))
    assert.equal(res.status, 403)
    assert.equal(h.calls.length, 0)
  } finally { h.cleanup() }
})
