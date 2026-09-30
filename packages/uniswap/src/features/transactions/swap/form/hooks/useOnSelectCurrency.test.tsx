import { configureStore } from '@reduxjs/toolkit'
import { renderHook as RNRenderHook, act } from '@testing-library/react-native'
import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import type { ParsedQs } from 'qs'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { Provider as ReduxProvider, useDispatch } from 'react-redux'
import { UNI } from 'uniswap/src/constants/tokens'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { UrlContext } from 'uniswap/src/contexts/UrlContext'
import { SharedPersistQueryClientProvider } from 'uniswap/src/data/reactQuery/SharedPersistQueryClientProvider'
import { AssetType } from 'uniswap/src/entities/assets'
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

function makeWrapper(
  tdpCurrency?: Currency,
  onCurrencyChange?: (
    selected: { inputCurrency?: Currency; outputCurrency?: Currency },
    selectedCurrency?: Currency,
  ) => void,
): (props: PropsWithChildren<unknown>) => JSX.Element {
  return function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    const store = configureStore({ reducer: uniswapReducer })
    return (
      <ReduxProvider store={store}>
        <UniswapProvider {...mockUniswapContext}>
          <UrlContext.Provider value={{ useParsedQueryString: () => ({}) as ParsedQs, usePathname: () => '' }}>
            <SharedPersistQueryClientProvider>
              <TransactionModalContext.Provider
                value={{
                  bottomSheetViewStyles: {},
                  onClose: () => {},
                  screen: TransactionScreen.Form,
                  setScreen: () => {},
                  tdpCurrency,
                  onCurrencyChange,
                }}
              >
                <SwapFormStoreProvider>{children}</SwapFormStoreProvider>
              </TransactionModalContext.Provider>
            </SharedPersistQueryClientProvider>
          </UrlContext.Provider>
        </UniswapProvider>
      </ReduxProvider>
    )
  }
}

const Wrapper = makeWrapper()

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

  it('moves the TDP token to the opposite field when it is replaced', async () => {
    const tdpToken = UNI[UniverseChainId.Mainnet]
    const { result } = RNRenderHook(
      () => ({
        select: useOnSelectTradeableAsset({}),
        input: useSwapFormStore((s) => s.input),
        output: useSwapFormStore((s) => s.output),
      }),
      { wrapper: makeWrapper(tdpToken) },
    )

    // Seed the form with the TDP token as output
    await act(async () => {
      result.current.select({
        tradeableAsset: { address: tdpToken.address, chainId: tdpToken.chainId, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: false,
      })
    })

    // Replace the TDP token with an unrelated token
    await act(async () => {
      result.current.select({
        tradeableAsset: { address: RWA_ADDRESS, chainId: UniverseChainId.Mainnet, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: false,
      })
    })

    expect(result.current.output).toMatchObject({
      address: RWA_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      type: AssetType.Currency,
    })
    expect(result.current.input).toMatchObject({
      address: tdpToken.address,
      chainId: UniverseChainId.Mainnet,
      type: AssetType.Currency,
    })
  })

  it('flips the TDP token cross-chain when the pair supports cross-chain routing', async () => {
    const tdpToken = UNI[UniverseChainId.Mainnet]
    const { result } = RNRenderHook(
      () => ({
        select: useOnSelectTradeableAsset({}),
        input: useSwapFormStore((s) => s.input),
        output: useSwapFormStore((s) => s.output),
      }),
      { wrapper: makeWrapper(tdpToken) },
    )

    await act(async () => {
      result.current.select({
        tradeableAsset: { address: tdpToken.address, chainId: tdpToken.chainId, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: false,
      })
    })

    await act(async () => {
      result.current.select({
        tradeableAsset: { address: RWA_ADDRESS, chainId: UniverseChainId.Bnb, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: true,
      })
    })

    // TDP token keeps its original chain on the opposite side
    expect(result.current.output).toMatchObject({ address: RWA_ADDRESS, chainId: UniverseChainId.Bnb })
    expect(result.current.input).toMatchObject({ address: tdpToken.address, chainId: UniverseChainId.Mainnet })
  })

  it('does not flip the TDP token into an unroutable cross-chain pair', async () => {
    const tdpToken = UNI[UniverseChainId.Mainnet]
    const { result } = RNRenderHook(
      () => ({
        select: useOnSelectTradeableAsset({}),
        input: useSwapFormStore((s) => s.input),
        output: useSwapFormStore((s) => s.output),
      }),
      { wrapper: makeWrapper(tdpToken) },
    )

    await act(async () => {
      result.current.select({
        tradeableAsset: { address: tdpToken.address, chainId: tdpToken.chainId, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: false,
      })
    })

    // Different chain, no bridge/chained route cached → replacement must not create a dead pair
    await act(async () => {
      result.current.select({
        tradeableAsset: { address: RWA_ADDRESS, chainId: UniverseChainId.Bnb, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: false,
      })
    })

    expect(result.current.output).toMatchObject({ address: RWA_ADDRESS, chainId: UniverseChainId.Bnb })
    expect(result.current.input).toBeUndefined()
  })

  it('reports the selected currency to onCurrencyChange when the TDP token is dropped from the pair', async () => {
    const tdpToken = UNI[UniverseChainId.Mainnet]
    const onCurrencyChange = vi.fn()
    const { result } = RNRenderHook(() => ({ select: useOnSelectTradeableAsset({}) }), {
      wrapper: makeWrapper(tdpToken, onCurrencyChange),
    })

    await act(async () => {
      result.current.select({
        tradeableAsset: { address: tdpToken.address, chainId: tdpToken.chainId, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: false,
      })
    })

    const selectedCurrency = {
      isToken: true,
      isNative: false,
      chainId: UniverseChainId.Bnb,
      address: RWA_ADDRESS,
      decimals: 18,
      symbol: 'TEST',
      name: 'Test',
    } as unknown as Currency

    // Unroutable replacement drops the TDP token; the TDP relies on the selected currency to navigate.
    await act(async () => {
      result.current.select({
        tradeableAsset: { address: RWA_ADDRESS, chainId: UniverseChainId.Bnb, type: AssetType.Currency },
        field: CurrencyField.OUTPUT,
        allowCrossChainPair: false,
        selectedCurrency,
      })
    })

    expect(onCurrencyChange).toHaveBeenLastCalledWith(
      { inputCurrency: undefined, outputCurrency: selectedCurrency },
      selectedCurrency,
    )
  })
})
