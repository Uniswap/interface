import { renderHook } from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { PropsWithChildren, ReactElement } from 'react'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPStoreContext } from '~/pages/TokenDetails/context/TDPContext'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPStatsMarketSource } from '~/pages/TokenDetails/hooks/useTDPStatsMarketSource'
import { mocked } from '~/test-utils/mocked'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useMultichainTokenEntries', () => ({
  useMultichainTokenEntries: vi.fn(),
}))

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
    currency: undefined,
  } as unknown as TDPState
}

const ONE_CHAIN: MultichainTokenEntry[] = [{ chainId: UniverseChainId.Mainnet, address: '0x111', isNative: false }]

const TWO_CHAINS: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0x111', isNative: false },
  { chainId: UniverseChainId.Base, address: '0x222', isNative: false },
]

const rollupMarket = { __typename: 'TokenMarket' as const, id: 'rollup-market' }
const baseDeploymentMarket = { __typename: 'TokenMarket' as const, id: 'base-deployment-market' }

type NonNullTokenQueryData = NonNullable<TokenQueryData>

function buildTokenQueryData(
  overrides: { tokens?: NonNullable<NonNullable<TokenQueryData>['project']>['tokens'] } = {},
): NonNullTokenQueryData {
  const tokens =
    overrides.tokens ??
    ([
      {
        __typename: 'Token' as const,
        chain: GraphQLApi.Chain.Ethereum,
        market: { __typename: 'TokenMarket' as const, id: 'eth-market' },
      },
      {
        __typename: 'Token' as const,
        chain: GraphQLApi.Chain.Base,
        market: baseDeploymentMarket,
      },
    ] as NonNullable<NonNullable<TokenQueryData>['project']>['tokens'])

  return {
    __typename: 'Token',
    market: rollupMarket,
    project: {
      __typename: 'TokenProject',
      tokens,
    },
  } as unknown as NonNullTokenQueryData
}

function renderUseTDPStatsMarketSource(
  tokenQueryData: TokenQueryData | undefined,
  store: ReturnType<typeof createTDPStore>,
) {
  const wrapper = ({ children }: PropsWithChildren): ReactElement => (
    <TDPStoreContext.Provider value={store}>{children}</TDPStoreContext.Provider>
  )
  return renderHook(() => useTDPStatsMarketSource(tokenQueryData), { wrapper })
}

describe(useTDPStatsMarketSource, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useMultichainTokenEntries).mockReturnValue(ONE_CHAIN)
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.MultichainTokenUx)
  })

  it('returns empty stats input when token query data is undefined', () => {
    const store = createTDPStore(createTDPState())

    const { result } = renderUseTDPStatsMarketSource(undefined, store)

    expect(result.current.showAggregatedStats).toBe(true)
    expect(result.current.filteredDeploymentMarket).toBeUndefined()
    expect(result.current.marketStatsInput).toBeUndefined()
    expect(result.current.networkFilterName).toBe('')
  })

  it('uses rollup market when multichain token UX is off', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    const tokenQueryData = buildTokenQueryData()
    const store = createTDPStore(createTDPState())

    const { result } = renderUseTDPStatsMarketSource(tokenQueryData, store)

    expect(result.current.showAggregatedStats).toBe(true)
    expect(result.current.marketStatsInput).toEqual({
      market: rollupMarket,
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
      project: tokenQueryData?.project,
    })
  })

  it('uses rollup market for single-chain deployment list', () => {
    mocked(useMultichainTokenEntries).mockReturnValue(ONE_CHAIN)
    const tokenQueryData = buildTokenQueryData()
    const store = createTDPStore(createTDPState({ selectedMultichainChainId: UniverseChainId.Base }))

    const { result } = renderUseTDPStatsMarketSource(tokenQueryData, store)

    expect(result.current.showAggregatedStats).toBe(true)
    expect(result.current.marketStatsInput?.market).toBe(rollupMarket)
  })

  it('uses rollup market when multichain UX is on but no network is selected', () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)
    const tokenQueryData = buildTokenQueryData()
    const store = createTDPStore(createTDPState({ selectedMultichainChainId: undefined }))

    const { result } = renderUseTDPStatsMarketSource(tokenQueryData, store)

    expect(result.current.showAggregatedStats).toBe(true)
    expect(result.current.filteredDeploymentMarket).toBeUndefined()
    expect(result.current.marketStatsInput?.market).toBe(rollupMarket)
  })

  it('uses filtered deployment market when a multichain network is selected', () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)
    const tokenQueryData = buildTokenQueryData()
    const store = createTDPStore(createTDPState({ selectedMultichainChainId: UniverseChainId.Base }))

    const { result } = renderUseTDPStatsMarketSource(tokenQueryData, store)

    expect(result.current.showAggregatedStats).toBe(false)
    expect(result.current.filteredDeploymentMarket).toBe(baseDeploymentMarket)
    expect(result.current.marketStatsInput).toEqual({
      market: baseDeploymentMarket,
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
      project: tokenQueryData?.project,
    })
    expect(result.current.networkFilterName).toBe(getChainLabel(UniverseChainId.Base))
  })

  it('does not set market stats input when selection has no matching project token row', () => {
    mocked(useMultichainTokenEntries).mockReturnValue(TWO_CHAINS)
    const tokenQueryData = buildTokenQueryData({
      tokens: [
        {
          __typename: 'Token' as const,
          chain: GraphQLApi.Chain.Ethereum,
          market: { __typename: 'TokenMarket' as const, id: 'eth-only' },
        },
      ] as NonNullable<NonNullable<TokenQueryData>['project']>['tokens'],
    })
    const store = createTDPStore(createTDPState({ selectedMultichainChainId: UniverseChainId.Base }))

    const { result } = renderUseTDPStatsMarketSource(tokenQueryData, store)

    expect(result.current.showAggregatedStats).toBe(false)
    expect(result.current.filteredDeploymentMarket).toBeUndefined()
    expect(result.current.marketStatsInput).toBeUndefined()
  })
})
