import { TamaguiProviderProps } from 'ui/src'
import { NavigationProvider } from './navigation'
import { Provider as TamaguiProvider } from './tamagui-provider'
import { Provider as ReduxProvider } from 'react-redux'

export function Provider({
  children,
  store,
  ...rest
}: Omit<TamaguiProviderProps, 'config'> & { store: any }): JSX.Element {
  return (
    <ReduxProvider store={store}>
      <TamaguiProvider {...rest}>
        <NavigationProvider>{children}</NavigationProvider>
      </TamaguiProvider>
    </ReduxProvider>
  )
}
