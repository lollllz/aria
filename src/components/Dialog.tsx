import { useEffect, useRef, type ReactNode } from 'react'
import { visibleFocusables } from '../lib/a11y'

export default function Dialog({
  onClose,
  labelledBy,
  label,
  children,
  panelClassName,
  zClass = 'z-50',
  fullscreen = false,
}: {
  onClose: () => void
  labelledBy?: string
  label?: string
  children: ReactNode
  panelClassName?: string
  zClass?: string
  fullscreen?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const items = visibleFocusables(panel)
    ;(items[0] ?? panel).focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const list = visibleFocusables(panel)
      if (!list.length) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      prev?.focus?.()
    }
  }, [])

  const dialog = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      tabIndex={-1}
      className={panelClassName}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )

  if (fullscreen) {
    return (
      <div className={`a-fade-in fixed inset-0 ${zClass} flex flex-col bg-aria-bg/95 backdrop-blur-sm`}>
        {dialog}
      </div>
    )
  }

  return (
    <div
      className={`a-fade-in fixed inset-0 ${zClass} grid place-items-center bg-black/60 p-4 backdrop-blur-sm`}
      onClick={onClose}
    >
      {dialog}
    </div>
  )
}
