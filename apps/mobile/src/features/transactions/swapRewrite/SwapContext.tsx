import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { NATIVE_ADDRESS } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType, TradeableAsset } from 'wallet/src/entities/assets'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

export enum SwapScreen {
  SwapForm,
  SwapReview,
}

export type SwapFormState = {
  customSlippageTolerance?: number
  exactAmountFiat?: string
  exactAmountToken?: string
  exactCurrencyField: CurrencyField
  focusOnCurrencyField?: CurrencyField
  input?: TradeableAsset
  output?: TradeableAsset
  screen: SwapScreen
  selectingCurrencyField?: CurrencyField
  txId?: string
}

type DerivedSwapFormState = {
  isFiatInput: boolean
}

type SwapContextState = {
  onClose: () => void
  setSwapForm: Dispatch<SetStateAction<SwapFormState>>
  updateSwapForm: (newState: Partial<SwapFormState>) => void
} & SwapFormState &
  DerivedSwapFormState

const ETH_TRADEABLE_ASSET: Readonly<TradeableAsset> = {
  address: NATIVE_ADDRESS,
  chainId: ChainId.Mainnet,
  type: AssetType.Currency,
}

const DEFAULT_STATE: Readonly<SwapFormState> = {
  exactAmountFiat: undefined,
  exactAmountToken: '',
  exactCurrencyField: CurrencyField.INPUT,
  focusOnCurrencyField: CurrencyField.INPUT,
  input: ETH_TRADEABLE_ASSET,
  output: undefined,
  screen: SwapScreen.SwapForm,
}

export const SwapContext = createContext<SwapContextState | undefined>(undefined)

export function SwapContextProvider({
  children,
  prefilledState,
  onClose,
}: {
  children: ReactNode
  prefilledState?: SwapFormState
  onClose: () => void
}): JSX.Element {
  const [swapForm, setSwapForm] = useState<SwapFormState>(prefilledState ?? DEFAULT_STATE)

  const updateSwapForm = useCallback(
    (newState: Parameters<SwapContextState['updateSwapForm']>[0]): void => {
      setSwapForm((prevState) => ({ ...prevState, ...newState }))
    },
    [setSwapForm]
  )

  const state = useMemo<SwapContextState>(
    (): SwapContextState => ({
      customSlippageTolerance: swapForm.customSlippageTolerance,
      exactAmountFiat: swapForm.exactAmountFiat,
      exactAmountToken: swapForm.exactAmountToken,
      exactCurrencyField: swapForm.exactCurrencyField,
      focusOnCurrencyField: swapForm.focusOnCurrencyField,
      input: swapForm.input,
      isFiatInput: swapForm.exactAmountFiat !== undefined,
      onClose,
      output: swapForm.output,
      screen: swapForm.screen,
      selectingCurrencyField: swapForm.selectingCurrencyField,
      setSwapForm,
      txId: swapForm.txId,
      updateSwapForm,
    }),
    [
      onClose,
      swapForm.customSlippageTolerance,
      swapForm.exactAmountFiat,
      swapForm.exactAmountToken,
      swapForm.exactCurrencyField,
      swapForm.focusOnCurrencyField,
      swapForm.input,
      swapForm.output,
      swapForm.screen,
      swapForm.selectingCurrencyField,
      swapForm.txId,
      updateSwapForm,
    ]
  )

  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>
}

export const useSwapContext = (): SwapContextState => {
  const swapContext = useContext(SwapContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapContext` must be used inside of `SwapContextProvider`')
  }

  return swapContext
}
