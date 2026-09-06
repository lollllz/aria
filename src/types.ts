// ── Canvas element model ────────────────────────────────────────────────────
// Every element on the Aria canvas is absolutely positioned (PowerPoint-style):
// it has an x/y/width/height plus a bag of style props. This is what lets a
// non-coder drag anything anywhere on a blank page.

export type ElementKind =
  | 'text'
  | 'heading'
  | 'button'
  | 'rectangle'
  | 'ellipse'
  | 'image'
  | 'svg' // user-uploaded vector art (e.g. exported from Illustrator)

// The 8 animation presets a user can attach to any element (great for buttons).
export type AnimationKind =
  | 'none'
  | 'pulse'
  | 'glow'
  | 'float'
  | 'bounce'
  | 'tilt'
  | 'pop'
  | 'shine'
  | 'shake'

export const ANIMATIONS: { id: AnimationKind; label: string; hoverOnly?: boolean }[] = [
  { id: 'none', label: 'None' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'glow', label: 'Glow' },
  { id: 'float', label: 'Float' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'tilt', label: 'Tilt', hoverOnly: true },
  { id: 'pop', label: 'Pop', hoverOnly: true },
  { id: 'shine', label: 'Shine' },
  { id: 'shake', label: 'Shake' },
]

export interface ElementStyle {
  background: string
  color: string
  fontSize: number
  fontWeight: number
  radius: number
  borderWidth: number
  borderColor: string
  opacity: number
  textAlign: 'left' | 'center' | 'right'
  padding: number
  shadow: boolean
  letterSpacing: number
  lineHeight: number
  // A built-in AnimationKind, 'none', or a custom effect ref 'fx:<id>'.
  animation: string
  animDuration: number // seconds per cycle
  animIntensity: number // 1 = default strength (glow spread, float distance…)
  glowColor: string // colour used by the glow animation
}

// ── Exported-site database ──────────────────────────────────────────────────
// Configuration for the database that ships INSIDE a user's exported website.
// Aria bakes a working connector + schema into the download so the client can
// point their own site at their own database.
export interface DbField {
  name: string
  type: 'text' | 'number' | 'boolean' | 'timestamp'
}

export interface DbCollection {
  name: string          // becomes a table, e.g. "contacts"
  fields: DbField[]
}

export interface SiteDbConfig {
  enabled: boolean
  provider: 'neon' | 'postgres'
  collections: DbCollection[]
}

// A user-authored animation: raw CSS (scoped to `.effect`) saved as a reusable
// effect that shows up in the animation picker and can be shared.
export interface CustomEffect {
  id: string
  name: string
  css: string
  author: string
}

// Natural cycle length per animation, used as the default when one is picked.
export const ANIM_DEFAULT_DURATION: Record<AnimationKind, number> = {
  none: 1.8, pulse: 1.6, glow: 1.8, float: 2.4, bounce: 1.4,
  tilt: 1.6, pop: 1.2, shine: 2.2, shake: 0.6,
}

// A "hook" is the user-defined behaviour attached to an element (usually a
// button). The underlying element is always the same primitive — the user
// decides what it *does* and what it *looks* like.
export type ActionType = 'none' | 'page' | 'element' | 'url'

export interface ElementAction {
  type: ActionType
  target: string // pageId | elementId | url, depending on type
}

export type DeviceId = 'desktop' | 'tablet' | 'mobile'

// Fixed frame sizes per device. Desktop uses the editable page dimensions.
export const DEVICE_FRAMES: Record<Exclude<DeviceId, 'desktop'>, { width: number; height: number }> = {
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
}

// Per-device geometry override. Absent fields fall back to the desktop base,
// so editing tablet/mobile never touches the desktop layout.
export interface DeviceGeo {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface CanvasElement {
  id: string
  pageId: string
  kind: ElementKind
  x: number // desktop base geometry
  y: number
  width: number
  height: number
  rotation: number
  content: string // text content or image URL
  action: ElementAction // the user-defined hook
  style: ElementStyle
  locked?: boolean
  name: string
  /** Accessible description for image elements; falls back to `name` when empty. */
  alt?: string
  tablet?: DeviceGeo // per-device overrides
  mobile?: DeviceGeo
}

// Named screens the user can navigate between. Elements belong to a page via
// `pageId`; the visual link map lets a button jump to another page.
export interface PageMeta {
  id: string
  name: string
}

// Shared canvas frame settings (dimensions + backdrop).
export interface CanvasPage {
  width: number
  height: number
  background: string
}

// ── Marketplace model ───────────────────────────────────────────────────────
export type MarketCategory =
  | 'business'
  | 'portfolio'
  | 'landing'
  | 'restaurant'
  | 'blog'
  | 'theme'

// Aria is open software: every marketplace item is free. No `price` field —
// creations are shared, rated, and downloaded, never sold.
export interface MarketItem {
  id: string
  title: string
  author: string
  category: MarketCategory
  kind: 'template' | 'theme' | 'creation' | 'effect'
  license: 'MIT' | 'CC-BY' | 'CC0' | 'GPL'
  rating: number
  downloads: number
  cover: string // gradient or color used for the preview swatch
  tags: string[]
  description: string
  // Present when kind === 'effect': the shared effect's CSS + display name.
  effectCss?: string
  effectName?: string
}

// ── Template site builder model ─────────────────────────────────────────────
// Each template carries a full visual identity so previews look genuinely
// distinct — not just a swapped accent colour.
export interface TemplateStyle {
  bg: string
  surface: string
  text: string
  muted: string
  accent: string
  accent2: string
  bodyFont: string
  headingFont: string
  radius: number
  buttonStyle: 'solid' | 'outline' | 'pill' | 'sharp' | 'glow'
  heroLayout: 'centered' | 'split' | 'left'
  uppercase: boolean
  vibe: string
}

export interface SiteTemplate {
  id: string
  name: string
  category: MarketCategory
  blurb: string
  accent: string
  sections: string[]
  style: TemplateStyle
}

export interface SiteSettings {
  siteName: string
  tagline: string
  accent: string
  font: 'Template default' | 'Inter' | 'Georgia' | 'Poppins' | 'monospace'
  darkMode: boolean
}
