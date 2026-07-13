import { type ChangeEvent, type CSSProperties, useRef, useState } from 'react'
import { Flex, Text } from 'ui/src'
import type { DigitInputRowProps } from 'uniswap/src/components/passkey/recovery/DigitInputRow.types'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'

const CARET_KEYFRAMES_ID = 'uniswap-digit-input-caret-keyframes'
const CARET_KEYFRAMES_CSS = `
  @keyframes uniswap-digit-caret-blink {
    0%, 45% { opacity: 1; }
    50%, 95% { opacity: 0; }
    100% { opacity: 1; }
  }
`
const CARET_ANIMATION = 'uniswap-digit-caret-blink 1.1s steps(1) infinite'

const HIDDEN_INPUT_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  border: 'none',
  background: 'transparent',
  caretColor: 'transparent',
  fontSize: 16, // ≥16px stops iOS Safari zooming on focus
  outline: 'none',
}

/**
 * One invisible `<input>` holds the whole code, overlaid on visual-only cells.
 *
 * Per-cell inputs would move DOM focus every keystroke, restarting the Android IME and
 * bouncing the keyboard-anchored auth sheet (INFRA-2144); with one input the hook's
 * focus-advance calls are no-ops. Masking is visual so the numeric keypad survives the
 * show/hide toggle (INFRA-1912). a11y: cells are `aria-hidden` (the input is the control)
 * and a masked passcode opts out of password managers; the value stays `type="text"` since
 * `type="password"` is what destabilizes the keypad.
 */
export function DigitInputRow({
  digits,
  refs,
  onChange,
  onPaste,
  inputType = 'text',
  autoFocus = false,
  disabled = false,
}: DigitInputRowProps): JSX.Element {
  useInjectSingleStylesheet({ id: CARET_KEYFRAMES_ID, css: CARET_KEYFRAMES_CSS })

  const masked = inputType === 'password'
  const length = digits.length
  const value = digits.join('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const registerInput = (el: HTMLInputElement | null): void => {
    inputRef.current = el
    // Every cell index points at the one input, so focus-advance is a no-op (INFRA-2144).
    const focusable = el ? { focus: (): void => el.focus(), blur: (): void => el.blur() } : null
    for (let i = 0; i < length; i++) {
      refs.current[i] = focusable
    }
  }

  // Keep the caret at the end; edits are always append or delete-last.
  const pinCaretToEnd = (): void => {
    const el = inputRef.current
    if (el && (el.selectionStart !== el.value.length || el.selectionEnd !== el.value.length)) {
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const next = e.target.value.replace(/\D/g, '').slice(0, length)
    if (next === value) {
      return
    }
    if (next.length === value.length + 1 && next.startsWith(value)) {
      onChange(value.length, next[value.length] ?? '')
    } else if (next.length === value.length - 1 && value.startsWith(next)) {
      onChange(next.length, '')
    } else {
      // Bulk change (OTP autofill, paste suggestion) → paste path.
      onPaste({ preventDefault: () => {}, clipboardData: { getData: () => next } })
    }
  }

  const activeIndex = Math.min(value.length, length - 1)

  return (
    <Flex row gap="$gap8" justifyContent="center" alignSelf="stretch" position="relative">
      {digits.map((digit, index) => {
        const isActive = isFocused && !disabled && index === activeIndex
        return (
          <Flex
            key={index}
            aria-hidden={true}
            className="digit-input-cell"
            flex={1}
            minWidth={0}
            maxWidth={56}
            height={60}
            alignItems="center"
            justifyContent="center"
            borderRadius="$rounded16"
            backgroundColor="$surface2"
            borderWidth={isActive ? 1.5 : 1}
            borderColor={isActive ? '$neutral1' : '$surface3'}
          >
            {digit ? (
              <Text color="$neutral1" fontSize={masked ? 28 : 20} fontWeight="500">
                {masked ? '•' : digit}
              </Text>
            ) : (
              isActive && (
                <Flex width={1.5} height={24} backgroundColor="$neutral1" style={{ animation: CARET_ANIMATION }} />
              )
            )}
          </Flex>
        )
      })}
      <input
        ref={registerInput}
        type="text"
        inputMode="numeric"
        autoComplete={masked ? 'off' : 'one-time-code'}
        data-1p-ignore={masked ? '' : undefined}
        data-lpignore={masked ? 'true' : undefined}
        maxLength={length}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        style={HIDDEN_INPUT_STYLE}
        onChange={handleInputChange}
        onFocus={() => {
          setIsFocused(true)
          pinCaretToEnd()
        }}
        onBlur={() => setIsFocused(false)}
        onSelect={pinCaretToEnd}
        onPaste={onPaste}
      />
    </Flex>
  )
}
