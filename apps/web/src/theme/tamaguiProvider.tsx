import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from '@tamagui/core'
import config from 'tamagui.config'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

export function TamaguiProvider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  const darkMode = useIsDarkMode()
  return (
    <OGTamaguiProvider config={config} defaultTheme={darkMode ? 'dark' : 'light'} {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
