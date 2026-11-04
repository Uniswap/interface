import { useEffect, useState } from 'react'

/**
 * True from the render the displayed value changes until `settleMs` later, so the roll animation can be shown
 * while it plays and the plain value the rest of the time. Derived while rendering, so the first frame of a
 * change already shows the rolling digits, and a new change restarts the window. The first value never rolls.
 */
export function useIsRolling({
  value,
  enabled,
  settleMs,
}: {
  value: string | undefined
  enabled: boolean
  settleMs: number
}): boolean {
  const [state, setState] = useState({ value, rolling: false })

  if (state.value !== value) {
    setState({ value, rolling: enabled && !!state.value })
  }

  useEffect(() => {
    if (!state.rolling) {
      return undefined
    }
    const id = setTimeout(() => setState((s) => ({ ...s, rolling: false })), settleMs)
    return () => clearTimeout(id)
  }, [state.value, state.rolling, settleMs])

  return state.rolling
}
