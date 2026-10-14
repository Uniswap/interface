import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsOrderBy, PoolTokenLogicalOperator } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { getPoolsListParams, resolvePoolsListChainId } from '~/features/Liquidity/utils/getPoolsListParams'

const ADDRESS_A = '0x1111111111111111111111111111111111111111'
const ADDRESS_B = '0x2222222222222222222222222222222222222222'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const ALL_PROTOCOL_VERSIONS = [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]
const SORT = { orderBy: PoolsOrderBy.TVL, ascending: false }
const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base]

function token(address: string, chainId = UniverseChainId.Mainnet): Currency {
  return { address, chainId, isToken: true, isNative: false } as unknown as Currency
}

function nativeToken(chainId = UniverseChainId.Mainnet): Currency {
  return { chainId, isToken: false, isNative: true } as unknown as Currency
}

describe('resolvePoolsListChainId', () => {
  it('prefers the advanced filter chain over the surface chain and a token chain', () => {
    const chainId = resolvePoolsListChainId({
      filterChainId: UniverseChainId.Base,
      chainId: UniverseChainId.Mainnet,
      currencies: [token(ADDRESS_A, UniverseChainId.Optimism), undefined],
    })
    expect(chainId).toBe(UniverseChainId.Base)
  })

  it('falls back to the surface chain when the advanced filter has none', () => {
    const chainId = resolvePoolsListChainId({
      chainId: UniverseChainId.Mainnet,
      currencies: [token(ADDRESS_A, UniverseChainId.Optimism), undefined],
    })
    expect(chainId).toBe(UniverseChainId.Mainnet)
  })

  // Token addresses are chain-specific, so a token-scoped list must land on that token's chain
  // rather than staying an all-networks query that would match same-address tokens elsewhere.
  it('falls back to a selected token chain when no filter or surface chain is set', () => {
    expect(resolvePoolsListChainId({ currencies: [token(ADDRESS_A, UniverseChainId.Optimism), undefined] })).toBe(
      UniverseChainId.Optimism,
    )
    expect(resolvePoolsListChainId({ currencies: [undefined, token(ADDRESS_B, UniverseChainId.Base)] })).toBe(
      UniverseChainId.Base,
    )
  })

  it('is undefined for an unscoped all-networks list', () => {
    expect(resolvePoolsListChainId({})).toBeUndefined()
  })
})

describe('getPoolsListParams', () => {
  it('builds an all-networks, all-versions request when nothing is filtered', () => {
    const params = getPoolsListParams({ fallbackChainIds: ENABLED_CHAINS, sort: SORT })

    expect(params).toEqual({
      chainIds: ENABLED_CHAINS,
      sort: SORT,
      filter: {
        protocolVersions: ALL_PROTOCOL_VERSIONS,
        tokenFilter: undefined,
        includeSpam: false,
        applyTopLevelFilters: true,
        statsFilter: undefined,
        rewardsOnly: undefined,
        searchQuery: undefined,
      },
    })
  })

  it('scopes chainIds to the single chain when one is resolved', () => {
    const params = getPoolsListParams({
      chainId: UniverseChainId.Base,
      fallbackChainIds: ENABLED_CHAINS,
      sort: SORT,
    })
    expect(params.chainIds).toEqual([UniverseChainId.Base])
  })

  it('ORs a single token so it matches either side of a pool', () => {
    const params = getPoolsListParams({
      fallbackChainIds: ENABLED_CHAINS,
      sort: SORT,
      currencies: [token(ADDRESS_A), undefined],
    })
    expect(params.filter?.tokenFilter).toEqual({
      tokens: [ADDRESS_A],
      logicalOperator: PoolTokenLogicalOperator.OR,
    })
  })

  it('ANDs a token pair so it matches only that exact pair', () => {
    const params = getPoolsListParams({
      fallbackChainIds: ENABLED_CHAINS,
      sort: SORT,
      currencies: [token(ADDRESS_A), token(ADDRESS_B)],
    })
    expect(params.filter?.tokenFilter).toEqual({
      tokens: [ADDRESS_A, ADDRESS_B],
      logicalOperator: PoolTokenLogicalOperator.AND,
    })
  })

  // A native leg is keyed on the zero address, so it must reach the filter as an address rather
  // than being dropped for having none.
  it('sends a native currency as the zero address', () => {
    const params = getPoolsListParams({
      fallbackChainIds: ENABLED_CHAINS,
      sort: SORT,
      currencies: [nativeToken(), token(ADDRESS_B)],
    })
    expect(params.filter?.tokenFilter?.tokens).toEqual([ZERO_ADDRESS, ADDRESS_B])
  })

  it('omits the token filter entirely when no token is selected', () => {
    const params = getPoolsListParams({
      fallbackChainIds: ENABLED_CHAINS,
      sort: SORT,
      currencies: [undefined, undefined],
    })
    expect(params.filter?.tokenFilter).toBeUndefined()
  })

  it('narrows to the advanced filter protocol selection', () => {
    const params = getPoolsListParams({
      fallbackChainIds: ENABLED_CHAINS,
      sort: SORT,
      filterParams: { protocolVersions: [ProtocolVersion.V2] },
    })
    expect(params.filter?.protocolVersions).toEqual([ProtocolVersion.V2])
  })

  // An empty advanced selection means "all".
  it('sends every version when the advanced filter selects none', () => {
    const params = getPoolsListParams({
      fallbackChainIds: ENABLED_CHAINS,
      sort: SORT,
      filterParams: { protocolVersions: undefined },
    })
    expect(params.filter?.protocolVersions).toEqual(ALL_PROTOCOL_VERSIONS)
  })

  it('passes the advanced stats and rewards filters through', () => {
    const statsFilter = { tvl: { min: 1000 }, apr: { max: 50 } }
    const params = getPoolsListParams({
      fallbackChainIds: ENABLED_CHAINS,
      sort: SORT,
      filterParams: { statsFilter, rewardsOnly: true },
    })
    expect(params.filter?.statsFilter).toEqual(statsFilter)
    expect(params.filter?.rewardsOnly).toBe(true)
  })

  it('passes the search query through', () => {
    const params = getPoolsListParams({ fallbackChainIds: ENABLED_CHAINS, sort: SORT, searchQuery: 'eth' })
    expect(params.filter?.searchQuery).toBe('eth')
  })
})
