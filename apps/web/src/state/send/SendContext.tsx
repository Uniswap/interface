import { Currency } from '@uniswap/sdk-core'
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { RecipientData, SendInfo, useDerivedSendInfo } from 'state/send/hooks'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

export type SendState = {
  readonly exactAmountToken?: string
  readonly exactAmountFiat?: string
  readonly recipient: string
  readonly inputCurrency?: Currency
  readonly inputInFiat: boolean
  readonly validatedRecipientData?: RecipientData
} & (
  | {
      readonly exactAmountToken: string
      readonly exactAmountFiat: undefined
      readonly inputInFiat: false
    }
  | {
      readonly exactAmountFiat: string
      readonly exactAmountToken: undefined
      readonly inputInFiat: true
    }
)

export type SendContextType = {
  sendState: SendState
  derivedSendInfo: SendInfo
  setSendState: Dispatch<SetStateAction<SendState>>
}

const DEFAULT_SEND_STATE: SendState = {
  exactAmountToken: undefined,
  exactAmountFiat: '',
  recipient: '',
  inputCurrency: undefined,
  inputInFiat: true,
  validatedRecipientData: undefined,
}

const DEFAULT_TESTNET_SEND_STATE: SendState = {
  exactAmountToken: '',
  exactAmountFiat: undefined,
  recipient: '',
  inputCurrency: undefined,
  inputInFiat: false,
  validatedRecipientData: undefined,
}

// exported for testing
export const SendContext = createContext<SendContextType>({
  sendState: DEFAULT_SEND_STATE,
  setSendState: () => undefined,
  derivedSendInfo: {
    currencyBalance: undefined,
    parsedTokenAmount: undefined,
    exactAmountOut: undefined,
    recipientData: undefined,
    transaction: undefined,
    gasFeeCurrencyAmount: undefined,
    gasFee: undefined,
    inputError: undefined,
  },
})

export function useSendContext() {
  return useContext(SendContext)
}

export function SendContextProvider({ children }: PropsWithChildren) {
  const {
    currencyState: { inputCurrency, outputCurrency },
    setCurrencyState,
  } = useSwapAndLimitContext()

  const { isTestnetModeEnabled } = useEnabledChains()

  const initialCurrency = useMemo(() => {
    return inputCurrency ?? outputCurrency
  }, [inputCurrency, outputCurrency])

  const [sendState, setSendState] = useState<SendState>({
    ...(isTestnetModeEnabled ? DEFAULT_TESTNET_SEND_STATE : DEFAULT_SEND_STATE),
    inputCurrency: initialCurrency,
  })

  useEffect(() => {
    if (isTestnetModeEnabled) {
      setSendState((prev) => ({
        ...prev,
        exactAmountToken: prev.inputInFiat ? '' : prev.exactAmountToken,
        exactAmountFiat: undefined,
        inputInFiat: false,
      }))
    }
  }, [isTestnetModeEnabled])

  const derivedSendInfo = useDerivedSendInfo(sendState)

  useEffect(() => {
    setSendState((prev) => ({ ...prev, inputCurrency: initialCurrency }))
  }, [initialCurrency])

  useEffect(() => {
    setCurrencyState((prev) => {
      if (prev.inputCurrency?.chainId !== sendState.inputCurrency?.chainId) {
        // if token on different chain is selected, clear currency state
        return { inputCurrency: sendState.inputCurrency }
      } else if (outputCurrency && sendState.inputCurrency?.equals(outputCurrency)) {
        // if selected token is same as currencyState's output token, clear output token
        return { ...prev, outputCurrency: undefined, inputCurrency: sendState.inputCurrency }
      } else {
        // else update currencyState as usual
        return { ...prev, inputCurrency: sendState.inputCurrency }
      }
    })
  }, [outputCurrency, sendState.inputCurrency, setCurrencyState])

  const value = useMemo(
    () => ({
      sendState,
      setSendState,
      derivedSendInfo,
    }),
    [derivedSendInfo, sendState],
  )

  return <SendContext.Provider value={value}>{children}</SendContext.Provider>
}
