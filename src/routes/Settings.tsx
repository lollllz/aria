import { useEffect, useState } from 'react'
import {
  Database, Check, X, Loader2, ExternalLink, Copy, ChevronRight, ShieldCheck,
  Plug, Server, KeyRound, RefreshCw,
} from 'lucide-react'
import { api, type HealthReport } from '../lib/api'
import { useSettingsStore } from '../store/settingsStore'
import { useReveal } from '../lib/useReveal'

const SCHEMA_URL = 'https://github.com/lollllz/aria/blob/main/db/schema.sql'

const SCHEMA_SQL = `create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  google_sub text unique,
  picture text,
  created_at timestamptz not null default now()
);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null default 'Untitled site',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market_items (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references users(id) on delete set null,
  author text not null default 'anonymous',
  title text not null,
  kind text not null check (kind in ('template','theme','creation','effect')),
  category text not null,
  license text not null default 'MIT',
  cover text not null default '',
  tags text[] not null default '{}',
  description text not null default '',
  effect_css text,
  payload jsonb,
  downloads integer not null default 0,
  rating numeric(2,1) not null default 5.0,
  created_at timestamptz not null default now()
);`

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setDone(true)
        window.setTimeout(() => setDone(false), 1600)
      }}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-300 ${
        done ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-aria-border text-aria-muted hover:text-aria-text'
      }`}
    >
      {done ? <Check size={13} className="a-pop-in" /> : <Copy size={13} />}
      {done ? 'Copied' : label}
    </button>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="a-reveal relative rounded-2xl border border-aria-border bg-aria-panel/60 p-5 backdrop-blur transition-colors duration-300 hover:border-aria-brand/35" data-reveal-delay={n * 60}>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-aria-brand to-aria-brand-2 text-xs font-bold text-white">
          {n}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="pl-10 text-sm leading-relaxed text-aria-muted">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { apiBase, provider, setApiBase, setProvider } = useSettingsStore()
  const [draft, setDraft] = useState(apiBase || (import.meta.env.VITE_API_BASE ?? ''))
  const [testing, setTesting] = useState(false)
  const [report, setReport] = useState<HealthReport | null>(null)
  useReveal()

  // Check the currently-active backend on mount so users see live status.
  useEffect(() => {
    let cancelled = false
    api.health().then((r) => { if (!cancelled) setReport(r) })
    return () => { cancelled = true }
  }, [])

  const test = async (save: boolean) => {
    setTesting(true)
    const r = await api.health(draft)
    setReport(r)
    setTesting(false)
    if (save && r.db) setApiBase(draft)
  }

  const connected = report?.db
  const ready = report?.ok

  return (
    <div className="relative mx-auto max-w-3xl px-6 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72">
        <div className="a-drift absolute left-1/2 top-[-140px] h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-aria-brand/18 blur-[120px]" />
      </div>

      {/* Header + live status */}
      <div className="a-fade-up mb-8">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <Database size={24} className="text-aria-brand-2" /> Aria hosting
        </h1>
        <p className="mt-2 text-sm text-aria-muted">
          This is the backend for <span className="text-aria-text">this Aria install</span> — where accounts, saved
          designs and the shared marketplace live. Self-hosting Aria? Point it at your own database below.
          <br />
          <span className="text-aria-muted">Building a site that needs its own database? Use{' '}
          <span className="text-aria-brand-2">Database</span> inside the canvas — that one ships with your export.</span>
        </p>
      </div>

      <div
        className={`a-fade-up a-d1 mb-8 flex items-center gap-3 rounded-2xl border p-4 transition-colors duration-500 ${
          ready ? 'border-emerald-500/40 bg-emerald-500/[0.07]'
            : connected ? 'border-amber-500/40 bg-amber-500/[0.07]'
            : 'border-aria-border bg-aria-panel/60'
        }`}
      >
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          ready ? 'bg-emerald-500/15 text-emerald-400' : connected ? 'bg-amber-500/15 text-amber-400' : 'bg-aria-panel-2 text-aria-muted'
        }`}>
          {testing ? <Loader2 size={18} className="animate-spin" /> : ready ? <Check size={18} /> : connected ? <Plug size={18} /> : <X size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {ready ? 'Connected and ready'
              : connected ? 'Connected — schema incomplete'
              : 'Not connected'}
          </p>
          <p className="truncate text-xs text-aria-muted">
            {ready ? `Tables found: ${report?.tables?.join(', ')}`
              : connected ? `Missing tables: ${report?.missing?.join(', ')} — run the schema below`
              : report?.error || 'Add your API URL below, then test the connection.'}
          </p>
        </div>
        <button
          onClick={() => test(false)}
          disabled={testing}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-aria-border px-3 py-1.5 text-xs font-medium text-aria-muted hover:text-aria-text disabled:opacity-50"
        >
          <RefreshCw size={13} className={testing ? 'animate-spin' : ''} /> Recheck
        </button>
      </div>

      {/* Provider */}
      <div className="a-fade-up a-d2 mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-aria-muted">Provider</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { id: 'neon' as const, name: 'Neon', desc: 'Serverless Postgres · recommended', badge: 'Best fit' },
            { id: 'other' as const, name: 'Other Postgres', desc: 'Supabase, RDS, self-hosted…', badge: '' },
          ]).map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`a-press relative rounded-2xl border p-4 text-left transition-all duration-300 ${
                provider === p.id
                  ? 'border-aria-brand bg-aria-brand/10 shadow-[0_0_0_3px] shadow-aria-brand/10'
                  : 'border-aria-border bg-aria-panel/50 hover:border-aria-brand/40'
              }`}
            >
              {p.badge && (
                <span className="absolute right-3 top-3 rounded-full bg-aria-brand-2/15 px-2 py-0.5 text-[10px] font-semibold text-aria-brand-2">
                  {p.badge}
                </span>
              )}
              <span className="block font-semibold">{p.name}</span>
              <span className="mt-0.5 block text-xs text-aria-muted">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <Step n={1} title="Create your database">
          <p>
            Sign up at Neon and create a project. Copy the <span className="text-aria-text">pooled</span> connection
            string from <em>Connection Details</em>.
          </p>
          <a
            href="https://neon.tech"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-aria-border px-3 py-1.5 text-xs font-medium text-aria-brand-2 hover:border-aria-brand/50"
          >
            Open Neon <ExternalLink size={12} />
          </a>
        </Step>

        <Step n={2} title="Create the tables">
          <p>Paste this into your database&apos;s SQL editor and run it once.</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-aria-border bg-aria-bg/60">
            <div className="flex items-center justify-between border-b border-aria-border px-3 py-2">
              <span className="font-mono text-[11px] text-aria-muted">schema.sql</span>
              <div className="flex gap-2">
                <CopyButton text={SCHEMA_SQL} label="Copy SQL" />
                <a
                  href={SCHEMA_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 rounded-lg border border-aria-border px-2.5 py-1.5 text-xs font-medium text-aria-muted hover:text-aria-text"
                >
                  View <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <pre className="max-h-40 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-aria-muted">{SCHEMA_SQL}</pre>
          </div>
        </Step>

        <Step n={3} title="Deploy the API and add your secrets">
          <p>
            Aria talks to your database through a small serverless API (included in the project under
            <span className="font-mono text-[12px] text-aria-text"> netlify/functions</span>). Deploy it, then set these
            environment variables <span className="text-aria-text">on the server</span>:
          </p>
          <div className="mt-3 space-y-2">
            {[
              { k: 'DATABASE_URL', v: 'your pooled connection string', icon: KeyRound },
              { k: 'ALLOWED_ORIGIN', v: window.location.origin, icon: ShieldCheck },
              { k: 'GOOGLE_CLIENT_ID', v: 'optional — enables Google sign-in', icon: Server },
            ].map(({ k, v, icon: Icon }) => (
              <div key={k} className="flex items-center gap-3 rounded-xl border border-aria-border bg-aria-bg/50 px-3 py-2">
                <Icon size={14} className="shrink-0 text-aria-brand-2" />
                <span className="font-mono text-xs text-aria-text">{k}</span>
                <span className="ml-auto truncate text-xs text-aria-muted">{v}</span>
                {k === 'ALLOWED_ORIGIN' && <CopyButton text={window.location.origin} label="" />}
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs text-amber-200/90">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            Your connection string stays on the server. Aria never stores database credentials in the browser.
          </p>
        </Step>

        <Step n={4} title="Connect Aria to your API">
          <p>Paste your deployed API URL, then test it.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') test(true) }}
              placeholder="https://your-api.netlify.app"
              className="flex-1 rounded-xl border border-aria-border bg-aria-panel-2 px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-aria-brand"
            />
            <button
              onClick={() => test(true)}
              disabled={testing || !draft.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aria-brand to-aria-brand-2 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {testing ? <Loader2 size={15} className="animate-spin" /> : <Plug size={15} />}
              {testing ? 'Testing…' : 'Test & save'}
            </button>
          </div>

          {report && !testing && (
            <div className={`a-pop-in mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs ${
              report.ok ? 'border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-300'
                : 'border-red-500/40 bg-red-500/[0.07] text-red-300'
            }`}>
              {report.ok ? <Check size={14} className="mt-0.5 shrink-0" /> : <X size={14} className="mt-0.5 shrink-0" />}
              <span>
                {report.ok
                  ? 'Connected. Your database is ready to use.'
                  : report.db
                    ? `Reached the database, but these tables are missing: ${report.missing?.join(', ')}. Run step 2.`
                    : `Could not connect: ${report.error ?? 'unknown error'}`}
              </span>
            </div>
          )}

          {apiBase && (
            <p className="mt-3 flex items-center gap-2 text-xs text-aria-muted">
              <ChevronRight size={12} /> Active API: <span className="font-mono text-aria-text">{apiBase}</span>
            </p>
          )}
        </Step>
      </div>
    </div>
  )
}
