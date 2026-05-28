import type { PropsWithChildren } from 'react'
import { TransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/TransactionSettingsStoreContextProvider'

export function SwapTransactionSettingsStoreContextProvider({ children }: PropsWithChildren): JSX.Element {
  return <TransactionSettingsStoreContextProvider>{children}</TransactionSettingsStoreContextProvider>
}
