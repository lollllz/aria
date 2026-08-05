import { useEffect } from 'react'

// Reveals any `.a-reveal` element as it scrolls into view (adds `.is-in`).
// Runs once per element; re-scans whenever `deps` change so new content animates too.
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.a-reveal:not(.is-in)'))
    if (!nodes.length) return

    // If IntersectionObserver is unavailable, just show everything.
    if (typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          // Stagger items that share a row/section for a natural cascade.
          const delay = Number(el.dataset.revealDelay ?? 0)
          window.setTimeout(() => el.classList.add('is-in'), delay)
          io.unobserve(el)
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )

    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
