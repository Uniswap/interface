import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'ui/src'
import config from 'ui/src/tamagui.config'
import { useSelectedColorScheme } from 'uniswap/src/features/appearance/hooks'

export function TamaguiProvider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  const darkMode = useSelectedColorScheme() === 'dark'
  return (
    <OGTamaguiProvider config={config} defaultTheme={darkMode ? 'dark' : 'light'} {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
