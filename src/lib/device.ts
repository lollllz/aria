import { DEVICE_FRAMES, type CanvasElement, type DeviceId } from '../types'

export interface EffGeo { x: number; y: number; width: number; height: number; fontScale: number; visualBottom?: number }

export function effectiveGeo(el: CanvasElement, device: DeviceId, auto: boolean, desktopW: number): EffGeo {
  const o = device === 'desktop' ? {} : el[device] ?? {}
  const scale = auto && device !== 'desktop' ? DEVICE_FRAMES[device].width / Math.max(1, desktopW) : 1
  return {
    x: (auto ? el.x : o.x ?? el.x) * scale,
    y: (auto ? el.y : o.y ?? el.y) * scale,
    width: (auto ? el.width : o.width ?? el.width) * scale,
    height: (auto ? el.height : o.height ?? el.height) * scale,
    fontScale: scale,
  }
}

// Self-contained so the exact same geometry function can ship in exported sites.
// One scale and origin for the entire composition preserves gaps, overlaps and
// layering. Include rotated/off-page artwork so Auto fits every visible element.
export function scaleComposition(elems: CanvasElement[], targetWidth: number, desktopW: number): Record<string, EffGeo> {
  let left = 0
  let top = 0
  let right = Math.max(1, desktopW)
  for (const el of elems) {
    const angle = (el.rotation || 0) * Math.PI / 180
    const w = Math.abs(el.width * Math.cos(angle)) + Math.abs(el.height * Math.sin(angle))
    const h = Math.abs(el.width * Math.sin(angle)) + Math.abs(el.height * Math.cos(angle))
    left = Math.min(left, el.x + (el.width - w) / 2)
    right = Math.max(right, el.x + (el.width + w) / 2)
    top = Math.min(top, el.y + (el.height - h) / 2)
  }
  const scale = Math.max(1, targetWidth) / Math.max(1, right - left)
  const out: Record<string, EffGeo> = {}
  for (const el of elems) {
    const angle = (el.rotation || 0) * Math.PI / 180
    const rotatedHeight = Math.abs(el.width * Math.sin(angle)) + Math.abs(el.height * Math.cos(angle))
    out[el.id] = {
      x: (el.x - left) * scale,
      y: (el.y - top) * scale,
      width: el.width * scale,
      height: el.height * scale,
      fontScale: scale,
      visualBottom: (el.y - top + (el.height + rotatedHeight) / 2) * scale,
    }
  }
  return out
}

export function autoLayout(elems: CanvasElement[], device: Exclude<DeviceId, 'desktop'>, desktopW: number): Record<string, EffGeo> {
  return responsiveComposition(elems, DEVICE_FRAMES[device].width, desktopW)
}

export function autoLayoutHeight(map: Record<string, EffGeo>): number {
  let bottom = 0
  for (const g of Object.values(map)) bottom = Math.max(bottom, g.visualBottom ?? g.y + g.height)
  return bottom
}

