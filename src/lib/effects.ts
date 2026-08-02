const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Turn a user's raw effect CSS into safe, collision-free CSS for injection:
//  • scope the `.effect` / `&` selector to this effect's unique class
//  • namespace @keyframes so two effects can't clash on animation names
//  • strip @import and </style> so nobody can break out or pull remote CSS
export function compileEffect(raw: string, id: string): string {
  const cls = `aria-fx-${id}`
  let css = raw.replace(/@import[^;]*;?/gi, '').replace(/<\/?\s*style/gi, '')

  const names = [...css.matchAll(/@keyframes\s+([A-Za-z_][\w-]*)/g)].map((m) => m[1])
  for (const n of names) {
    css = css.replace(new RegExp(`\\b${escapeReg(n)}\\b`, 'g'), `${id}_${n}`)
  }
  css = css.replaceAll('.effect', `.${cls}`).replaceAll('&', `.${cls}`)
  return css
}

export const EFFECT_TEMPLATE = `/* Target your element with .effect
   These variables keep the Speed / Intensity / Glow controls working:
     var(--aria-anim-dur)   var(--aria-anim-amt)   var(--aria-glow) */

@keyframes wobble {
  0%, 100% { transform: rotate(0deg); }
  25%  { transform: rotate(calc(-6deg * var(--aria-anim-amt, 1))); }
  75%  { transform: rotate(calc(6deg  * var(--aria-anim-amt, 1))); }
}

.effect {
  animation: wobble var(--aria-anim-dur, 1.2s) ease-in-out infinite;
}`
