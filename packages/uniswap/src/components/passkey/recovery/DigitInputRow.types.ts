import type { DigitInputState } from 'uniswap/src/components/passkey/recovery/useDigitInput'

export interface DigitInputRowProps {
  digits: DigitInputState['digits']
  refs: DigitInputState['refs']
  onChange: DigitInputState['handleChange']
  onKeyDown: DigitInputState['handleKeyDown']
  /**
   * Also called with a synthetic event for bulk changes (OTP autofill, paste), so handlers
   * may only use `preventDefault()` and `clipboardData.getData(type)` — not `items`, the
   * target, or other native paste-event fields.
   */
  onPaste: DigitInputState['handlePaste']
  /** 'text' reveals digits; 'password' masks them. Defaults to 'text'. */
  inputType?: 'text' | 'password'
  autoFocus?: boolean
  disabled?: boolean
}
