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
}

type DerivedSwapFormState = {
  isFiatInput: boolean
  derivedSwapInfo: ReturnType<typeof useDerivedSwapInfo>
}

type SwapFormContextState = {
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
  const exactAmountFiatRef = useRef<string>('')
  const exactAmountTokenRef = useRef<string>('')
  const [swapForm, setSwapForm] = useState<SwapFormState>(prefilledState ?? DEFAULT_STATE)

  const updateSwapForm = useCallback(
    (newState: Parameters<SwapFormContextState['updateSwapForm']>[0]): void => {
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

  const isFiatInput = useMemo<boolean>(
    () => swapForm.exactAmountFiat !== undefined,
    [swapForm.exactAmountFiat]
  )

  const derivedSwapInfo = useDerivedSwapInfo({
    txId: swapForm.txId,
    input: swapForm.input ?? null,
    output: swapForm.output ?? null,
    exactCurrencyField: swapForm.exactCurrencyField,
    exactAmountToken: swapForm.exactAmountToken ?? '',
    exactAmountUSD: swapForm.exactAmountFiat,
    focusOnCurrencyField: swapForm.focusOnCurrencyField,
    isUSDInput: isFiatInput,
    selectingCurrencyField: swapForm.selectingCurrencyField,
    customSlippageTolerance: swapForm.customSlippageTolerance,
  })

  const state = useMemo<SwapFormContextState>(
    (): SwapFormContextState => ({
      customSlippageTolerance: swapForm.customSlippageTolerance,
      exactAmountFiat: swapForm.exactAmountFiat,
      exactAmountFiatRef,
      exactAmountToken: swapForm.exactAmountToken,
      exactAmountTokenRef,
      exactCurrencyField: swapForm.exactCurrencyField,
      focusOnCurrencyField: swapForm.focusOnCurrencyField,
      input: swapForm.input,
      isFiatInput,
      onClose,
      output: swapForm.output,
      selectingCurrencyField: swapForm.selectingCurrencyField,
      setSwapForm,
      txId: swapForm.txId,
      updateSwapForm,
      derivedSwapInfo,
    }),
    [
      derivedSwapInfo,
      isFiatInput,
      onClose,
      swapForm.customSlippageTolerance,
      swapForm.exactAmountFiat,
      swapForm.exactAmountToken,
      swapForm.exactCurrencyField,
      swapForm.focusOnCurrencyField,
      swapForm.input,
      swapForm.output,
      swapForm.selectingCurrencyField,
      swapForm.txId,
      updateSwapForm,
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
