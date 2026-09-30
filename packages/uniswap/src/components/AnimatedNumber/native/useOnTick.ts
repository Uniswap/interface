import { useEffect, useRef } from 'react'

/**
 * Runs `onTick` exactly once whenever the tick id advances, and never on unrelated re-renders.
 * The callback reads the latest render's props/values (it is re-captured each render), so
 * animation inputs always match the commit that carried the tick.
 *
 * `fireOnMount` also fires for the tick that mounted the component (lazily mounted slots must play
 * that tick). The gen guard still stops StrictMode's double effect from animating twice.
 */
export function useOnTick({
  gen,
  onTick,
  fireOnMount = false,
}: {
  gen: number
  onTick: () => void
  fireOnMount?: boolean
}): void {
  const lastGenRef = useRef(fireOnMount ? gen - 1 : gen)
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
