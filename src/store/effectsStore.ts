import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { CustomEffect } from '../types'

export { compileEffect, EFFECT_TEMPLATE } from '../lib/effects'

interface EffectsState {
  customEffects: CustomEffect[]
  makerOpen: boolean
  addEffect: (name: string, css: string, author?: string) => string
  removeEffect: (id: string) => void
  openMaker: () => void
  closeMaker: () => void
}

export const useEffectsStore = create<EffectsState>()(persist((set) => ({
  customEffects: [],
  makerOpen: false,

  addEffect: (name, css, author = 'you') => {
    const id = nanoid(6)
    set((s) => ({ customEffects: [...s.customEffects, { id, name: name.trim() || 'Custom effect', css, author }] }))
    return id
  },

  removeEffect: (id) =>
    set((s) => ({ customEffects: s.customEffects.filter((e) => e.id !== id) })),

  openMaker: () => set({ makerOpen: true }),
  closeMaker: () => set({ makerOpen: false }),
}), {
  name: 'aria-effects',
  partialize: (s) => ({ customEffects: s.customEffects }),
}))
