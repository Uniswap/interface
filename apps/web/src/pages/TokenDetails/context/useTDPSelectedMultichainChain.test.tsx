import { act, renderHook } from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation, useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPStoreContext } from '~/pages/TokenDetails/context/TDPContext'
import { useTDPSelectedMultichainChain } from '~/pages/TokenDetails/context/useTDPSelectedMultichainChain'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'
import { CHAIN_SEARCH_PARAM, TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

const ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

function createPendingTDPState(overrides: { selectedMultichainChainId?: UniverseChainId | undefined } = {}): TDPState {
  return {
    currencyChain: GraphQLApi.Chain.Ethereum,
    currencyChainId: UniverseChainId.Mainnet,
    address: ADDRESS,
    tokenQuery: {
      loading: false,
      data: validTokenProjectResponse.data,
    },
    multiChainMap: {},
    selectedMultichainChainId: overrides.selectedMultichainChainId ?? undefined,
    tokenColor: undefined,
    currency: undefined,
  } as unknown as TDPState
}

function createMultichainTDPState(
  overrides: { selectedMultichainChainId?: UniverseChainId | undefined } = {},
): TDPState {
  return {
    ...createPendingTDPState(overrides),
    multiChainMap: {
      [GraphQLApi.Chain.Ethereum]: { address: '0x1111111111111111111111111111111111111111' },
      [GraphQLApi.Chain.Arbitrum]: { address: '0x3333333333333333333333333333333333333333' },
    },
  } as unknown as TDPState
}

function useSelectedMultichainChainWithSearchString(): {
  selectedMultichainChainId: UniverseChainId | undefined
  setSelectedMultichainChainId: (chainId: UniverseChainId | undefined) => void
  pathname: string
  searchString: string
} {
  const { selectedMultichainChainId, setSelectedMultichainChainId } = useTDPSelectedMultichainChain()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  return {
    selectedMultichainChainId,
    setSelectedMultichainChainId,
    pathname: location.pathname,
    searchString: searchParams.toString(),
  }
}

describe('useTDPSelectedMultichainChain', () => {
  function renderWithStore(initialPath: string, initialState: TDPState) {
    const store = createTDPStore(initialState)
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[initialPath]}>
        <TDPStoreContext.Provider value={store}>{children}</TDPStoreContext.Provider>
      </MemoryRouter>
    )
    const hook = renderHook(() => useSelectedMultichainChainWithSearchString(), { wrapper })
    return { store, ...hook }
  }

  it('exposes selectedMultichainChainId from the TDP store', () => {
    const { result } = renderWithStore('/explore/tokens/ethereum/0xabc', createPendingTDPState())

    expect(result.current.selectedMultichainChainId).toBeUndefined()
  })

  it('reflects initial selectedMultichainChainId when set on the store', () => {
    const { result } = renderWithStore(
      '/explore/tokens/ethereum/0xabc',
      createPendingTDPState({ selectedMultichainChainId: UniverseChainId.Base }),
    )

    expect(result.current.selectedMultichainChainId).toBe(UniverseChainId.Base)
  })

  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('shallowly replaces the URL and store state when selecting a network', () => {
    window.history.replaceState(null, '', '/explore/tokens/ethereum/0xabc?foo=bar')
    const { result, store } = renderWithStore('/explore/tokens/ethereum/0xabc?foo=bar', createMultichainTDPState())

    act(() => {
      result.current.setSelectedMultichainChainId(UniverseChainId.ArbitrumOne)
    })

    expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.ArbitrumOne)
    expect(window.location.pathname).toBe('/explore/tokens/arbitrum/0x3333333333333333333333333333333333333333')
    expect(window.location.search).toBe('?foo=bar')
    expect(result.current.pathname).toBe('/explore/tokens/ethereum/0xabc')
    expect(result.current.searchString).not.toContain(CHAIN_SEARCH_PARAM)
    expect(result.current.searchString).toContain('foo=bar')
    expect(result.current.selectedMultichainChainId).toBe(UniverseChainId.ArbitrumOne)
  })

  it('shallowly sets ?chain=multichain and clears store state when selecting undefined', () => {
    window.history.replaceState(null, '', '/explore/tokens/ethereum/0xabc?foo=bar')
    const { result, store } = renderWithStore(
      '/explore/tokens/ethereum/0xabc?foo=bar',
      createPendingTDPState({ selectedMultichainChainId: UniverseChainId.Base }),
    )

    act(() => {
      result.current.setSelectedMultichainChainId(undefined)
    })

    expect(store.getState().selectedMultichainChainId).toBeUndefined()
    expect(window.location.pathname).toBe('/explore/tokens/ethereum/0xabc')
    expect(window.location.search).toContain(`${CHAIN_SEARCH_PARAM}=${TDP_MULTICHAIN_CHAIN_QUERY_VALUE}`)
    expect(window.location.search).toContain('foo=bar')
    expect(result.current.searchString).not.toContain(CHAIN_SEARCH_PARAM)
    expect(result.current.selectedMultichainChainId).toBeUndefined()
  })
})
