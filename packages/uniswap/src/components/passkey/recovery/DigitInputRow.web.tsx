import type { CSSProperties } from 'react'
import { Flex } from 'ui/src'
import type { DigitInputRowProps } from 'uniswap/src/components/passkey/recovery/DigitInputRow.types'

const DIGIT_INPUT_CSS = `
  .digit-input-cell {
    border: 1px solid var(--surface3);
  }
  .digit-input-cell:focus {
    border: 1.5px solid var(--neutral1);
  }
`

export function DigitInputRow({
  digits,
  refs,
  onChange,
  onKeyDown,
  onPaste,
  inputType = 'text',
  autoFocus = false,
  disabled = false,
}: DigitInputRowProps): JSX.Element {
  const masked = inputType === 'password'
  return (
    <Flex row gap="$gap8" justifyContent="center" alignSelf="stretch">
      <style>{DIGIT_INPUT_CSS}</style>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          className="digit-input-cell"
          // Always type="text" so Android honors inputMode="numeric"; mask via CSS to keep the numeric keypad on show/hide toggle.
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          style={
            {
              flex: 1,
              minWidth: 0,
              maxWidth: 56,
              height: 60,
              textAlign: 'center',
              fontSize: masked ? 28 : 20,
              fontWeight: 500,
              borderRadius: 16,
              background: 'var(--surface2)',
              color: 'var(--neutral1)',
              outline: 'none',
              WebkitTextSecurity: masked ? 'disc' : 'none',
              textSecurity: masked ? 'disc' : 'none',
            } as CSSProperties
          }
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={index === 0 ? onPaste : undefined}
        />
      ))}
    </Flex>
  )
}
