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
  hideFooter?: boolean
  hideSettings?: boolean
  prefilledCurrencies?: TradeableAsset[]
  isPrefilled?: boolean
  // this (change in native asset) tells us if any transaction was completed by the user
  // used because eth_balance is flashblocks aware but eth_call (ie token balance fetches) are not
  preSwapNativeAssetAmountRaw?: string
  preSwapDataPreserved?: {
    currencyId: string
    outputBalanceRaw: string
    /** use `currencyAmounts` for business logic; this one is not cleared when the swap is completed **/
    preSwapOutputAmountEstimateExact: string
  }
  postSwapDataPreserved?: {
    currencyId: string
    outputBalanceRaw: string
  }
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
