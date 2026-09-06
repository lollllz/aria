import { useState } from 'react'
import {
  Database, X, Plus, Trash2, Table2, Check, Copy, Info, Package,
} from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import type { DbCollection, DbField } from '../../types'
import Dialog from '../Dialog'

const TYPES: DbField['type'][] = ['text', 'number', 'boolean', 'timestamp']
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '')

export default function SiteDatabase({ onClose }: { onClose: () => void }) {
  const { siteDb, setSiteDb } = useCanvasStore()
  const [copied, setCopied] = useState(false)

  const setCollections = (collections: DbCollection[]) => setSiteDb({ collections })

  const addCollection = () =>
    setCollections([...siteDb.collections, { name: 'items', fields: [{ name: 'title', type: 'text' }] }])

  const patchCollection = (i: number, patch: Partial<DbCollection>) =>
    setCollections(siteDb.collections.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))

  const removeCollection = (i: number) =>
    setCollections(siteDb.collections.filter((_, idx) => idx !== i))

  const addField = (i: number) =>
    patchCollection(i, { fields: [...siteDb.collections[i].fields, { name: 'field', type: 'text' }] })

  const patchField = (ci: number, fi: number, patch: Partial<DbField>) =>
    patchCollection(ci, {
      fields: siteDb.collections[ci].fields.map((f, idx) => (idx === fi ? { ...f, ...patch } : f)),
    })

  const removeField = (ci: number, fi: number) =>
    patchCollection(ci, { fields: siteDb.collections[ci].fields.filter((_, idx) => idx !== fi) })

  const sample = siteDb.collections[0]
  const snippet = sample
    ? `import db from './src/lib/db.js'\n\nconst rows = await db.list('${clean(sample.name)}')\nawait db.save('${clean(sample.name)}', { ${sample.fields.filter((f) => f.name).slice(0, 2).map((f) => `${clean(f.name)}: '…'`).join(', ')} })`
    : ''

  return (
    <Dialog
      onClose={onClose}
      labelledBy="sitedb-title"
      zClass="z-[65]"
      panelClassName="a-pop-in flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-aria-border bg-aria-panel"
    >
        <div className="flex items-center justify-between border-b border-aria-border px-5 py-3.5">
          <h2 id="sitedb-title" className="flex items-center gap-2 text-base font-semibold">
            <Database size={17} aria-hidden className="text-aria-brand-2" /> Site database
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text">
            <X size={17} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-aria-border bg-aria-bg/50 p-3 text-xs leading-relaxed text-aria-muted">
            <Info size={14} className="mt-0.5 shrink-0 text-aria-brand-2" />
            This is the database for <span className="text-aria-text">the site you are building</span>. Turn it on and
            Aria bundles a working connector, schema and API into your <span className="text-aria-text">Export code</span> download —
            so your site can store form submissions, posts or anything else in your own database.
          </p>

          {/* Enable */}
          <div className="mb-5 flex items-center justify-between rounded-xl border border-aria-border bg-aria-panel-2/50 px-4 py-3">
            <span id="db-enable-label">
              <span className="block text-sm font-medium">Include a database in this site</span>
              <span className="block text-xs text-aria-muted">Adds a connector, schema and API to the export.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={siteDb.enabled}
              aria-labelledby="db-enable-label"
              onClick={() => setSiteDb({ enabled: !siteDb.enabled })}
              className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-300 ${siteDb.enabled ? 'bg-aria-brand' : 'bg-aria-panel-2'}`}
            >
              <span className={`block h-5 w-5 rounded-full bg-white transition-transform duration-300 ${siteDb.enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {siteDb.enabled && (
            <div className="a-fade-up space-y-4">
              {/* Provider */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-aria-muted">Provider</p>
                <div role="radiogroup" aria-label="Provider" className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'neon' as const, name: 'Neon', desc: 'Serverless Postgres · recommended' },
                    { id: 'postgres' as const, name: 'Postgres', desc: 'Any Postgres database' },
                  ]).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={siteDb.provider === p.id}
                      onClick={() => setSiteDb({ provider: p.id })}
                      className={`a-press rounded-xl border p-3 text-left transition-all duration-300 ${
                        siteDb.provider === p.id
                          ? 'border-aria-brand bg-aria-brand/10 shadow-[0_0_0_3px] shadow-aria-brand/10'
                          : 'border-aria-border hover:border-aria-brand/40'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{p.name}</span>
                      <span className="block text-[11px] text-aria-muted">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Collections */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-aria-muted">Collections</p>
                  <button onClick={addCollection} className="flex items-center gap-1 rounded-lg border border-aria-border px-2.5 py-1 text-xs text-aria-muted hover:text-aria-text">
                    <Plus size={12} /> Add
                  </button>
                </div>

                <div className="space-y-3">
                  {siteDb.collections.map((c, ci) => (
                    <div key={ci} className="a-fade-up rounded-xl border border-aria-border bg-aria-bg/40 p-3">
                      <div className="mb-2.5 flex items-center gap-2">
                        <Table2 size={14} className="shrink-0 text-aria-brand-2" />
                        <input
                          value={c.name}
                          onChange={(e) => patchCollection(ci, { name: e.target.value })}
                          placeholder="collection name"
                          aria-label={`Collection ${ci + 1} name`}
                          className="min-w-0 flex-1 rounded-lg border border-aria-border bg-aria-panel-2 px-2.5 py-1.5 font-mono text-sm transition-colors focus:border-aria-brand"
                        />
                        <button onClick={() => removeCollection(ci)} aria-label={`Remove collection ${c.name || ci + 1}`} title="Remove collection" className="rounded-lg p-1.5 text-aria-muted hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>

                      <div className="space-y-1.5 pl-6">
                        {c.fields.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2">
                            <input
                              value={f.name}
                              onChange={(e) => patchField(ci, fi, { name: e.target.value })}
                              placeholder="field"
                              aria-label={`Field ${fi + 1} name`}
                              className="min-w-0 flex-1 rounded-lg border border-aria-border bg-aria-panel-2 px-2.5 py-1 font-mono text-xs transition-colors focus:border-aria-brand"
                            />
                            <select
                              value={f.type}
                              onChange={(e) => patchField(ci, fi, { type: e.target.value as DbField['type'] })}
                              aria-label={`Field ${fi + 1} type`}
                              className="rounded-lg border border-aria-border bg-aria-panel-2 px-2 py-1 text-xs focus:border-aria-brand"
                            >
                              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button onClick={() => removeField(ci, fi)} aria-label={`Remove field ${f.name || fi + 1}`} className="rounded p-1 text-aria-muted hover:text-red-400">
                              <X size={13} aria-hidden />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addField(ci)} className="flex items-center gap-1 pt-0.5 text-xs text-aria-muted hover:text-aria-text">
                          <Plus size={11} /> Add field
                        </button>
                      </div>

                      <p className="mt-2 pl-6 font-mono text-[10px] text-aria-muted">
                        → table <span className="text-aria-brand-2">{clean(c.name) || 'items'}</span> (id, {c.fields.filter((f) => f.name).map((f) => clean(f.name)).join(', ')}{c.fields.length ? ', ' : ''}created_at)
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* What you get */}
              <div className="rounded-xl border border-aria-border bg-aria-bg/40 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-aria-text">
                  <Package size={13} className="text-aria-brand-2" /> Bundled into your export
                </p>
                <ul className="space-y-1 text-[11px] text-aria-muted">
                  {[
                    'db/schema.sql — creates your tables',
                    'netlify/functions/data.mjs — REST API for each collection',
                    'src/lib/db.js — list() and save() client',
                    'DATABASE.md — setup steps for your database',
                  ].map((l) => (
                    <li key={l} className="flex items-center gap-1.5">
                      <Check size={11} className="shrink-0 text-emerald-400" /> <span className="font-mono">{l}</span>
                    </li>
                  ))}
                </ul>

                {snippet && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-aria-border bg-aria-bg/60">
                    <div className="flex items-center justify-between border-b border-aria-border px-2.5 py-1.5">
                      <span className="font-mono text-[10px] text-aria-muted">usage</span>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(snippet); setCopied(true); window.setTimeout(() => setCopied(false), 1500) }}
                        className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-colors ${copied ? 'text-emerald-400' : 'text-aria-muted hover:text-aria-text'}`}
                      >
                        {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="overflow-auto px-2.5 py-2 font-mono text-[10px] leading-relaxed text-aria-muted">{snippet}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-aria-border px-5 py-3">
          <span className="text-xs text-aria-muted">
            {siteDb.enabled ? 'Included in your next “Export code” download.' : 'Off — your export stays a static site.'}
          </span>
          <button onClick={onClose} className="a-cta rounded-lg px-4 py-2 text-sm font-semibold transition">
            Done
          </button>
        </div>
    </Dialog>
  )
}
