import type {
  CanvasElement, ElementStyle, MarketCategory, MarketItem, TemplateStyle,
} from '../types'

// A seed is a full element minus the ids the store assigns on load.
export type ElementSeed = Omit<CanvasElement, 'id' | 'pageId'>

const mk = (o: Partial<ElementStyle>): ElementStyle => ({
  background: 'transparent',
  color: '#111111',
  fontSize: 16,
  fontWeight: 400,
  radius: 8,
  borderWidth: 0,
  borderColor: 'rgba(0,0,0,0.08)',
  opacity: 1,
  textAlign: 'left',
  padding: 0,
  shadow: false,
  letterSpacing: 0,
  lineHeight: 1.4,
  animation: 'none',
  animDuration: 1.8,
  animIntensity: 1,
  glowColor: '#7c5cff',
  ...o,
})

const buttonRadius = (bs: TemplateStyle['buttonStyle'], radius: number) =>
  bs === 'pill' ? 999 : bs === 'sharp' ? 0 : radius

// Build a real, editable multi-section page (nav → hero → feature cards →
// footer) from a template's visual identity. Everything lands as ordinary
// canvas elements the user can then drag, restyle, animate or link.
export function buildSiteElements(opts: {
  style: TemplateStyle
  sections: string[]
  siteName: string
  tagline: string
  blurb: string
}): ElementSeed[] {
  const { style: st, sections, siteName, tagline, blurb } = opts
  const upper = st.uppercase
    ? { letterSpacing: 1 } // approximate uppercase feel via tracking
    : {}
  const centered = st.heroLayout === 'centered'
  const brandName = st.uppercase ? siteName.toUpperCase() : siteName
  const els: ElementSeed[] = []

  // ── Nav ──────────────────────────────────────────────────────────────
  els.push({
    kind: 'rectangle', x: 0, y: 0, width: 960, height: 64, rotation: 0,
    content: '', name: 'Nav bar', action: { type: 'none', target: '' },
    style: mk({ background: st.surface, radius: 0 }),
  })
  els.push({
    kind: 'heading', x: 40, y: 20, width: 260, height: 28, rotation: 0,
    content: brandName, name: 'Brand', action: { type: 'none', target: '' },
    style: mk({ color: st.accent, fontSize: 20, fontWeight: 800, ...upper }),
  })
  els.push({
    kind: 'text', x: 520, y: 22, width: 400, height: 24, rotation: 0,
    content: sections.slice(0, 4).map((s) => (st.uppercase ? s.toUpperCase() : s)).join('     '),
    name: 'Nav links', action: { type: 'none', target: '' },
    style: mk({ color: st.muted, fontSize: 14, textAlign: 'right', ...upper }),
  })

  // ── Hero ─────────────────────────────────────────────────────────────
  els.push({
    kind: 'rectangle', x: 0, y: 64, width: 960, height: 300, rotation: 0,
    content: '', name: 'Hero', action: { type: 'none', target: '' },
    style: mk({ background: `linear-gradient(135deg, ${st.accent}, ${st.accent2})`, radius: 0 }),
  })
  els.push({
    kind: 'heading', x: centered ? 160 : 64, y: 150, width: centered ? 640 : 640, height: 66, rotation: 0,
    content: st.uppercase ? tagline.toUpperCase() : tagline, name: 'Headline',
    action: { type: 'none', target: '' },
    style: mk({ color: '#ffffff', fontSize: 44, fontWeight: 800, textAlign: centered ? 'center' : 'left', ...upper }),
  })
  els.push({
    kind: 'text', x: centered ? 230 : 64, y: 226, width: centered ? 500 : 520, height: 44, rotation: 0,
    content: blurb, name: 'Subhead', action: { type: 'none', target: '' },
    style: mk({ color: 'rgba(255,255,255,0.92)', fontSize: 18, textAlign: centered ? 'center' : 'left' }),
  })
  els.push({
    kind: 'button', x: centered ? 400 : 64, y: 300, width: 168, height: 50, rotation: 0,
    content: 'Get started', name: 'CTA button', action: { type: 'none', target: '' },
    style: mk({
      background: '#ffffff', color: st.accent, fontSize: 16, fontWeight: 700,
      textAlign: 'center', padding: 12, shadow: true,
      radius: buttonRadius(st.buttonStyle, st.radius),
      animation: st.buttonStyle === 'glow' ? 'glow' : 'none',
      glowColor: st.accent,
    }),
  })

  // ── Feature cards ────────────────────────────────────────────────────
  const cardTitles = sections.slice(1, 4)
  while (cardTitles.length < 3) cardTitles.push('Feature')
  cardTitles.slice(0, 3).forEach((title, i) => {
    const cx = 64 + i * 288
    els.push({
      kind: 'rectangle', x: cx, y: 404, width: 256, height: 156, rotation: 0,
      content: '', name: `Card ${i + 1}`, action: { type: 'none', target: '' },
      style: mk({ background: st.surface, radius: st.radius, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }),
    })
    els.push({
      kind: 'rectangle', x: cx + 20, y: 424, width: 36, height: 36, rotation: 0,
      content: '', name: `Card ${i + 1} icon`, action: { type: 'none', target: '' },
      style: mk({ background: st.accent, radius: st.buttonStyle === 'sharp' ? 0 : Math.min(st.radius, 10) }),
    })
    els.push({
      kind: 'heading', x: cx + 20, y: 472, width: 216, height: 26, rotation: 0,
      content: st.uppercase ? title.toUpperCase() : title, name: `Card ${i + 1} title`,
      action: { type: 'none', target: '' },
      style: mk({ color: st.text, fontSize: 17, fontWeight: 700, ...upper }),
    })
    els.push({
      kind: 'text', x: cx + 20, y: 500, width: 216, height: 44, rotation: 0,
      content: 'A short line describing this feature or section of the site.',
      name: `Card ${i + 1} text`, action: { type: 'none', target: '' },
      style: mk({ color: st.muted, fontSize: 13 }),
    })
  })

  // ── Footer ───────────────────────────────────────────────────────────
  els.push({
    kind: 'text', x: 64, y: 596, width: 500, height: 22, rotation: 0,
    content: `© ${new Date().getFullYear()} ${siteName}`, name: 'Footer',
    action: { type: 'none', target: '' },
    style: mk({ color: st.muted, fontSize: 13 }),
  })

  return els
}

