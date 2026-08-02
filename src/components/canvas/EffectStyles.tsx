import { compileEffect, useEffectsStore } from '../../store/effectsStore'

// Injects every saved custom effect's compiled CSS into the document so
// elements using `fx:<id>` animate anywhere they render.
export default function EffectStyles() {
  const effects = useEffectsStore((s) => s.customEffects)
  const css = effects.map((e) => compileEffect(e.css, e.id)).join('\n\n')
  return <style>{css}</style>
}
