import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { render } from '@testing-library/react'
import Web3Provider from 'components/Web3Provider'
import { DEFAULT_LOCALE } from 'constants/locales'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { en } from 'make-plural/plurals'
import { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import store from 'state'
import ThemeProvider from 'theme'

import catalog from './locales/en-US'

i18n.load({
  [DEFAULT_LOCALE]: catalog.messages,
})
i18n.loadLocaleData({
  [DEFAULT_LOCALE]: { plurals: en },
})
i18n.activate(DEFAULT_LOCALE)

const MockedI18nProvider = ({ children }: any) => <I18nProvider i18n={i18n}>{children}</I18nProvider>
const queryClient = new QueryClient()

const WithProviders = ({ children }: { children?: ReactNode }) => {
  return (
    <MockedI18nProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <HashRouter>
            <Web3Provider>
              <BlockNumberProvider>
                <ThemeProvider>{children}</ThemeProvider>
              </BlockNumberProvider>
            </Web3Provider>
          </HashRouter>
        </QueryClientProvider>
      </Provider>
    </MockedI18nProvider>
  )
}

const customRender = (ui: ReactElement) => render(ui, { wrapper: WithProviders })

export * from '@testing-library/react'
export { customRender as render }
