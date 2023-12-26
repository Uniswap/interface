import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useDerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType, TradeableAsset } from 'wallet/src/entities/assets'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

export type SwapFormState = {
  customSlippageTolerance?: number
  exactAmountFiat?: string
  exactAmountToken?: string
  exactCurrencyField: CurrencyField
  focusOnCurrencyField?: CurrencyField
  input?: TradeableAsset
  output?: TradeableAsset
  selectingCurrencyField?: CurrencyField
  txId?: string
  isFiatMode: boolean
  isSubmitting: boolean
}

type DerivedSwapFormState = {
  derivedSwapInfo: ReturnType<typeof useDerivedSwapInfo>
}

type SwapFormContextState = {
  amountUpdatedTimeRef: React.MutableRefObject<number>
  exactAmountFiatRef: React.MutableRefObject<string>
  exactAmountTokenRef: React.MutableRefObject<string>
  onClose: () => void
  setSwapForm: Dispatch<SetStateAction<SwapFormState>>
  updateSwapForm: (newState: Partial<SwapFormState>) => void
} & SwapFormState &
  DerivedSwapFormState

const ETH_TRADEABLE_ASSET: Readonly<TradeableAsset> = {
  address: getNativeAddress(ChainId.Mainnet),
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
  isFiatMode: false,
  isSubmitting: false,
}

export const SwapFormContext = createContext<SwapFormContextState | undefined>(undefined)

export function SwapFormContextProvider({
  children,
  prefilledState,
  onClose,
}: {
  children: ReactNode
  prefilledState?: SwapFormState
  onClose: () => void
}): JSX.Element {
  const amountUpdatedTimeRef = useRef<number>(0)
  const exactAmountFiatRef = useRef<string>('')
  const exactAmountTokenRef = useRef<string>('')
  const [swapForm, setSwapForm] = useState<SwapFormState>(prefilledState ?? DEFAULT_STATE)

  const updateSwapForm = useCallback(
    (newState: Parameters<SwapFormContextState['updateSwapForm']>[0]): void => {
      if ('exactAmountFiat' in newState || 'exactAmountToken' in newState) {
        amountUpdatedTimeRef.current = Date.now()
      }

      if ('exactAmountFiat' in newState) {
        exactAmountFiatRef.current = newState.exactAmountFiat ?? ''
      }

      if ('exactAmountToken' in newState) {
        exactAmountTokenRef.current = newState.exactAmountToken ?? ''
      }

      setSwapForm((prevState) => ({ ...prevState, ...newState }))
    },
    [setSwapForm]
  )

  const derivedSwapInfo = useDerivedSwapInfo({
    txId: swapForm.txId,
    input: swapForm.input ?? null,
    output: swapForm.output ?? null,
    exactCurrencyField: swapForm.exactCurrencyField,
    exactAmountToken: swapForm.exactAmountToken ?? '',
    exactAmountFiat: swapForm.exactAmountFiat,
    focusOnCurrencyField: swapForm.focusOnCurrencyField,
    selectingCurrencyField: swapForm.selectingCurrencyField,
    customSlippageTolerance: swapForm.customSlippageTolerance,
  })

  const state = useMemo<SwapFormContextState>(
    (): SwapFormContextState => ({
      amountUpdatedTimeRef,
      customSlippageTolerance: swapForm.customSlippageTolerance,
      derivedSwapInfo,
      exactAmountFiat: swapForm.exactAmountFiat,
      exactAmountFiatRef,
      exactAmountToken: swapForm.exactAmountToken,
      exactAmountTokenRef,
      exactCurrencyField: swapForm.exactCurrencyField,
      focusOnCurrencyField: swapForm.focusOnCurrencyField,
      input: swapForm.input,
      isFiatMode: swapForm.isFiatMode,
      isSubmitting: swapForm.isSubmitting,
      onClose,
      output: swapForm.output,
      selectingCurrencyField: swapForm.selectingCurrencyField,
      setSwapForm,
      txId: swapForm.txId,
      updateSwapForm,
    }),
    [
      swapForm.customSlippageTolerance,
      swapForm.exactAmountFiat,
      swapForm.exactAmountToken,
      swapForm.exactCurrencyField,
      swapForm.focusOnCurrencyField,
      swapForm.input,
      swapForm.isFiatMode,
      swapForm.isSubmitting,
      swapForm.output,
      swapForm.selectingCurrencyField,
      swapForm.txId,
      onClose,
      updateSwapForm,
      derivedSwapInfo,
    ]
  )

  return <SwapFormContext.Provider value={state}>{children}</SwapFormContext.Provider>
}

export const useSwapFormContext = (): SwapFormContextState => {
  const swapContext = useContext(SwapFormContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapFormContext` must be used inside of `SwapFormContextProvider`')
  }

  return swapContext
}