// Sensible default section names when a marketplace item doesn't carry any.
const SECTIONS: Record<MarketCategory, string[]> = {
  business: ['Home', 'Services', 'About', 'Contact'],
  portfolio: ['Home', 'Work', 'Gallery', 'Contact'],
  landing: ['Home', 'Features', 'Pricing', 'FAQ'],
  restaurant: ['Home', 'Menu', 'Gallery', 'Reserve'],
  blog: ['Home', 'Latest', 'Categories', 'About'],
  theme: ['Home', 'Features', 'About', 'Contact'],
}

// Pull the two colours out of a "linear-gradient(...,#aaa,#bbb)" cover string.
const coverColors = (cover: string): [string, string] => {
  const hexes = cover.match(/#[0-9a-fA-F]{3,8}/g)
  if (hexes && hexes.length >= 2) return [hexes[0], hexes[1]]
  if (hexes && hexes.length === 1) return [hexes[0], hexes[0]]
  return ['#7c5cff', '#22d3ee']
}

// Derive a full visual identity for a marketplace item so it can be opened in
// the canvas like a template. Dark for landing/theme, light otherwise.
export function styleFromMarketItem(item: MarketItem): TemplateStyle {
  const [accent, accent2] = coverColors(item.cover)
  const dark = item.category === 'landing' || item.category === 'theme'
  const serif = item.category === 'restaurant' || item.category === 'blog'
  const font = serif ? 'Georgia, serif' : "'Inter', sans-serif"
  return {
    bg: dark ? '#0a0a0f' : '#ffffff',
    surface: dark ? '#16161f' : '#f4f4fb',
    text: dark ? '#ffffff' : '#0b0b18',
    muted: dark ? '#9a9ab0' : '#6b6b80',
    accent, accent2,
    bodyFont: font, headingFont: font,
    radius: item.category === 'restaurant' ? 999 : dark ? 14 : 12,
    buttonStyle: item.category === 'restaurant' ? 'pill' : dark ? 'glow' : 'solid',
    heroLayout: item.category === 'portfolio' ? 'left' : 'centered',
    uppercase: item.category === 'portfolio',
    vibe: item.description,
  }
}

export const sectionsForCategory = (c: MarketCategory) => SECTIONS[c]
