export const studioIconPaths = {
  arrow: 'M5 19 19 5M5 5h14v14',
  chevron: 'm6 9 6 6 6-6',
  check: 'm5 12 4 4L19 6',
} as const

export function studioIconSvg(name: keyof typeof studioIconPaths, color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${studioIconPaths[name]}"/></svg>`
}
