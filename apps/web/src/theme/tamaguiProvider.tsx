import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'ui/src'
import config from 'ui/src/tamagui.config'

// HookSwap ships a single DARK "Terminal" theme: the shell + screens are hardcoded
// dark (see terminalColors — bg #0B0F14 / ink #E7ECF2). Force dark so every legacy
// Tamagui page (CreatePosition / LP flow, modals) renders dark-theme light text that
// matches the shell, instead of following the system setting or the old (stale) light
// Atlas default — which rendered dark text on the dark shell (invisible content).
export function TamaguiProvider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>): JSX.Element {
  return (
    <OGTamaguiProvider config={config} defaultTheme="dark" {...rest}>
      {children}
    </OGTamaguiProvider>
  )
}
