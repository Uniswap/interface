import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

export enum TransferScreen {
  SendForm,
  SendReview,
}

export enum TransferEntryType {
  Fiat,
  Crypto,
}

type TransferContextState = {
  amount: string | null
  setAmount: Dispatch<SetStateAction<string | null>>
  entryType: TransferEntryType
  setEntryType: Dispatch<SetStateAction<TransferEntryType>>
  recipient: string | null
  setRecipient: Dispatch<SetStateAction<string | null>>
  screen: TransferScreen
  setScreen: Dispatch<SetStateAction<TransferScreen>>
  token: CurrencyInfo | null
  setToken: Dispatch<SetStateAction<CurrencyInfo | null>>
}

export const TransferContext = createContext<TransferContextState | undefined>(undefined)

export function TransferContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const [amount, setAmount] = useState<string | null>(null)
  const [entryType, setEntryType] = useState<TransferEntryType>(TransferEntryType.Fiat)
  const [recipient, setRecipient] = useState<string | null>(null)
  const [screen, setScreen] = useState<TransferScreen>(TransferScreen.SendForm)
  const [token, setToken] = useState<CurrencyInfo | null>(null)

  return (
    <TransferContext.Provider
      value={{
        amount,
        setAmount,
        entryType,
        setEntryType,
        recipient,
        setRecipient,
        screen,
        setScreen,
        token,
        setToken,
      }}>
      {children}
    </TransferContext.Provider>
  )
}

export const useTransferContext = (): TransferContextState => {
  const transferContext = useContext(TransferContext)

  if (transferContext === undefined) {
    throw new Error('`useTransferContext` must be used inside of `TransferContextProvider`')
  }

  return transferContext
}
