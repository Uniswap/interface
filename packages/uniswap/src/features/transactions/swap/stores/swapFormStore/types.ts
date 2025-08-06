import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import type { TradeableAsset } from 'uniswap/src/entities/assets'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { CurrencyField } from 'uniswap/src/types/currency'

// Making this type alias exactly the same as it was before migrating from using Context to zustand
export type SwapFormState = {
  exactAmountFiat?: string
  exactAmountToken?: string
  exactCurrencyField: CurrencyField
  focusOnCurrencyField?: CurrencyField
  filteredChainIds?: { [key in CurrencyField]?: UniverseChainId }
  input?: TradeableAsset
  output?: TradeableAsset
  selectingCurrencyField?: CurrencyField
  isSelectingCurrencyFieldPrefilled?: boolean
  txId?: string
  isFiatMode: boolean
  isMax: boolean
  presetPercentage?: PresetPercentage
  preselectAsset?: boolean
  isSubmitting: boolean
  showPendingUI: boolean
  isConfirmed: boolean
  /** The actual transaction hash once it is known (interface only) */
  txHash?: string
  /** The time when the transaction hash was received (interface only) */
  txHashReceivedTime?: number
  hideFooter?: boolean
  hideSettings?: boolean
  prefilledCurrencies?: TradeableAsset[]
  isPrefilled?: boolean
  instantOutputAmountRaw?: string
  instantReceiptFetchTime?: number
}

type SwapFormMethods = {
  // putting `updateSwapForm` here as its reference does, indeed, change
  updateSwapForm: (newState: Partial<SwapFormState>) => void
}

type SwapFormRefs = {
  amountUpdatedTimeRef: React.MutableRefObject<number>
  exactAmountFiatRef: React.MutableRefObject<string>
  exactAmountTokenRef: React.MutableRefObject<string>
}

type DerivedSwapFormState = {
  derivedSwapInfo: DerivedSwapInfo
}

export type SwapFormStateForConsumers = SwapFormState & SwapFormMethods & SwapFormRefs & DerivedSwapFormState

// These are meant for internal use within useSwapFormStore
type SwapFormActions = {
  setSwapFormState: (newState: Partial<SwapFormStateForConsumers>) => void
  setUpdateSwapForm: (newUpdateSwapForm: (newState: Partial<SwapFormStateForConsumers>) => void) => void
}

export type SwapFormStoreState = SwapFormStateForConsumers & {
  actions: SwapFormActions
}
