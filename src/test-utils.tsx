import { MockedProvider } from '@apollo/client/testing'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { render, renderHook } from '@testing-library/react'
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
              <MockedProvider>
                <BlockNumberProvider>
                  <ThemeProvider>{children}</ThemeProvider>
                </BlockNumberProvider>
              </MockedProvider>
            </Web3Provider>
          </HashRouter>
        </QueryClientProvider>
      </Provider>
    </MockedI18nProvider>
  )
}

const customRender = (ui: ReactElement) => render(ui, { wrapper: WithProviders })
const customRenderHook = <Result, Props>(hook: (initialProps: Props) => Result) =>
  renderHook(hook, { wrapper: WithProviders })

/**
 * Casts the passed function as a jest.Mock.
 * Use this in combination with jest.mock() to safely access functions from mocked modules.
 *
 * @example
 *
 *  import { useExample } from 'example'
 *  jest.mock('example', () => ({ useExample: jest.fn() }))
 *  beforeEach(() => {
 *    asMock(useExample).mockImplementation(() => ...)
 *  })
 */
// jest expects mocks to be coerced (eg fn as jest.MockedFunction<T>), but this is not ergonomic when using ASI.
// Instead, we use this utility function to improve readability and add a check to ensure the function is a mock.
export function mocked<T extends (...args: any) => any>(fn: T) {
  if (!jest.isMockFunction(fn)) throw new Error('fn is not a mock')
  return fn as jest.MockedFunction<T>
}

export * from '@testing-library/react'
export { customRender as render }
export { customRenderHook as renderHook }
