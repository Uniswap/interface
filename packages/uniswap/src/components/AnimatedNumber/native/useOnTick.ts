import { useEffect, useRef } from 'react'

/**
 * Runs `onTick` exactly once whenever the tick id advances, and never on unrelated re-renders
 * or on mount. The callback reads the latest render's props/values (it is re-captured each
 * render), so animation inputs always match the commit that carried the tick.
 */
export function useOnTick(gen: number, onTick: () => void): void {
  const lastGenRef = useRef(gen)
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  useEffect(() => {
    if (gen === lastGenRef.current) {
      return
    }
    lastGenRef.current = gen
    onTickRef.current()
  }, [gen])
}
