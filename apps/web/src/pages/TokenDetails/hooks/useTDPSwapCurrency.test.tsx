import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import type { PropsWithChildren, ReactElement } from 'react'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { currencyForSelectedMultichainDeployment } from '~/pages/TokenDetails/components/header/currencyForSelectedMultichainDeployment'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
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
    currencyChain: GraphQLApi.Chain.Ethereum,
    currencyChainId: UniverseChainId.Mainnet,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenQuery: { loading: false, data: undefined },
    multiChainMap: overrides.multiChainMap ?? {},
    selectedMultichainChainId: overrides.selectedMultichainChainId,
    tokenColor: undefined,
    currency: BASE_CURRENCY,
  } as unknown as TDPState
}

function renderUseTDPSwapCurrency(store: ReturnType<typeof createTDPStore>) {
  const wrapper = ({ children }: PropsWithChildren): ReactElement => (
    <TDPStoreContext.Provider value={store}>{children}</TDPStoreContext.Provider>
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

  it('returns highest-balance deployment when no filter and balances exist', () => {
    mocked(currencyForSelectedMultichainDeployment).mockReturnValue(BASE_CURRENCY_ON_BASE)
    const multiChainMap: MultiChainMap = {
      [GraphQLApi.Chain.Ethereum]: {
        address: '0x111',
        balance: { balanceUSD: 100 } as NonNullable<MultiChainMap[GraphQLApi.Chain]>['balance'],
      },
      [GraphQLApi.Chain.Base]: {
        address: '0x222',
        balance: { balanceUSD: 5000 } as NonNullable<MultiChainMap[GraphQLApi.Chain]>['balance'],
      },
    }
    mocked(useTDPPerChainVolume).mockReturnValue({
      [UniverseChainId.Mainnet]: 10_000_000,
      [UniverseChainId.Base]: 1_000_000,
    })
    const store = createTDPStore(createTDPState({ multiChainMap }))

    const { result } = renderUseTDPSwapCurrency(store)

    // Should pick Base (highest balance) even though Ethereum has higher volume
    expect(result.current).toBe(BASE_CURRENCY_ON_BASE)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, TWO_CHAINS[1])
  })

  it('falls back to highest-volume deployment when no filter and no balances', () => {
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
})
