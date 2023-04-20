import { TamaguiProviderProps } from 'ui/src'
import { Provider as TamaguiProvider } from './tamagui-provider'
import { Provider as ReduxProvider } from 'react-redux'
import { Store } from '@reduxjs/toolkit'
import { GraphqlProvider } from '../data/client'

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
