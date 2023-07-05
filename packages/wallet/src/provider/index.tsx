import { Store } from '@reduxjs/toolkit'
import { ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { TamaguiProvider } from './tamagui-provider'

interface SharedProviderProps {
  children: ReactNode
  reduxStore: Store
}

// A provider meant for sharing across all surfaces.
// Props should be defined as needed and clarified in name to improve readability
export function SharedProvider({ reduxStore, children }: SharedProviderProps): JSX.Element {
  return (
    <ReduxProvider store={reduxStore}>
      <TamaguiProvider>{children}</TamaguiProvider>
    </ReduxProvider>
  )
}
