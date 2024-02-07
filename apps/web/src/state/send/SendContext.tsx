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
import { useSwapAndLimitContext } from 'state/swap/SwapContext'

export type SendState =
  | {
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
    inputError: undefined,
  },
})

export function useSendContext() {
  return useContext(SendContext)
}

export function SendContextProvider({ children }: PropsWithChildren) {
  const {
    currencyState: { inputCurrency, outputCurrency },
  } = useSwapAndLimitContext()

  const initialCurrency = useMemo(() => {
    return inputCurrency ?? outputCurrency
  }, [inputCurrency, outputCurrency])

  const [sendState, setSendState] = useState<SendState>({ ...DEFAULT_SEND_STATE, inputCurrency: initialCurrency })
  const derivedSendInfo = useDerivedSendInfo(sendState)

  useEffect(() => {
    setSendState((prev) => ({ ...prev, inputCurrency: initialCurrency }))
  }, [initialCurrency])

  const value = useMemo(
    () => ({
      sendState,
      setSendState,
      derivedSendInfo,
    }),
    [derivedSendInfo, setSendState, sendState]
  )

  return <SendContext.Provider value={value}>{children}</SendContext.Provider>
}
