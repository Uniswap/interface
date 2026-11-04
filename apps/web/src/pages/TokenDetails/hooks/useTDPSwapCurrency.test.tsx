import { act, render, renderHook } from '@testing-library/react'
import { type Currency, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { type PropsWithChildren, type ReactElement, useEffect } from 'react'
import { MemoryRouter } from 'react-router'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { currencyForSelectedMultichainDeployment } from '~/pages/TokenDetails/components/header/currencyForSelectedMultichainDeployment'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPChainSearchParamSync } from '~/pages/TokenDetails/context/TDPChainSearchParamSync'
import { TDPStoreContext, type MultiChainMap } from '~/pages/TokenDetails/context/TDPContext'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPPerChainVolume } from '~/pages/TokenDetails/hooks/useTDPPerChainVolume'
import { useTDPSwapCurrency } from '~/pages/TokenDetails/hooks/useTDPSwapCurrency'
import { mocked } from '~/test-utils/mocked'

vi.mock('~/pages/TokenDetails/hooks/useMultichainTokenEntries', () => ({
  useMultichainTokenEntries: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPPerChainVolume', () => ({
  useTDPPerChainVolume: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/components/header/currencyForSelectedMultichainDeployment', () => ({
  currencyForSelectedMultichainDeployment: vi.fn(),
}))

const BASE_CURRENCY = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const BASE_CURRENCY_ON_BASE = new Token(UniverseChainId.Base, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC')

const ONE_CHAIN: MultichainTokenEntry[] = [{ chainId: UniverseChainId.Mainnet, address: '0x111', isNative: false }]

const TWO_CHAINS: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0x111', isNative: false },
  { chainId: UniverseChainId.Base, address: '0x222', isNative: false },
]

function createTDPState(
  overrides: Partial<Pick<TDPState, 'selectedMultichainChainId' | 'multiChainMap'>> = {},
): TDPState {
  return {
    currencyChainId: UniverseChainId.Mainnet,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenQuery: { loading: false, data: undefined },
    multiChainMap: overrides.multiChainMap ?? {},
    selectedMultichainChainId: overrides.selectedMultichainChainId,
    tokenColor: undefined,
    currency: BASE_CURRENCY,
  } as unknown as TDPState
}

const MAINNET_PATH = '/explore/tokens/ethereum/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const ALL_NETWORKS_PATH = `${MAINNET_PATH}?chain=multichain`

const BASE_HIGHEST_BALANCE_MAP: MultiChainMap = {
  [UniverseChainId.Mainnet]: {
    address: '0x111',
    balance: { balanceUSD: 100 } as NonNullable<MultiChainMap[UniverseChainId]>['balance'],
  },
  [UniverseChainId.Base]: {
    address: '0x222',
    balance: { balanceUSD: 5000 } as NonNullable<MultiChainMap[UniverseChainId]>['balance'],
  },
}

function renderUseTDPSwapCurrency(store: ReturnType<typeof createTDPStore>, initialPath = ALL_NETWORKS_PATH) {
  const wrapper = ({ children }: PropsWithChildren): ReactElement => (
    <MemoryRouter initialEntries={[initialPath]}>
      <TDPStoreContext.Provider value={store}>{children}</TDPStoreContext.Provider>
    </MemoryRouter>
  )
  return renderHook(() => useTDPSwapCurrency(), { wrapper })
}

