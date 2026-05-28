import { useEffect } from 'react'
import type { UseInputFocusSyncProps } from 'uniswap/src/components/CurrencyInputPanel/hooks/useInputFocusSync/types'

export function useInputFocusSync({ inputRef, focus }: UseInputFocusSyncProps): void {
  useEffect(() => {
    if (focus !== true) {
      return undefined
    }
    const timeoutId = window.setTimeout(() => {
      const el = inputRef.current
      el?.focus()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [inputRef, focus])
}
