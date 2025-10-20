import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { MutableRefObject } from 'react'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import type { CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import type { TextInputProps } from 'uniswap/src/components/input/TextInput'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { DecimalPadInputRef } from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput'
import {
  stateReplacerSerializer,
  stateReviverDeserializer,
} from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/devUtils'
import type { TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import type { CurrencyField } from 'uniswap/src/types/currency'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapFormScreenStoreState = {
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
  resetSelection: (params: { start: number; end?: number; currencyField?: CurrencyField }) => void
  currencyAmountsUSDValue: { [field in CurrencyField]: Maybe<CurrencyAmount<Currency>> }
  exactValue: string | undefined
  formattedDerivedValue: string
  tokenColor?: string
  walletNeedsRestore: boolean | undefined
  showFooter: boolean
  showExactOutputUnavailableWarning: boolean | undefined
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
  showTemporaryExactOutputUnavailableWarning: () => void
  onDecimalPadTriggerInputShake: () => void
}

export type SwapFormScreenStore = UseBoundStore<StoreApi<SwapFormScreenStoreState>>

export const createSwapFormScreenStore = (initialState: SwapFormScreenStoreState): SwapFormScreenStore =>
  create<SwapFormScreenStoreState>()(
    devtools(() => initialState, {
      name: 'useSwapFormScreenStore',
      enabled: isDevEnv(),
      trace: true,
      traceLimit: 25,
      serialize: {
        replacer: stateReplacerSerializer,
        reviver: stateReviverDeserializer,
      },
    }),
  )
