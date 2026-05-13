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
          type={inputType}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          style={{
            flex: 1,
            minWidth: 0,
            height: 60,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 500,
            borderRadius: 16,
            background: 'var(--surface2)',
            color: 'var(--neutral1)',
            outline: 'none',
          }}
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={index === 0 ? onPaste : undefined}
        />
      ))}
    </Flex>
  )
}
