import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { RefObject } from 'react'
import type { TextInput, TextInputProps } from 'react-native'
import { FlexProps } from 'ui/src'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

export type CurrencyInputPanelRef = {
  textInputRef: RefObject<TextInput | null>
  triggerShakeAnimation: () => void
}

export type CurrencyInputPanelProps = {
  autoFocus?: boolean
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyField: CurrencyField
  currencyInfo: Maybe<CurrencyInfo>
  isLoading?: boolean
  isIndicativeLoading?: boolean
  focus?: boolean
  isFiatMode?: boolean
  /** Only show a single max button rather than all percentage preset options. */
  showMaxButtonOnly?: boolean
  onPressIn?: () => void
  onSelectionChange?: (start: number, end: number) => void
  onSetExactAmount: (amount: string) => void
  onSetPresetValue?: (amount: string, percentage: PresetPercentage) => void
  onShowTokenSelector?: () => void
  onToggleIsFiatMode: (currencyField: CurrencyField) => void
  selection?: TextInputProps['selection']
  showSoftInputOnFocus?: boolean
  transactionType?: TransactionType
  usdValue: Maybe<CurrencyAmount<Currency>>
  value?: string
  valueIsIndicative?: boolean
  headerLabel?: string
  disabled?: boolean
  onPressDisabled?: () => void
  resetSelection?: (args: { start: number; end?: number; currencyField?: CurrencyField }) => void
  tokenColor?: string
  priceDifferencePercentage?: number
  customPanelStyle?: FlexProps
  maxValuationPresets?: number[]
  onSetMaxValuation?: (value: number) => void
}
