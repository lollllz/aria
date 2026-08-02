import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type {
  CanvasElement, CanvasPage, DeviceGeo, DeviceId, ElementAction, ElementKind, ElementStyle, PageMeta,
} from '../types'

const defaultStyle = (): ElementStyle => ({
  background: '#7c5cff',
  color: '#ffffff',
  fontSize: 18,
  fontWeight: 500,
  radius: 8,
  borderWidth: 0,
  borderColor: '#2a2a37',
  opacity: 1,
  textAlign: 'left',
  padding: 12,
  shadow: false,
  letterSpacing: 0,
  lineHeight: 1.4,
  animation: 'none',
  animDuration: 1.8,
  animIntensity: 1,
  glowColor: '#7c5cff',
})

// Basic hardening for user-uploaded SVG: strip scripts, event handlers and
// external references so pasted/imported art can't run code.
export const sanitizeSvg = (raw: string): string =>
  raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '')
    .trim()

const PLACEHOLDER_SVG =
  '<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="118" height="58" rx="12" fill="none" stroke="#7c5cff" stroke-width="2" stroke-dasharray="6 6"/><text x="60" y="35" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" fill="#9a9aad">your SVG</text></svg>'

const noAction = (): ElementAction => ({ type: 'none', target: '' })

// Sensible per-kind defaults so a freshly dropped element already looks right.
const kindDefaults: Record<
  ElementKind,
  { width: number; height: number; content: string; style: Partial<ElementStyle>; name: string }
> = {
  heading: {
    width: 320, height: 56, content: 'Your headline', name: 'Heading',
    style: { background: 'transparent', color: '#e7e7ee', fontSize: 40, fontWeight: 800, padding: 0 },
  },
  text: {
    width: 260, height: 80, content: 'A paragraph of text. Click to edit me — drag me anywhere.', name: 'Text',
    style: { background: 'transparent', color: '#9a9aad', fontSize: 16, fontWeight: 400, padding: 0 },
  },
  button: {
    width: 160, height: 48, content: 'Get started', name: 'Button',
    style: { background: '#7c5cff', color: '#ffffff', fontSize: 16, fontWeight: 600, radius: 10, textAlign: 'center', padding: 12, shadow: true },
  },
  rectangle: {
    width: 200, height: 140, content: '', name: 'Rectangle',
    style: { background: '#1c1c26', radius: 12, borderWidth: 1, borderColor: '#2a2a37' },
  },
  ellipse: {
    width: 140, height: 140, content: '', name: 'Ellipse',
    style: { background: '#22d3ee', radius: 999 },
  },
  image: {
    width: 240, height: 160, content: 'https://picsum.photos/seed/aria/480/320', name: 'Image',
    style: { background: '#14141b', radius: 12, padding: 0 },
  },
  svg: {
    width: 160, height: 72, content: PLACEHOLDER_SVG, name: 'SVG',
    style: { background: 'transparent', radius: 0, padding: 0 },
  },
}

interface HistorySnapshot {
  elements: CanvasElement[]
  pages: PageMeta[]
}

interface CanvasState {
  page: CanvasPage
  pages: PageMeta[]
  currentPageId: string
  elements: CanvasElement[] // flat across all pages; filter by pageId to render
  selectedId: string | null
  device: DeviceId
  autoAdaptive: boolean
  history: HistorySnapshot[]
  future: HistorySnapshot[]

  addElement: (kind: ElementKind, at?: { x: number; y: number }) => void
  addSvg: (svg: string, name?: string) => void
  updateElement: (id: string, patch: Partial<CanvasElement>) => void
  setGeo: (id: string, patch: DeviceGeo) => void // device-aware geometry edit
  setDevice: (d: DeviceId) => void
  setAutoAdaptive: (b: boolean) => void
  updateStyle: (id: string, patch: Partial<ElementStyle>) => void
  setAction: (id: string, action: ElementAction) => void
  removeElement: (id: string) => void
  duplicateElement: (id: string) => void
  select: (id: string | null) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  setPage: (patch: Partial<CanvasPage>) => void

  addPage: () => void
  removePage: (id: string) => void
  renamePage: (id: string, name: string) => void
  setCurrentPage: (id: string) => void

