import { TamaguiProvider, TamaguiProviderProps } from 'ui/src'
import { useColorScheme } from 'react-native'
import config from '../tamagui.config'

// without <NavigationProvider>
// this exported Provider is useful for tests

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  const scheme = useColorScheme()
  return (
    <TamaguiProvider
      config={config}
      defaultTheme={scheme === 'dark' ? 'dark' : 'light'}
      disableInjectCSS={!process.env.STORYBOOK}
      {...rest}>
      {children}
    </TamaguiProvider>
  )
}
