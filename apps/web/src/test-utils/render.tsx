import { MockedProvider } from '@apollo/client/testing'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queries } from '@testing-library/dom'
import { RenderOptions, render } from '@testing-library/react'
import { RenderHookOptions, WrapperComponent, renderHook } from '@testing-library/react-hooks'
import { AssetActivityProvider } from 'graphql/data/apollo/AssetActivityProvider'
import { TokenBalancesProvider } from 'graphql/data/apollo/TokenBalancesProvider'
import { BlockNumberContext } from 'lib/hooks/useBlockNumber'
import { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { HelmetProvider } from 'react-helmet-async/lib/index'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import store from 'state'
import { ThemeProvider } from 'theme'
import { TamaguiProvider } from 'theme/tamaguiProvider'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'

const queryClient = new QueryClient()

const BLOCK_NUMBER_CONTEXT = { fastForward: () => {}, block: 1234, mainnetBlock: 1234 }
function MockedBlockNumberProvider({ children }: PropsWithChildren) {
  return <BlockNumberContext.Provider value={BLOCK_NUMBER_CONTEXT}>{children}</BlockNumberContext.Provider>
}

const WithProviders = ({ children }: { children?: ReactNode }) => {
  return (
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {/*
             * Web3Provider is mocked through setupTests.ts
             * To test behavior that depends on Web3Provider, use jest.unmock('@web3-react/core')
             */}
            <MockedProvider showWarnings={false}>
              <AssetActivityProvider>
                <TokenBalancesProvider>
                  <MockedBlockNumberProvider>
                    <UnitagUpdaterContextProvider>
                      <ThemeProvider>
                        <TamaguiProvider>{children}</TamaguiProvider>
                      </ThemeProvider>
                    </UnitagUpdaterContextProvider>
                  </MockedBlockNumberProvider>
                </TokenBalancesProvider>
              </AssetActivityProvider>
            </MockedProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
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
  return renderHook(hook, { ...options, wrapper: WithProviders as WrapperComponent<Props> })
}

// Testing utils may export *.
// eslint-disable-next-line no-restricted-syntax
export * from '@testing-library/react'
export { customRender as render, customRenderHook as renderHook }
