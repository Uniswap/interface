import { useRef } from 'react'

/**
 * Consumes each non-zero `gen` during render (so a lazy animator mounts in the tick's own commit) and
 * returns its captured params, or null when nothing should mount. Gens present at mount or seen while
 * suspended are consumed without capturing; a capture persists until suspend (per-tick unmounting leaked).
 */
export function useCapturedGen<T>({
  gen,
  suspendAnimations,
  capture,
}: {
  gen: number
  suspendAnimations: boolean
  capture: () => T
}): T | null {
  const ref = useRef<{ gen: number; captured: T | null }>({ gen, captured: null })

  if (gen !== 0 && gen !== ref.current.gen) {
    ref.current = { gen, captured: suspendAnimations ? null : capture() }
  } else if (suspendAnimations && ref.current.captured !== null) {
    ref.current = { gen: ref.current.gen, captured: null }
  }

  return ref.current.captured
}