describe('useTDPSwapCurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)
    mocked(useTDPPerChainVolume).mockReturnValue(undefined)
    mocked(currencyForSelectedMultichainDeployment).mockReturnValue(BASE_CURRENCY)
  })

  it('returns base currency for single-chain token', () => {
    mocked(useMultichainTokenEntries).mockReturnValue(ONE_CHAIN)
    const store = createTDPStore(createTDPState())

    const { result } = renderUseTDPSwapCurrency(store)

    expect(result.current).toBe(BASE_CURRENCY)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, undefined)
  })

  it('returns selected chain deployment when network filter applied', () => {
    mocked(currencyForSelectedMultichainDeployment).mockReturnValue(BASE_CURRENCY_ON_BASE)
    const store = createTDPStore(createTDPState({ selectedMultichainChainId: UniverseChainId.Base }))

    const { result } = renderUseTDPSwapCurrency(store)

    expect(result.current).toBe(BASE_CURRENCY_ON_BASE)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, TWO_CHAINS[1])
  })

  it('returns highest-balance deployment in the all-networks view when balances exist', () => {
    mocked(currencyForSelectedMultichainDeployment).mockReturnValue(BASE_CURRENCY_ON_BASE)
    mocked(useTDPPerChainVolume).mockReturnValue({
      [UniverseChainId.Mainnet]: 10_000_000,
      [UniverseChainId.Base]: 1_000_000,
    })
    const store = createTDPStore(createTDPState({ multiChainMap: BASE_HIGHEST_BALANCE_MAP }))

    const { result } = renderUseTDPSwapCurrency(store)

    // Should pick Base (highest balance) even though Ethereum has higher volume
    expect(result.current).toBe(BASE_CURRENCY_ON_BASE)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, TWO_CHAINS[1])
  })

  it('falls back to highest-volume deployment in the all-networks view when no balances', () => {
    mocked(currencyForSelectedMultichainDeployment).mockReturnValue(BASE_CURRENCY_ON_BASE)
    mocked(useTDPPerChainVolume).mockReturnValue({
      [UniverseChainId.Mainnet]: 1_000_000,
      [UniverseChainId.Base]: 5_000_000,
    })
    const store = createTDPStore(createTDPState())

    const { result } = renderUseTDPSwapCurrency(store)

    // No balances → falls back to highest volume (Base)
    expect(result.current).toBe(BASE_CURRENCY_ON_BASE)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, TWO_CHAINS[1])
  })

  it('returns base currency when query is still loading', () => {
    const store = createTDPStore(createTDPState())

    const { result } = renderUseTDPSwapCurrency(store)

    // No tokens, no balances → targetEntry is undefined → returns base
    expect(result.current).toBe(BASE_CURRENCY)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, undefined)
  })

  it('returns the URL-path currency when no filter is set outside the all-networks view', () => {
    mocked(useTDPPerChainVolume).mockReturnValue({
      [UniverseChainId.Mainnet]: 1_000_000,
      [UniverseChainId.Base]: 5_000_000,
    })
    const store = createTDPStore(createTDPState({ multiChainMap: BASE_HIGHEST_BALANCE_MAP }))

    const { result } = renderUseTDPSwapCurrency(store, MAINNET_PATH)

    expect(result.current).toBe(BASE_CURRENCY)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, undefined)
  })

  it('follows the network filter outside the all-networks view', () => {
    mocked(currencyForSelectedMultichainDeployment).mockReturnValue(BASE_CURRENCY_ON_BASE)
    const store = createTDPStore(
      createTDPState({ multiChainMap: BASE_HIGHEST_BALANCE_MAP, selectedMultichainChainId: UniverseChainId.Base }),
    )

    const { result } = renderUseTDPSwapCurrency(store, MAINNET_PATH)

    expect(result.current).toBe(BASE_CURRENCY_ON_BASE)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, TWO_CHAINS[1])
  })

  describe('with TDPChainSearchParamSync', () => {
    function SwapChainRecorder({ committedChainIds }: { committedChainIds: number[] }): null {
      const swapCurrency = useTDPSwapCurrency()
      // The swap widget detects chain changes in an effect, so record committed values the same way.
      useEffect(() => {
        committedChainIds.push(swapCurrency.chainId)
      }, [swapCurrency, committedChainIds])
      return null
    }

    function renderWithSync(store: ReturnType<typeof createTDPStore>, initialPath: string): number[] {
      const committedChainIds: number[] = []
      render(
        <MemoryRouter initialEntries={[initialPath]}>
          <TDPStoreContext.Provider value={store}>
            <TDPChainSearchParamSync />
            <SwapChainRecorder committedChainIds={committedChainIds} />
          </TDPStoreContext.Provider>
        </MemoryRouter>,
      )
      return committedChainIds
    }

    beforeEach(() => {
      window.history.replaceState(null, '', '/')
      mocked(currencyForSelectedMultichainDeployment).mockImplementation(
        (base: Currency, entry: MultichainTokenEntry | undefined) =>
          entry?.chainId === UniverseChainId.Base ? BASE_CURRENCY_ON_BASE : base,
      )
    })

    it('never targets another chain while a store reset re-resolves the path chain', () => {
      const store = createTDPStore(
        createTDPState({ multiChainMap: BASE_HIGHEST_BALANCE_MAP, selectedMultichainChainId: UniverseChainId.Mainnet }),
      )
      const committedChainIds = renderWithSync(store, MAINNET_PATH)

      // TDPStoreContextProvider resets the selection to undefined when navigating to another token.
      act(() => {
        store.setState({ selectedMultichainChainId: undefined })
      })

      expect(store.getState().selectedMultichainChainId).toBe(UniverseChainId.Mainnet)
      expect(committedChainIds.length).toBeGreaterThan(0)
      expect(new Set(committedChainIds)).toEqual(new Set([UniverseChainId.Mainnet]))
    })

    it('still auto-targets the highest-balance chain in the all-networks view', () => {
      const store = createTDPStore(createTDPState({ multiChainMap: BASE_HIGHEST_BALANCE_MAP }))
      const committedChainIds = renderWithSync(store, ALL_NETWORKS_PATH)

      expect(store.getState().selectedMultichainChainId).toBeUndefined()
      expect(committedChainIds.at(-1)).toBe(UniverseChainId.Base)
    })
  })
})
