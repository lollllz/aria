import { DEVICE_FRAMES, type CanvasElement, type DeviceId } from '../types'

export interface EffGeo { x: number; y: number; width: number; height: number; fontScale: number }

// Effective geometry for an element on a given device: desktop base, a per-device
// override, or (in auto mode) the desktop layout uniformly scaled to fit.
export function effectiveGeo(el: CanvasElement, device: DeviceId, auto: boolean, desktopW: number): EffGeo {
  if (device === 'desktop') return { x: el.x, y: el.y, width: el.width, height: el.height, fontScale: 1 }
  if (auto) {
    const s = DEVICE_FRAMES[device].width / desktopW
    return { x: el.x * s, y: el.y * s, width: el.width * s, height: el.height * s, fontScale: s }
  }
  const o = el[device] ?? {}
  return { x: o.x ?? el.x, y: o.y ?? el.y, width: o.width ?? el.width, height: o.height ?? el.height, fontScale: 1 }
}

// Auto-adaptive reflow: group the desktop layout into horizontal "bands" (rows
// of overlapping elements — e.g. a hero and the text sitting on it), scale each
// band to the device width, and stack them top-to-bottom with a notch-safe
// inset. This keeps each section's internal layout + colours intact while
// removing wasted vertical gaps, instead of naively shrinking the whole page.
const SAFE_TOP = 44
export function autoLayout(
  elems: CanvasElement[],
  device: Exclude<DeviceId, 'desktop'>,
  desktopW: number,
): Record<string, EffGeo> {
  const scale = DEVICE_FRAMES[device].width / desktopW
  const sorted = [...elems].sort((a, b) => a.y - b.y || a.x - b.x)

  const bands: { items: CanvasElement[]; minY: number; maxY: number }[] = []
  for (const el of sorted) {
    const b = bands[bands.length - 1]
    if (b && el.y < b.maxY - 8) {
      b.items.push(el)
      b.maxY = Math.max(b.maxY, el.y + el.height)
    } else {
      bands.push({ items: [el], minY: el.y, maxY: el.y + el.height })
    }
  }

  const out: Record<string, EffGeo> = {}
  let cursor = SAFE_TOP
  for (const b of bands) {
    for (const el of b.items) {
      out[el.id] = {
        x: el.x * scale,
        y: cursor + (el.y - b.minY) * scale,
        width: el.width * scale,
        height: el.height * scale,
        fontScale: scale,
      }
    }
    cursor += (b.maxY - b.minY) * scale
  }
  return out
}

// Total stacked height an auto-reflow needs (so the frame can grow to fit).
export function autoLayoutHeight(map: Record<string, EffGeo>): number {
  let max = 0
  for (const g of Object.values(map)) max = Math.max(max, g.y + g.height)
  return max + SAFE_TOP
}
