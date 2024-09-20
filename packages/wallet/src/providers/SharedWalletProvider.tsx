import { Store } from '@reduxjs/toolkit'
import { ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { SharedPersistQueryClientProvider } from 'uniswap/src/data/apiClients/SharedPersistQueryClientProvider'
import { TamaguiProvider } from 'wallet/src/providers/tamagui-provider'

interface SharedProviderProps {
  children: ReactNode
  reduxStore: Store
}

// A provider meant for sharing across all surfaces.
// Props should be defined as needed and clarified in name to improve readability
export function SharedWalletProvider({ reduxStore, children }: SharedProviderProps): JSX.Element {
  return (
    <ReduxProvider store={reduxStore}>
      <SharedPersistQueryClientProvider>
        <TamaguiProvider>{children}</TamaguiProvider>
      </SharedPersistQueryClientProvider>
    </ReduxProvider>
  )
}