  clear: () => void
  loadStarter: () => void
  loadDesign: (pageName: string, seeds: Omit<CanvasElement, 'id' | 'pageId'>[], bg?: string) => void
  undo: () => void
  redo: () => void
}

const FIRST_PAGE = 'home'

const commit = (state: CanvasState): Partial<CanvasState> => ({
  history: [...state.history, { elements: state.elements, pages: state.pages }].slice(-50),
  future: [],
})

export const useCanvasStore = create<CanvasState>((set, get) => ({
  page: { width: 960, height: 720, background: '#0f0f16' },
  pages: [{ id: FIRST_PAGE, name: 'Home' }],
  currentPageId: FIRST_PAGE,
  elements: [],
  selectedId: null,
  device: 'desktop',
  autoAdaptive: false,
  history: [],
  future: [],

  addElement: (kind, at) => {
    const d = kindDefaults[kind]
    const el: CanvasElement = {
      id: nanoid(6),
      pageId: get().currentPageId,
      kind,
      x: at?.x ?? 80 + Math.round(Math.random() * 40),
      y: at?.y ?? 80 + Math.round(Math.random() * 40),
      width: d.width,
      height: d.height,
      rotation: 0,
      content: d.content,
      name: d.name,
      action: noAction(),
      style: { ...defaultStyle(), ...d.style },
    }
    set((s) => ({ ...commit(s), elements: [...s.elements, el], selectedId: el.id }))
  },

  addSvg: (svg, name) => {
    const d = kindDefaults.svg
    const el: CanvasElement = {
      id: nanoid(6),
      pageId: get().currentPageId,
      kind: 'svg',
      x: 100 + Math.round(Math.random() * 40),
      y: 100 + Math.round(Math.random() * 40),
      width: d.width,
      height: d.height,
      rotation: 0,
      content: sanitizeSvg(svg) || d.content,
      name: name || 'SVG',
      action: noAction(),
      style: { ...defaultStyle(), ...d.style },
    }
    set((s) => ({ ...commit(s), elements: [...s.elements, el], selectedId: el.id }))
  },

  updateElement: (id, patch) =>
    set((s) => ({
      ...commit(s),
      elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  // Write geometry to the layer for the current device: the desktop base, or a
  // per-device override for tablet/mobile (so devices stay independent).
  setGeo: (id, patch) =>
    set((s) => ({
      ...commit(s),
      elements: s.elements.map((e) => {
        if (e.id !== id) return e
        if (s.device === 'desktop') return { ...e, ...patch }
        return { ...e, [s.device]: { ...(e[s.device] ?? {}), ...patch } }
      }),
    })),

  setDevice: (d) => set({ device: d }),
  setAutoAdaptive: (b) => set({ autoAdaptive: b }),

  updateStyle: (id, patch) =>
    set((s) => ({
      ...commit(s),
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, style: { ...e.style, ...patch } } : e,
      ),
    })),

  setAction: (id, action) =>
    set((s) => ({
      ...commit(s),
      elements: s.elements.map((e) => (e.id === id ? { ...e, action } : e)),
    })),

  removeElement: (id) =>
    set((s) => ({
      ...commit(s),
      // also clear any hooks that pointed at the removed element
      elements: s.elements
        .filter((e) => e.id !== id)
        .map((e) =>
          e.action.type === 'element' && e.action.target === id ? { ...e, action: noAction() } : e,
        ),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  duplicateElement: (id) => {
    const el = get().elements.find((e) => e.id === id)
    if (!el) return
    const copy: CanvasElement = {
      ...el, id: nanoid(6), x: el.x + 24, y: el.y + 24,
      style: { ...el.style }, action: { ...el.action },
    }
    set((s) => ({ ...commit(s), elements: [...s.elements, copy], selectedId: copy.id }))
  },

  select: (id) => set({ selectedId: id }),

  bringForward: (id) =>
    set((s) => {
      const i = s.elements.findIndex((e) => e.id === id)
      if (i < 0 || i === s.elements.length - 1) return {}
      const arr = [...s.elements]
      ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
      return { ...commit(s), elements: arr }
    }),

  sendBackward: (id) =>
    set((s) => {
      const i = s.elements.findIndex((e) => e.id === id)
      if (i <= 0) return {}
      const arr = [...s.elements]
      ;[arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]
      return { ...commit(s), elements: arr }
    }),

  setPage: (patch) => set((s) => ({ page: { ...s.page, ...patch } })),

  addPage: () =>
    set((s) => {
      const id = nanoid(6)
      const name = `Page ${s.pages.length + 1}`
      return { ...commit(s), pages: [...s.pages, { id, name }], currentPageId: id, selectedId: null }
    }),

  removePage: (id) =>
    set((s) => {
      if (s.pages.length <= 1) return {} // always keep one page
      const pages = s.pages.filter((p) => p.id !== id)
      const currentPageId = s.currentPageId === id ? pages[0].id : s.currentPageId
      return {
        ...commit(s),
        pages,
        currentPageId,
        selectedId: null,
        // drop that page's elements, and clear hooks that targeted the page
        elements: s.elements
          .filter((e) => e.pageId !== id)
          .map((e) =>
            e.action.type === 'page' && e.action.target === id ? { ...e, action: noAction() } : e,
          ),
      }
    }),

  renamePage: (id, name) =>
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, name } : p)) })),

  setCurrentPage: (id) => set({ currentPageId: id, selectedId: null }),

  clear: () =>
    set((s) => ({
      ...commit(s),
      elements: s.elements.filter((e) => e.pageId !== s.currentPageId),
      selectedId: null,
    })),

  loadStarter: () =>
    set((s) => {
      const pid = s.currentPageId
      const starter: CanvasElement[] = [
        {
          id: nanoid(6), pageId: pid, kind: 'rectangle', x: 0, y: 0, width: 960, height: 260, rotation: 0,
          content: '', name: 'Hero band', action: noAction(),
          style: { ...defaultStyle(), background: 'linear-gradient(135deg,#7c5cff,#22d3ee)', radius: 0, padding: 0 },
        },
        {
          id: nanoid(6), pageId: pid, kind: 'heading', x: 64, y: 96, width: 520, height: 60, rotation: 0,
          content: 'Build it your way.', name: 'Heading', action: noAction(),
          style: { ...defaultStyle(), background: 'transparent', color: '#0b0b0f', fontSize: 48, fontWeight: 800, padding: 0 },
        },
        {
          id: nanoid(6), pageId: pid, kind: 'text', x: 64, y: 160, width: 440, height: 48, rotation: 0,
          content: 'Drag, drop, and design a site without touching code.', name: 'Subhead', action: noAction(),
          style: { ...defaultStyle(), background: 'transparent', color: '#0b0b0f', fontSize: 18, fontWeight: 500, padding: 0 },
        },
        {
          id: nanoid(6), pageId: pid, kind: 'button', x: 64, y: 320, width: 170, height: 50, rotation: 0,
          content: 'Get started', name: 'Button', action: noAction(),
          style: { ...defaultStyle(), background: '#7c5cff', color: '#fff', fontSize: 16, fontWeight: 600, radius: 12, textAlign: 'center', padding: 12, shadow: true },
        },
      ]
      return {
        ...commit(s),
        selectedId: null,
        // replace only the current page's elements
        elements: [...s.elements.filter((e) => e.pageId !== pid), ...starter],
      }
    }),

  // Drop a generated design (from a template or marketplace item) onto a fresh
  // page and switch to it, so the user's existing pages are never clobbered.
  loadDesign: (pageName, seeds, bg) =>
    set((s) => {
      const pid = nanoid(6)
      const els: CanvasElement[] = seeds.map((seed) => ({ ...seed, id: nanoid(6), pageId: pid }))
      return {
        ...commit(s),
        pages: [...s.pages, { id: pid, name: pageName }],
        currentPageId: pid,
        elements: [...s.elements, ...els],
        selectedId: null,
        page: bg ? { ...s.page, background: bg } : s.page,
      }
    }),

  undo: () =>
    set((s) => {
      if (!s.history.length) return {}
      const prev = s.history[s.history.length - 1]
      return {
        elements: prev.elements,
        pages: prev.pages,
        history: s.history.slice(0, -1),
        future: [{ elements: s.elements, pages: s.pages }, ...s.future].slice(0, 50),
      }
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return {}
      const next = s.future[0]
      return {
        elements: next.elements,
        pages: next.pages,
        future: s.future.slice(1),
        history: [...s.history, { elements: s.elements, pages: s.pages }].slice(-50),
      }
    }),
}))
