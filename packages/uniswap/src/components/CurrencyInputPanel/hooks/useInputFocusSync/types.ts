import { RefObject } from 'react'
import type { TextInput } from 'react-native'
import type { CurrencyField } from 'uniswap/src/types/currency'

export interface UseInputFocusSyncProps {
  inputRef: RefObject<TextInput | null>
  focus?: boolean
  value?: string
  currencyField: CurrencyField
  resetSelection?: (args: { start: number; end?: number; currencyField?: CurrencyField }) => void
}