// Infer sections and columns from spatial relationships. Backgrounds own their
// contents; columns stack when they cannot fit, while artwork keeps its ratio.
// Self-contained because exported sites ship this same function.
export function responsiveComposition(elems: CanvasElement[], targetWidth: number, desktopW: number): Record<string, EffGeo> {
  type Node = { el: CanvasElement; children: Node[] }
  const width = Math.max(1, targetWidth)
  const out: Record<string, EffGeo> = {}
  const nodes: Node[] = elems.map(el => ({ el, children: [] }))
  const roots: Node[] = []
  for (const node of nodes) {
    const el = node.el
    let parent: Node | undefined
    for (const candidate of nodes) {
      const box = candidate.el
      const inlineIcon = ['svg','ellipse'].includes(el.kind) && el.width <= 24 && el.height <= 24 && ['text','heading'].includes(box.kind)
      if (candidate === node || (!inlineIcon && (!['rectangle','button'].includes(box.kind) || box.height < 35 || box.width < 60))) continue
      if (box.width * box.height <= el.width * el.height) continue
      if (el.x >= box.x - 1 && el.y >= box.y - 1 && el.x + el.width <= box.x + box.width + (inlineIcon ? 24 : 1) && el.y + el.height <= box.y + box.height + 1) {
        if (!parent || box.width * box.height < parent.el.width * parent.el.height) parent = candidate
      }
    }
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const margin = width < 500 ? 20 : 28
  const gap = width < 500 ? 24 : 28
  const set = (el: CanvasElement, x: number, y: number, w: number, h: number, fontScale = 1) => {
    out[el.id] = { x, y, width: w, height: h, fontScale, visualBottom: y + h }
  }
  const bounds = (items: Node[]) => ({
    left: Math.min(...items.map(n => n.el.x)), right: Math.max(...items.map(n => n.el.x + n.el.width)),
    top: Math.min(...items.map(n => n.el.y)), bottom: Math.max(...items.map(n => n.el.y + n.el.height)),
  })
  const place = (node: Node, x: number, y: number, available: number): number => {
    const el = node.el
    if (node.children.length && el.kind === 'rectangle') {
      const inset = Math.min(24, Math.max(12, available * .06))
      const height = flow(node.children, x + inset, y + inset, Math.max(1, available - inset * 2)) + inset * 2
      set(el, x, y, available, height)
      return height
    }
    if (['text','heading','button'].includes(el.kind)) {
      const size = Math.max(1, el.style.fontSize || 16)
      const fontScale = el.kind === 'heading' ? Math.min(1, Math.max(.55, available / Math.max(1, el.width))) : Math.max(Math.min(1, available / Math.max(1, el.width)), Math.min(1, (size <= 12 ? 10 : 14) / size))
      const w = el.kind === 'button' ? Math.min(available, Math.max(150, el.width)) : available
      const padding = (el.style.padding || 0) * fontScale
      const chars = Math.max(1, Math.floor((w - padding * 2) / (size * fontScale * .58 + Math.max(0,el.style.letterSpacing || 0) * fontScale)))
      const lines = el.content.split('\n').reduce((sum,line) => sum + Math.max(1, Math.ceil(line.length / chars)), 0)
      const h = el.kind === 'button' ? Math.max(44, el.height * fontScale) : Math.max(el.height * fontScale, lines * size * fontScale * (el.style.lineHeight || 1.4) + padding * 2 + 4)
      set(el,x,y,w,h,fontScale)
      for (const child of node.children) {
        const k = Math.min(w / el.width,h / el.height)
        set(child.el,x + (child.el.x - el.x) * k,y + (child.el.y - el.y) * k,child.el.width*k,child.el.height*k,k)
      }
      return h
    }
    const w = el.height <= 3 ? available : Math.min(available, el.width)
    const k = w / Math.max(1, el.width)
    const h = Math.max(1, el.height * k)
    set(el,x,y,w,h,k)
    return h
  }
  const placeOriginal = (node: Node, x: number, y: number, sourceX: number, sourceY: number, k: number) => {
    const el=node.el
    set(el,x+(el.x-sourceX)*k,y+(el.y-sourceY)*k,el.width*k,el.height*k,k)
    for (const child of node.children) placeOriginal(child,x,y,sourceX,sourceY,k)
  }
  const flow = (items: Node[], x: number, y: number, available: number): number => {
    if (!items.length) return 0
    const sorted = [...items].sort((a,b) => a.el.y - b.el.y || a.el.x - b.el.x)
    const bands: Node[][] = []
    let bottom = -Infinity
    for (const node of sorted) {
      if (!bands.length || node.el.y >= bottom - 2) { bands.push([node]); bottom = node.el.y + node.el.height }
      else { bands[bands.length-1].push(node); bottom = Math.max(bottom,node.el.y + node.el.height) }
    }
    let cursor = y
    for (const band of bands) {
      if (band.length === 1) { cursor += place(band[0],x,cursor,available) + gap; continue }
      const b = bounds(band)
      const byX = [...band].sort((a,b) => a.el.x - b.el.x || a.el.y - b.el.y)
      const columns: Node[][] = []
      for (const node of byX) {
        const column = columns[columns.length-1]
        if (!column || node.el.x - column[0].el.x > Math.max(75,(b.right-b.left)*.26)) columns.push([node])
        else column.push(node)
      }
      if (columns.length > 1) {
        const canFit = available >= columns.length * 260 + (columns.length-1)*gap
        let height = 0
        for (let i=0;i<columns.length;i++) {
          const colWidth = canFit ? (available-(columns.length-1)*gap)/columns.length : available
          const h = flow(columns[i],canFit ? x+i*(colWidth+gap) : x,canFit ? cursor : cursor+height,colWidth)
          height = canFit ? Math.max(height,h) : height+h+gap
        }
        cursor += height + (canFit ? gap : 0)
      } else {
        // Intentional overlaps (such as an illustration assembled from shapes)
        // remain a composition, rather than being pulled apart into a list.
        const k = Math.min(1, available / Math.max(1,b.right-b.left))
        for (const node of band) placeOriginal(node,x,cursor,b.left,b.top,k)
        cursor += (b.bottom-b.top)*k+gap
      }
    }
    return Math.max(0,cursor-y-gap)
  }
  // Wide screens retain the authored layout. Narrow screens infer a content flow.
  if (width >= desktopW) return scaleCompositionFallback()
  function scaleCompositionFallback(): Record<string, EffGeo> {
    const k=width/Math.max(1,desktopW)
    for (const el of elems) set(el,el.x*k,el.y*k,el.width*k,el.height*k,k)
    return out
  }
  flow(roots,margin,margin,Math.max(1,width-margin*2))
  return out
}
