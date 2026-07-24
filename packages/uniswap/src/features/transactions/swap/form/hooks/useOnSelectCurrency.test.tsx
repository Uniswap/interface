import { configureStore } from '@reduxjs/toolkit'
import { renderHook as RNRenderHook, act } from '@testing-library/react-native'
import type { Currency } from '@uniswap/sdk-core'
import type { ParsedQs } from 'qs'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { Provider as ReduxProvider, useDispatch } from 'react-redux'
import { TamaguiProvider } from 'ui/src'
import { config } from 'ui/src/tamagui.config'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { UrlContext } from 'uniswap/src/contexts/UrlContext'
import { SharedPersistQueryClientProvider } from 'uniswap/src/data/apiClients/SharedPersistQueryClientProvider'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionModalContext,
  TransactionScreen,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import {
  useOnSelectCurrency,
  useOnSelectTradeableAsset,
} from 'uniswap/src/features/transactions/swap/form/hooks/useOnSelectCurrency'
import { createSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/createSwapFormStore'
import { SwapFormStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { uniswapReducer } from 'uniswap/src/state/uniswapReducer'
import { AutoMockedApolloProvider } from 'uniswap/src/test/mocks'
import { mockUniswapContext } from 'uniswap/src/test/render'
import { CurrencyField } from 'uniswap/src/types/currency'

const RWA_ADDRESS = '0xe92f673ca36c5e2efd2de7628f815f84807e803f'

// Mounts a *real* swap-form Zustand store (via `createSwapFormStore`, which wires the real
// `updateSwapForm` action) directly through `SwapFormStoreContext.Provider`. We bypass the heavy
// `SwapFormStoreContextProvider` (which pulls in `useWallet`, gas hooks, derived-swap-info, etc.)
// because the hook under test only reads input/output/exactCurrencyField/filteredChainIds and
// then calls `updateSwapForm` to set the selected field.
function SwapFormStoreProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  const dispatch = useDispatch()
  const [{ store }] = useState(() =>
    createSwapFormStore({
      derivedSwapInfo: {} as DerivedSwapInfo,
      dependenciesForSideEffect: { dispatch },
    }),
  )
  return <SwapFormStoreContext.Provider value={store}>{children}</SwapFormStoreContext.Provider>
}

function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
  const store = configureStore({ reducer: uniswapReducer })
  return (
    <AutoMockedApolloProvider>
      <ReduxProvider store={store}>
        <UniswapProvider {...mockUniswapContext}>
          <UrlContext.Provider value={{ useParsedQueryString: () => ({}) as ParsedQs, usePathname: () => '' }}>
            <SharedPersistQueryClientProvider>
              <TamaguiProvider config={config} defaultTheme="dark">
                <TransactionModalContext.Provider
                  value={{
                    bottomSheetViewStyles: {},
                    onClose: () => {},
                    screen: TransactionScreen.Form,
                    setScreen: () => {},
                  }}
                >
                  <SwapFormStoreProvider>{children}</SwapFormStoreProvider>
                </TransactionModalContext.Provider>
              </TamaguiProvider>
            </SharedPersistQueryClientProvider>
          </UrlContext.Provider>
        </UniswapProvider>
      </ReduxProvider>
    </AutoMockedApolloProvider>
  )
}

describe('useOnSelectTradeableAsset', () => {
  it('sets the output TradeableAsset from {address, chainId} without a Currency', async () => {
    const { result } = RNRenderHook(
      () => ({
        select: useOnSelectTradeableAsset({}),
        output: useSwapFormStore((s) => s.output),
      }),
      { wrapper: Wrapper },
    )

    await act(async () => {
      result.current.select({
        tradeableAsset: { address: RWA_ADDRESS, chainId: UniverseChainId.Bnb, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: true,
      })
    })

    expect(result.current.output).toMatchObject({
      address: RWA_ADDRESS,
      chainId: UniverseChainId.Bnb,
      type: AssetType.Currency,
    })
  })

  it('useOnSelectCurrency delegates to the core and sets the output TradeableAsset from a Currency', async () => {
    const { result } = RNRenderHook(
      () => ({
        select: useOnSelectCurrency({}),
        output: useSwapFormStore((s) => s.output),
      }),
      { wrapper: Wrapper },
    )

    const currency = {
      isToken: true,
      isNative: false,
      chainId: UniverseChainId.Bnb,
      address: RWA_ADDRESS,
      decimals: 18,
      symbol: 'TEST',
      name: 'Test',
    } as unknown as Currency

    await act(async () => {
      result.current.select({
        currency,
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: true,
        isPreselectedAsset: false,
      })
    })

    expect(result.current.output).toMatchObject({
      address: RWA_ADDRESS,
      chainId: UniverseChainId.Bnb,
      type: AssetType.Currency,
    })
  })
})
