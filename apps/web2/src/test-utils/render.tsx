import { MockedProvider } from '@apollo/client/testing'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { queries } from '@testing-library/dom'
import { render, renderHook, RenderHookOptions, RenderOptions } from '@testing-library/react'
import { DEFAULT_LOCALE } from 'constants/locales'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import catalog from 'locales/en-US'
import { en } from 'make-plural/plurals'
import { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import store from 'state'
import ThemeProvider from 'theme'

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
          <BrowserRouter>
            {/*
             * Web3Provider is mocked through setupTests.ts
             * To test behavior that depends on Web3Provider, use jest.unmock('@web3-react/core')
             */}
            <MockedProvider>
              <BlockNumberProvider>
                <ThemeProvider>{children}</ThemeProvider>
              </BlockNumberProvider>
            </MockedProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    </MockedI18nProvider>
  )
}

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>
const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  return render<typeof queries>(ui, { ...options, wrapper: WithProviders })
}

type CustomRenderHookOptions<Props> = Omit<RenderHookOptions<Props>, 'wrapper'>
const customRenderHook = <Result, Props>(
  hook: (initialProps: Props) => Result,
  options?: CustomRenderHookOptions<Props>
) => {
  return renderHook(hook, { ...options, wrapper: WithProviders })
}

// Testing utils may export *.
// eslint-disable-next-line no-restricted-syntax
export * from '@testing-library/react'
export { customRender as render }
export { customRenderHook as renderHook }
