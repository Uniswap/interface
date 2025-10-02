import { AssetActivityProvider } from 'appGraphql/data/apollo/AssetActivityProvider'
import { TokenBalancesProvider } from 'appGraphql/data/apollo/TokenBalancesProvider'
import { MockedProvider } from '@apollo/client/testing'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queries } from '@testing-library/dom'
import { RenderOptions, render } from '@testing-library/react'
import { RenderHookOptions, renderHook, WrapperComponent } from '@testing-library/react-hooks'
import { Web3ProviderUpdater } from 'components/Web3Provider'
import TestWeb3Provider from 'components/Web3Provider/TestWeb3Provider'
import { WebUniswapProvider } from 'components/Web3Provider/WebUniswapContext'
import { WebAccountsStoreProvider } from 'features/accounts/store/provider'
import { ConnectWalletMutationProvider } from 'features/wallet/connection/hooks/useConnectWalletMutation'
import { ExternalWalletProvider } from 'features/wallet/providers/ExternalWalletProvider'
import { BlockNumberContext } from 'lib/hooks/useBlockNumber'
import { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { HelmetProvider } from 'react-helmet-async/lib/index'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'
import store from 'state'
import { ThemeProvider } from 'theme'
import { TamaguiProvider } from 'theme/tamaguiProvider'
import { ReactRouterUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { MismatchContextProvider } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'

const queryClient = new QueryClient()

const BLOCK_NUMBER_CONTEXT = { fastForward: () => {}, block: 1234, mainnetBlock: 1234 }
function MockedBlockNumberProvider({ children }: PropsWithChildren) {
  return <BlockNumberContext.Provider value={BLOCK_NUMBER_CONTEXT}>{children}</BlockNumberContext.Provider>
}

function MockedMismatchProvider({ children }: PropsWithChildren) {
  return (
    <MismatchContextProvider
      address={undefined}
      chainId={undefined}
      mismatchCallback={() => Promise.resolve({ [String(1)]: false })}
      onHasAnyMismatch={() => {}}
      chains={[1]}
      defaultChainId={1}
      isTestnetModeEnabled={false}
    >
      {children}
    </MismatchContextProvider>
  )
}

function CommonTestProviders({ children }: PropsWithChildren) {
  return (
    <MockedProvider showWarnings={false}>
      <AssetActivityProvider>
        <TokenBalancesProvider>
          <ReactRouterUrlProvider>
            <MockedBlockNumberProvider>
              <ThemeProvider>
                <TamaguiProvider>
                  <Web3ProviderUpdater />
                  <MockedMismatchProvider>{children}</MockedMismatchProvider>
                </TamaguiProvider>
              </ThemeProvider>
            </MockedBlockNumberProvider>
          </ReactRouterUrlProvider>
        </TokenBalancesProvider>
      </AssetActivityProvider>
    </MockedProvider>
  )
}

function BaseWrapper({
  children,
  includeUniswapContext = false,
}: PropsWithChildren<{ includeUniswapContext?: boolean }>) {
  return (
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <TestWeb3Provider>
              <ConnectWalletMutationProvider>
                <WebAccountsStoreProvider>
                  <ExternalWalletProvider>
                    {/* TODO: figure out how to properly mock `WebUniswapProvider` so that we can include it in all tests */}
                    {includeUniswapContext ? (
                      <WebUniswapProvider>
                        <CommonTestProviders>{children}</CommonTestProviders>
                      </WebUniswapProvider>
                    ) : (
                      <CommonTestProviders>{children}</CommonTestProviders>
                    )}
                  </ExternalWalletProvider>
                </WebAccountsStoreProvider>
              </ConnectWalletMutationProvider>
            </TestWeb3Provider>
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  )
}

const WithProviders = ({ children }: { children?: ReactNode }) => <BaseWrapper>{children}</BaseWrapper>
const WithUniswapProviders = ({ children }: { children?: ReactNode }) => (
  <BaseWrapper includeUniswapContext>{children}</BaseWrapper>
)

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  return render<typeof queries>(ui, { ...options, wrapper: WithProviders })
}

const customRenderWithUniswapContext = (ui: ReactElement, options?: CustomRenderOptions) => {
  return render<typeof queries>(ui, { ...options, wrapper: WithUniswapProviders })
}

type CustomRenderHookOptions<Props> = Omit<RenderHookOptions<Props>, 'wrapper'>
const customRenderHook = <Result, Props>(
  hook: (initialProps: Props) => Result,
  options?: CustomRenderHookOptions<Props>,
) => {
  return renderHook(hook, { ...options, wrapper: WithProviders as WrapperComponent<Props> })
}

// Testing utils may export *.
// eslint-disable-next-line no-restricted-syntax
export * from '@testing-library/react'
export {
  customRender as render,
  customRenderWithUniswapContext as renderWithUniswapContext,
  customRenderHook as renderHook,
}
