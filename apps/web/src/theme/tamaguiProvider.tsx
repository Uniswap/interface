import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'ui/src'
import config from 'ui/src/tamagui.config'

// HookSwap ships a single LIGHT "Atlas" theme (the Terminal shell + screens are
// light-only). Force light so every legacy page renders light and consistent
// instead of following the system dark setting (which clashed with the shell).
export function TamaguiProvider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  return (
    <OGTamaguiProvider config={config} defaultTheme="light" {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
