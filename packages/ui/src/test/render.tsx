import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'tamagui'
import { config } from 'ui/src/tamagui.config'

/**
 * Helper component to wrap tests in a provider for tests.
 */
export function SharedUIUniswapProvider({ children }: Pick<TamaguiProviderProps, 'children'>): JSX.Element {
  return (
    <OGTamaguiProvider config={config} defaultTheme="dark">
      {children}
    </OGTamaguiProvider>
  )
}
