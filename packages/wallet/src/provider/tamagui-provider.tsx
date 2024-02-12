import { tamaguiConfig, TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'ui/src'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

// without <NavigationProvider>
// this exported Provider is useful for tests

export function TamaguiProvider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  // because we dont always want to wrap all of redux for visual tests, make it default to false if in test mode
  // this should be done better but release needs hotfix so for now it works
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const isDark = process.env.NODE_ENV === 'test' ? false : useIsDarkMode()

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
