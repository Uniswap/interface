import { render, waitFor } from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import { MemoryRouter, useLocation, useSearchParams } from 'react-router'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPChainSearchParamSync } from '~/pages/TokenDetails/context/TDPChainSearchParamSync'
import { TDPStoreContext } from '~/pages/TokenDetails/context/TDPContext'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { mocked } from '~/test-utils/mocked'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'
import { CHAIN_SEARCH_PARAM, TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

vi.mock('~/pages/TokenDetails/hooks/useMultichainTokenEntries', () => ({
  useMultichainTokenEntries: vi.fn(),
}))

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

const TWO_CHAINS: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0x111', isNative: false },
  { chainId: UniverseChainId.Base, address: '0x222', isNative: false },
]

const ONE_CHAIN: MultichainTokenEntry[] = [{ chainId: UniverseChainId.Mainnet, address: '0x111', isNative: false }]

function UrlSearchSnapshot(): JSX.Element {
  const location = useLocation()
  const [params] = useSearchParams()
  return (
    <>
      <div data-testid="url-path">{location.pathname}</div>
      <div data-testid="url-search">{params.toString()}</div>
    </>
  )
}

interface HarnessProps {
  store: ReturnType<typeof createTDPStore>
  initialPath: string
}

function Harness({ store, initialPath }: HarnessProps): JSX.Element {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <TDPStoreContext.Provider value={store}>
        <TDPChainSearchParamSync />
        <UrlSearchSnapshot />
      </TDPStoreContext.Provider>
    </MemoryRouter>
  )
}

describe('TDPChainSearchParamSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/')
    mocked(useMultichainTokenEntries).mockReturnValue([])
  })

  it('removes chain param for single-chain tokens', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(ONE_CHAIN)

    const store = createTDPStore(createPendingTDPState({ selectedMultichainChainId: UniverseChainId.Mainnet }))

    const { getByTestId } = render(<Harness store={store} initialPath="/token?chain=ethereum" />)

    await waitFor(() => {
      expect(getByTestId('url-search').textContent).toBe('')
      expect(store.getState().selectedMultichainChainId).toBeUndefined()
    })
  })

  it('normalizes a legacy chain query param to the selected network deployment path', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(createPendingTDPState())

    const { getByTestId } = render(<Harness store={store} initialPath="/token?chain=base&foo=bar" />)

    await waitFor(() => {
      expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Base)
      expect(getByTestId('url-path').textContent).toBe('/explore/tokens/base/0x222')
      expect(getByTestId('url-search').textContent).toBe('foo=bar')
    })
  })

  it('does not strip legacy chain param while multichain token entries are still loading, then normalizes it', async () => {
    const entries: { current: MultichainTokenEntry[] } = { current: [] }
    mocked(useMultichainTokenEntries).mockImplementation(() => entries.current)

    const store = createTDPStore(createPendingTDPState())

    const { getByTestId, rerender } = render(<Harness store={store} initialPath="/token?chain=base" />)

    expect(getByTestId('url-search').textContent).toContain('chain=base')

    entries.current = TWO_CHAINS
    rerender(<Harness store={store} initialPath="/token?chain=base" />)

    await waitFor(() => {
      expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Base)
    })
    expect(getByTestId('url-search').textContent).toBe('')
  })

  it('keeps chain=multichain as the aggregate multichain view', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(createPendingTDPState({ selectedMultichainChainId: UniverseChainId.Base }))

    const { getByTestId } = render(
      <Harness store={store} initialPath={`/token?${CHAIN_SEARCH_PARAM}=${TDP_MULTICHAIN_CHAIN_QUERY_VALUE}`} />,
    )

    await waitFor(() => {
      expect(getByTestId('url-search').textContent).toBe(`${CHAIN_SEARCH_PARAM}=${TDP_MULTICHAIN_CHAIN_QUERY_VALUE}`)
      expect(store.getState().selectedMultichainChainId).toBeUndefined()
    })
  })

  it('removes chain param when it is not a valid chain for the token', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(createPendingTDPState())

    const { getByTestId } = render(<Harness store={store} initialPath="/token?chain=optimism" />)

    await waitFor(() => {
      expect(getByTestId('url-search').textContent).toBe('')
      expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Mainnet)
    })
  })

  it('removes chain param when value is not a recognized chain name (multichain token)', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(createPendingTDPState())

    const { getByTestId } = render(<Harness store={store} initialPath="/token?chain=notachain" />)

    await waitFor(() => {
      expect(getByTestId('url-search').textContent).toBe('')
      expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Mainnet)
    })
  })

  it('selects the path chain when URL has no chain param', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(
      createPendingTDPState({
        selectedMultichainChainId: UniverseChainId.Base,
      }),
    )

    render(<Harness store={store} initialPath="/token" />)

    await waitFor(() => {
      expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Mainnet)
    })
  })

  it('does not reset selection after selector shallowly replaces the browser URL', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)
    window.history.replaceState(null, '', '/explore/tokens/base/0x222')

    const store = createTDPStore(
      createPendingTDPState({
        selectedMultichainChainId: UniverseChainId.Base,
      }),
    )

    render(<Harness store={store} initialPath="/explore/tokens/ethereum/0x111" />)

    await waitFor(() => {
      expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Base)
    })
  })
})
