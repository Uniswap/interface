import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps, tamaguiConfig } from 'ui/src'

export function TamaguiProvider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  const darkMode = useIsDarkMode()

  return (
    <OGTamaguiProvider config={tamaguiConfig} defaultTheme={darkMode ? 'dark' : 'light'} disableInjectCSS {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
