import React, { FC, ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import ThemeProvider from 'theme'
import store from 'state'
import { Provider } from 'react-redux'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import getLibrary from 'utils/getLibrary'
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import { NetworkContextName } from 'constants/misc'
import { ThemedGlobalStyle } from 'theme'
import { HashRouter } from 'react-router-dom'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

const WithProviders: FC = ({ children }: { children?: ReactNode }) => {
  return (
    <Provider store={store}>
      <HashRouter>
        <Web3ReactProvider getLibrary={getLibrary}>
          <Web3ProviderNetwork getLibrary={getLibrary}>
            <I18nProvider forceRenderOnLocaleChange={false} i18n={i18n}>
              <ThemeProvider>
                <ThemedGlobalStyle />
                {children}
              </ThemeProvider>
            </I18nProvider>
          </Web3ProviderNetwork>
        </Web3ReactProvider>
      </HashRouter>
    </Provider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: WithProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
