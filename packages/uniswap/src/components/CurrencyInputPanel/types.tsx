import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ReactNode, RefObject } from 'react'
import type { TextInput, TextInputProps } from 'react-native'
import { FlexProps, TextProps } from 'ui/src'
import { FontSizeOptions } from 'ui/src/hooks/useDynamicFontSizing'
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
  onBlur?: TextInputProps['onBlur']
  resetSelection?: (args: { start: number; end?: number; currencyField?: CurrencyField }) => void
  tokenColor?: string
  priceDifferencePercentage?: number
  customPanelStyle?: FlexProps
  /** Hide all preset buttons (both standard percentage presets and max button) */
  hidePresets?: boolean
  panelAccessory?: ReactNode
  disablePressAnimation?: boolean
  fontSizeOptions?: Partial<FontSizeOptions>
  fiatValueVariant?: TextProps['variant']
  inputRowPaddingVertical?: FlexProps['py']
  panelAccessoryPaddingTop?: FlexProps['mt']
  inputRowMinHeight?: FlexProps['minHeight']
  /** Optional suffix to display after the input value (e.g., token symbol like "ETH") */
  inputSuffix?: string
  /** Allow content to overflow the panel container (e.g., for tooltips in panelAccessory) */
  allowOverflow?: boolean
}
