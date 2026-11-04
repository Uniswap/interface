import type { PartialMessage } from '@bufbuild/protobuf'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Pool, PoolRankStats, RankedPool, Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { rankedPoolToPoolSearchResult } from 'uniswap/src/data/apiClients/dataApiService/search/search'
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const TOKEN0_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const TOKEN1_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const HOOK_ADDRESS = '0x0000000000000000000000000000000000000abc'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function createRankedPool(overrides: PartialMessage<Pool> = {}, stats?: PartialMessage<PoolRankStats>): RankedPool {
  return new RankedPool({
    pool: new Pool({
      chainId: UniverseChainId.Mainnet,
      poolId: '0xpool',
      token0: new Token({ chainId: UniverseChainId.Mainnet, address: TOKEN0_ADDRESS }),
      token1: new Token({ chainId: UniverseChainId.Mainnet, address: TOKEN1_ADDRESS }),
      protocolVersion: ProtocolVersion.V3,
      feeTier: 500,
      ...overrides,
    }),
    ...(stats && { stats: new PoolRankStats(stats) }),
  })
}

describe(rankedPoolToPoolSearchResult, () => {
  it('maps a V3 pool to a PoolSearchHistoryResult', () => {
    const result = rankedPoolToPoolSearchResult(createRankedPool())

    expect(result).toEqual({
      type: SearchHistoryResultType.Pool,
      chainId: UniverseChainId.Mainnet,
      poolId: '0xpool',
      protocolVersion: ProtocolVersion.V3,
      hookAddress: undefined,
      feeTier: 500,
      token0CurrencyId: buildCurrencyId(UniverseChainId.Mainnet, TOKEN0_ADDRESS),
      token1CurrencyId: buildCurrencyId(UniverseChainId.Mainnet, TOKEN1_ADDRESS),
    })
  })

  // fee_tier is served for every protocol version now — the pool key's fee (the v4 dynamic-fee flag)
  // for a dynamic pool, the fixed 0.30% for a V2 pair — so both pass straight through.
  it('carries the served fee tier for v4 dynamic-fee pools', () => {
    const result = rankedPoolToPoolSearchResult(
      createRankedPool({
        protocolVersion: ProtocolVersion.V4,
        feeTier: DYNAMIC_FEE_AMOUNT,
        isDynamicFee: true,
        hookAddress: HOOK_ADDRESS,
      }),
    )

    expect(result?.feeTier).toBe(DYNAMIC_FEE_AMOUNT)
    expect(result?.hookAddress).toBe(HOOK_ADDRESS)
  })

  it('carries the served fee tier for protocol-V2 pairs', () => {
    const result = rankedPoolToPoolSearchResult(
      createRankedPool({ protocolVersion: ProtocolVersion.V2, feeTier: V2_DEFAULT_FEE_TIER }),
    )

    expect(result?.feeTier).toBe(V2_DEFAULT_FEE_TIER)
  })

  // The guard that keeps an unkeyable row out of search history rather than fabricating a tier.
  it('drops a pool with no served fee tier', () => {
    expect(rankedPoolToPoolSearchResult(createRankedPool({ feeTier: undefined }))).toBeUndefined()
  })

  it('normalizes native placeholder addresses to the chain-native address', () => {
    const result = rankedPoolToPoolSearchResult(
      createRankedPool({ token0: new Token({ chainId: UniverseChainId.Mainnet, address: ZERO_ADDRESS }) }),
    )

    expect(result?.token0CurrencyId).toBe(
      buildCurrencyId(UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Mainnet)),
    )
  })

  it('returns undefined for an unspecified protocol version', () => {
    expect(
      rankedPoolToPoolSearchResult(createRankedPool({ protocolVersion: ProtocolVersion.UNSPECIFIED })),
    ).toBeUndefined()
  })

  it('returns undefined when a pool token is missing', () => {
    expect(rankedPoolToPoolSearchResult(createRankedPool({ token1: undefined }))).toBeUndefined()
  })

  it('returns undefined when the ranked pool has no pool', () => {
    expect(rankedPoolToPoolSearchResult(new RankedPool({}))).toBeUndefined()
  })

  it('returns undefined, not throws, for a native-token pool on a chain the app no longer supports', () => {
    // Blast (81457) was removed from the app; hardcoded because it is no longer a UniverseChainId.
    const pool = createRankedPool({
      chainId: 81457,
      token0: { address: '0x0000000000000000000000000000000000000000' },
    })
    expect(rankedPoolToPoolSearchResult(pool)).toBeUndefined()
  })

  it('returns undefined for a non-dynamic V3/V4 pool with no fee tier', () => {
    expect(rankedPoolToPoolSearchResult(createRankedPool({ feeTier: undefined }))).toBeUndefined()
  })

  it('maps 1d volume and APR into stats', () => {
    const result = rankedPoolToPoolSearchResult(createRankedPool({}, { volume1d: 12_345, apr: 3.2 }))

    expect(result?.stats).toEqual({ volume1dUsd: 12_345, apr: 3.2 })
  })

  it('leaves stats unset when the ranked pool has no volume or APR', () => {
    expect(rankedPoolToPoolSearchResult(createRankedPool())?.stats).toBeUndefined()
  })
})
