import { render, waitFor } from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { MemoryRouter, useSearchParams } from 'react-router'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPChainSearchParamSync } from '~/pages/TokenDetails/context/TDPChainSearchParamSync'
import { TDPStoreContext } from '~/pages/TokenDetails/context/TDPContext'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { mocked } from '~/test-utils/mocked'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

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
  const [params] = useSearchParams()
  return <div data-testid="url-search">{params.toString()}</div>
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
    mocked(useMultichainTokenEntries).mockReturnValue([])
    mocked(useFeatureFlag).mockImplementation((flag) => {
      return flag === FeatureFlags.MultichainTokenUx
    })
  })

  it('removes chain search param when multichain token UX is disabled', async () => {
    mocked(useFeatureFlag).mockReturnValue(false)

    const store = createTDPStore(createPendingTDPState())

    const { getByTestId } = render(
      <Harness store={store} initialPath="/explore/tokens/ethereum/0xabc?chain=ethereum" />,
    )

    await waitFor(() => {
      expect(getByTestId('url-search').textContent).toBe('')
    })
  })

  it('removes chain param for single-chain tokens when multichain UX is on', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(ONE_CHAIN)

    const store = createTDPStore(createPendingTDPState({ selectedMultichainChainId: UniverseChainId.Mainnet }))

    const { getByTestId } = render(<Harness store={store} initialPath="/token?chain=ethereum" />)

    await waitFor(() => {
      expect(getByTestId('url-search').textContent).toBe('')
      expect(store.getState().selectedMultichainChainId).toBeUndefined()
    })
  })

  it('writes validated chain from URL into the store when multichain UX is on and token is a multi-chain asset', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(createPendingTDPState())

    render(<Harness store={store} initialPath="/token?chain=base" />)

    await waitFor(() => {
      expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Base)
    })
  })

  it('does not strip chain param while multichain token entries are still loading, then applies URL selection', async () => {
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
    expect(getByTestId('url-search').textContent).toContain('chain=base')
  })

  it('removes chain param when it is not a valid chain for the token', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(createPendingTDPState())

    const { getByTestId } = render(<Harness store={store} initialPath="/token?chain=optimism" />)

    await waitFor(() => {
      expect(getByTestId('url-search').textContent).toBe('')
      expect(store.getState().selectedMultichainChainId).toBeUndefined()
    })
  })

  it('removes chain param when value is not a recognized chain name (multichain token)', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(createPendingTDPState())

    const { getByTestId } = render(<Harness store={store} initialPath="/token?chain=notachain" />)

    await waitFor(() => {
      expect(getByTestId('url-search').textContent).toBe('')
      expect(store.getState().selectedMultichainChainId).toBeUndefined()
    })
  })

  it('clears store selection when URL has no chain param', async () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)

    const store = createTDPStore(
      createPendingTDPState({
        selectedMultichainChainId: UniverseChainId.Base,
      }),
    )

    render(<Harness store={store} initialPath="/token" />)

    await waitFor(() => {
      expect(store.getState().selectedMultichainChainId).toBeUndefined()
    })
  })
})
