import { Store } from '@reduxjs/toolkit'
import { Provider as ReduxProvider } from 'react-redux'
import { TamaguiProviderProps } from 'ui/src'
import { GraphqlProvider } from '../data/client'
import { Provider as TamaguiProvider } from './tamagui-provider'

export function Provider({
  children,
  store,
  ...rest
}: Omit<TamaguiProviderProps, 'config'> & { store: Store }): JSX.Element {
  return (
    <ReduxProvider store={store}>
      <TamaguiProvider {...rest}>
        <GraphqlProvider>{children}</GraphqlProvider>
      </TamaguiProvider>
    </ReduxProvider>
  )
}
