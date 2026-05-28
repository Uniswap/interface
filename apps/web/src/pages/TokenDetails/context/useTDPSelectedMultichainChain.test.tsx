import { act, renderHook } from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import type { ReactNode } from 'react'
import { MemoryRouter, useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPStoreContext } from '~/pages/TokenDetails/context/TDPContext'
import { useTDPSelectedMultichainChain } from '~/pages/TokenDetails/context/useTDPSelectedMultichainChain'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'
import { getChainUrlParam } from '~/utils/params/chainParams'
import { CHAIN_SEARCH_PARAM } from '~/utils/params/chainQueryParam'

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

function useSelectedMultichainChainWithSearchString(): {
  selectedMultichainChainId: UniverseChainId | undefined
  setSelectedMultichainChainId: (chainId: UniverseChainId | undefined) => void
  searchString: string
} {
  const { selectedMultichainChainId, setSelectedMultichainChainId } = useTDPSelectedMultichainChain()
  const [searchParams] = useSearchParams()
  return {
    selectedMultichainChainId,
    setSelectedMultichainChainId,
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

  it('sets ?chain= when selecting a network', () => {
    const { result, store } = renderWithStore('/explore/tokens/ethereum/0xabc?foo=bar', createPendingTDPState())

    act(() => {
      result.current.setSelectedMultichainChainId(UniverseChainId.ArbitrumOne)
    })

    expect(store.getState().selectedMultichainChainId).toBeUndefined()
    expect(result.current.searchString).toContain(
      `${CHAIN_SEARCH_PARAM}=${getChainUrlParam(UniverseChainId.ArbitrumOne)}`,
    )
    expect(result.current.searchString).toContain('foo=bar')
    expect(result.current.selectedMultichainChainId).toBeUndefined()
  })

  it('removes ?chain= when selecting undefined', () => {
    const { result, store } = renderWithStore(
      `/explore/tokens/ethereum/0xabc?${CHAIN_SEARCH_PARAM}=base`,
      createPendingTDPState({ selectedMultichainChainId: UniverseChainId.Base }),
    )

    act(() => {
      result.current.setSelectedMultichainChainId(undefined)
    })

    expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Base)
    expect(result.current.searchString).not.toContain(CHAIN_SEARCH_PARAM)
    expect(result.current.selectedMultichainChainId).toBe(UniverseChainId.Base)
  })
})
