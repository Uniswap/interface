import { useColorScheme } from 'react-native'
import { tamaguiConfig, TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'ui/src'

// without <NavigationProvider>
// this exported Provider is useful for tests

export function TamaguiProvider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  const scheme = useColorScheme()
  return (
    <OGTamaguiProvider
      config={tamaguiConfig}
      defaultTheme={scheme === 'dark' ? 'dark' : 'light'}
      disableInjectCSS={false /* !process.env.STORYBOOK} */}
      {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
