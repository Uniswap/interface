import type { DigitInputState } from 'uniswap/src/components/passkey/recovery/useDigitInput'

export interface DigitInputRowProps {
  digits: DigitInputState['digits']
  refs: DigitInputState['refs']
  onChange: DigitInputState['handleChange']
  onKeyDown: DigitInputState['handleKeyDown']
  onPaste: DigitInputState['handlePaste']
  /** 'text' reveals digits; 'password' masks them. Defaults to 'text'. */
  inputType?: 'text' | 'password'
  autoFocus?: boolean
  disabled?: boolean
}
