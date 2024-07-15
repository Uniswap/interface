import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'ui/src'
import { config } from 'ui/src/tamagui.config'
import { useSelectedColorScheme } from 'wallet/src/features/appearance/hooks'

// without <NavigationProvider>
// this exported Provider is useful for tests

export function TamaguiProvider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  // because we dont always want to wrap all of redux for visual tests, make it default to false if in test mode
  // this should be done better but release needs hotfix so for now it works
  const userSelectedColorScheme = useSelectedColorScheme()
  const isDark = process.env.NODE_ENV === 'test' ? false : userSelectedColorScheme === 'dark'

  return (
    <OGTamaguiProvider config={config} defaultTheme={isDark ? 'dark' : 'light'} {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
