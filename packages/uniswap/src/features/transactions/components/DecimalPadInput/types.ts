export enum KeyAction {
  Insert = 'insert',
  Delete = 'delete',
}

export type KeyLabel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '0' | 'backspace'

export interface DecimalPadProps {
  disabled?: boolean
  hideDecimal?: boolean
  disabledKeys?: Partial<Record<KeyLabel, boolean>>
  maxHeight: number | null
  onKeyPress?: (label: KeyLabel, action: KeyAction) => void
  onKeyLongPressStart?: (label: KeyLabel, action: KeyAction) => void
  onKeyLongPressEnd?: (label: KeyLabel, action: KeyAction) => void
  onReady: () => void
  onTriggerInputShakeAnimation: () => void
}
