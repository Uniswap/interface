import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Minimum contract a digit-input cell ref needs to satisfy to be focusable by the
 * hook. `HTMLInputElement`, React Native `TextInput` refs, and any platform wrapper
 * exposing `focus()`/`blur()` all conform. `blur` is optional so platforms that don't
 * need it can omit it without breaking the type.
 */
export interface FocusableRef {
  focus: () => void
  blur?: () => void
}

type KeyDownEvent = { key: string }

type PasteEvent = {
  preventDefault: () => void
  clipboardData: { getData: (type: string) => string }
}

/**
 * Shared digit-entry state machine used by recovery OTP (6-digit) and PIN (4-digit)
 * inputs. Platform-specific `DigitInputRow` components wire their native events to
 * the handlers this hook exposes.
 *
 * Events are typed structurally (`{ key: string }`, minimal clipboard shape) so both
 * React DOM and React Native callsites can construct or forward them.
 */
export function useDigitInput({ length, onComplete }: { length: number; onComplete?: (code: string) => void }): {
  digits: string[]
  refs: React.MutableRefObject<(FocusableRef | null)[]>
  handleChange: (index: number, value: string) => void
  handleKeyDown: (index: number, e: KeyDownEvent) => void
  handlePaste: (e: PasteEvent) => void
  reset: () => void
} {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''))
  const [resetVersion, setResetVersion] = useState(0)
  const refs = useRef<(FocusableRef | null)[]>([])

  // Focus the first cell after a reset. Done in an effect (not synchronously inside
  // `reset()`) so React has flushed any parent state changes first — most notably
  // the consumer turning off a `disabled` flag in a `finally` block after a failed
  // submit. Calling focus() while the input is still `disabled` is a browser no-op.
  useEffect(() => {
    if (resetVersion > 0) {
      refs.current[0]?.focus()
    }
  }, [resetVersion])

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) {
        return
      }

      const char = value.slice(-1)
      const newDigits = [...digits]
      newDigits[index] = char

      if (!char) {
        setDigits(newDigits)
        return
      }

      setDigits(newDigits)

      if (index < length - 1) {
        refs.current[index + 1]?.focus()
      }

      const code = newDigits.join('')
      if (code.length === length && newDigits.every(Boolean)) {
        // Drop focus when the code completes so the just-typed cell doesn't keep
        // its focus ring while `onComplete` (typically a network call) is in flight.
        refs.current[index]?.blur?.()
        onComplete?.(code)
      }
    },
    [digits, length, onComplete],
  )

  const handleKeyDown = useCallback(
    (index: number, e: KeyDownEvent) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        refs.current[index - 1]?.focus()
      }
    },
    [digits],
  )

  const handlePaste = useCallback(
    (e: PasteEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      if (!pasted) {
        return
      }
      const newDigits = [...digits]
      for (let i = 0; i < pasted.length; i++) {
        const char = pasted[i]
        if (char) {
          newDigits[i] = char
        }
      }
      setDigits(newDigits)

      if (pasted.length === length) {
        onComplete?.(pasted)
      } else {
        refs.current[pasted.length]?.focus()
      }
    },
    [digits, length, onComplete],
  )

  const reset = useCallback(() => {
    setDigits(Array(length).fill(''))
    setResetVersion((v) => v + 1)
  }, [length])

  return { digits, refs, handleChange, handleKeyDown, handlePaste, reset }
}

export type DigitInputState = ReturnType<typeof useDigitInput>
