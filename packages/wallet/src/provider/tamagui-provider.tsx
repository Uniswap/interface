import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps, tamaguiConfig } from 'ui/src'
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
    <OGTamaguiProvider
      config={tamaguiConfig}
      defaultTheme={isDark ? 'dark' : 'light'}
      disableInjectCSS={false /* !process.env.STORYBOOK} */}
      {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
