import { useColorScheme } from 'react-native'
import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'ui/src'
import config from 'wallet/src/tamagui.config'

// without <NavigationProvider>
// this exported Provider is useful for tests

export function TamaguiProvider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  const scheme = useColorScheme()
  return (
    <OGTamaguiProvider
      config={config}
      defaultTheme={scheme === 'dark' ? 'dark' : 'light'}
      disableInjectCSS={false /* !process.env.STORYBOOK} */}
      {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
