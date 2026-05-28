import { renderHook } from '@testing-library/react'
import { Currency, Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { PropsWithChildren, ReactElement } from 'react'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { currencyForSelectedMultichainDeployment } from '~/pages/TokenDetails/components/header/currencyForSelectedMultichainDeployment'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPStoreContext, type MultiChainMap } from '~/pages/TokenDetails/context/TDPContext'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPSwapCurrency } from '~/pages/TokenDetails/hooks/useTDPSwapCurrency'
import { mocked } from '~/test-utils/mocked'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useMultichainTokenEntries', () => ({
  useMultichainTokenEntries: vi.fn(),
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

type ProjectTokens = NonNullable<NonNullable<NonNullable<TokenQueryData>['project']>['tokens']>

function makeToken(chain: GraphQLApi.Chain, volume: number): ProjectTokens[number] {
  return { chain, address: '0x1', market: { volume24H: { value: volume } } } as unknown as ProjectTokens[number]
}

function createTDPState(
  overrides: Partial<Pick<TDPState, 'selectedMultichainChainId' | 'multiChainMap'>> & {
    tokens?: ProjectTokens
  } = {},
): TDPState {
  return {
    currencyChain: GraphQLApi.Chain.Ethereum,
    currencyChainId: UniverseChainId.Mainnet,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenQuery: {
      loading: false,
      data: overrides.tokens ? { token: { project: { tokens: overrides.tokens } } } : undefined,
    },
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
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.MultichainTokenUx)
    mocked(currencyForSelectedMultichainDeployment).mockReturnValue(BASE_CURRENCY)
  })

  it('returns base currency when feature flag is off', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    const store = createTDPStore(createTDPState())

    const { result } = renderUseTDPSwapCurrency(store)

    expect(result.current).toBe(BASE_CURRENCY)
    // currencyForSelectedMultichainDeployment called with undefined entry → returns base
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, undefined)
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
    const tokens: ProjectTokens = [
      makeToken(GraphQLApi.Chain.Ethereum, 10_000_000),
      makeToken(GraphQLApi.Chain.Base, 1_000_000),
    ]
    const store = createTDPStore(createTDPState({ multiChainMap, tokens }))

    const { result } = renderUseTDPSwapCurrency(store)

    // Should pick Base (highest balance) even though Ethereum has higher volume
    expect(result.current).toBe(BASE_CURRENCY_ON_BASE)
    expect(mocked(currencyForSelectedMultichainDeployment)).toHaveBeenCalledWith(BASE_CURRENCY, TWO_CHAINS[1])
  })

  it('falls back to highest-volume deployment when no filter and no balances', () => {
    mocked(currencyForSelectedMultichainDeployment).mockReturnValue(BASE_CURRENCY_ON_BASE)
    const tokens: ProjectTokens = [
      makeToken(GraphQLApi.Chain.Ethereum, 1_000_000),
      makeToken(GraphQLApi.Chain.Base, 5_000_000),
    ]
    const store = createTDPStore(createTDPState({ tokens }))

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
