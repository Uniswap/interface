import { render as RNRender, RenderOptions, RenderResult } from '@testing-library/react-native'
import { PropsWithChildren } from 'react'
import { TamaguiProvider } from 'ui/src'
import { config as tamaguiConfig } from 'ui/src/tamagui.config'
import 'uniswap/src/i18n/i18n'

/**
 *
 * @param ui Component to render
 * @param resolvers Custom resolvers that override the default ones
 * @param preloadedState and store
 * @returns `ui` wrapped with providers
 */
export function renderWithProviders(ui: React.ReactElement, renderOptions: RenderOptions = {}): RenderResult {
  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
  }

  // Return an object with the store and all of RTL's query functions
  return RNRender(ui, { wrapper: Wrapper, ...renderOptions })
}
