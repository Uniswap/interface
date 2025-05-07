import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { createContext, useContext, type MutableRefObject } from 'react'
import type { TextInputProps } from 'react-native'
import { CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/PresetAmountButton'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { DecimalPadInputRef } from 'uniswap/src/features/transactions/DecimalPadInput/DecimalPadInput'
import { useSwapFormHoverStyles } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/hooks/useSwapFormHoverStyles'
import { TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { CurrencyField } from 'uniswap/src/types/currency'

export interface SwapFormScreenContextState {
  // References
  inputRef: MutableRefObject<CurrencyInputPanelRef | null>
  outputRef: MutableRefObject<CurrencyInputPanelRef | null>
  decimalPadRef: MutableRefObject<DecimalPadInputRef | null>
  inputSelectionRef: MutableRefObject<TextInputProps['selection'] | undefined>
  outputSelectionRef: MutableRefObject<TextInputProps['selection'] | undefined>
  decimalPadValueRef: MutableRefObject<string>

  // State values
  focusOnCurrencyField: CurrencyField | undefined
  currencies: { [field in CurrencyField]: Maybe<CurrencyInfo> }
  currencyAmounts: { [field in CurrencyField]: Maybe<CurrencyAmount<Currency>> }
  currencyBalances: { [field in CurrencyField]: Maybe<CurrencyAmount<Currency>> }
  selectingCurrencyField: CurrencyField | undefined
  isFiatMode: boolean
  exactFieldIsInput: boolean
  exactFieldIsOutput: boolean
  exactOutputDisabled: boolean
  isSwapDataLoading: boolean
  resetSelection: (params: { start: number; end?: number; currencyField?: CurrencyField }) => void
  currencyAmountsUSDValue: { [field in CurrencyField]: Maybe<CurrencyAmount<Currency>> }
  exactValue: string | undefined
  formattedDerivedValue: string
  tokenColor?: string
  walletNeedsRestore: boolean | undefined
  showFooter: boolean
  showWarning: boolean | undefined
  outputTokenHasBuyTax: boolean
  exactAmountToken: string | undefined
  isBridge: boolean

  // Trade-related values
  trade: TradeWithStatus

  // Event handlers
  onFocusInput: () => void
  onInputSelectionChange: (start: number, end: number) => void
  onSetExactAmountInput: (amount: string) => void
  onSetPresetValue: (amount: string, percentage: PresetPercentage) => void
  onShowTokenSelectorInput: () => void
  onToggleIsFiatMode: (currencyField: CurrencyField) => void
  onSwitchCurrencies: () => void
  onFocusOutput: () => void
  onOutputSelectionChange: (start: number, end: number) => void
  onSetExactAmountOutput: (amount: string) => void
  onShowTokenSelectorOutput: () => void
  showTemporaryFoTWarning: () => void
  onDecimalPadTriggerInputShake: () => void

  // Styles
  hoverStyles: ReturnType<typeof useSwapFormHoverStyles>
}

export const SwapFormScreenContext = createContext<SwapFormScreenContextState | undefined>(undefined)

export function useSwapFormScreenState(): SwapFormScreenContextState {
  const context = useContext(SwapFormScreenContext)
  if (!context) {
    throw new Error('useSwapFormScreenState must be used within a SwapFormScreenContextProvider')
  }
  return context
}
