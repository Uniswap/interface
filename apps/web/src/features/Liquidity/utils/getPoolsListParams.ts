import type { PartialMessage } from '@bufbuild/protobuf'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { ListPoolsRequest } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { PoolsOrderBy, PoolTokenLogicalOperator } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from '@universe/chains'
import type { PoolsFilterRequestParams } from '~/features/Liquidity/PoolsFilter/toRequest'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'

/** Every protocol version, sent explicitly. Equivalent to an empty list, which the endpoint also reads as "all". */
const ALL_PROTOCOL_VERSIONS = [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]

/**
 * The one chain a ranked pools list is scoped to, or `undefined` for all enabled networks.
 *
 * Precedence: the advanced filter's Network wins, then the surface's own chain (Explore's URL chain),
 * then a selected token's chain. That last fallback is what makes a token filter valid at all: token
 * addresses are chain-specific, so a token-filtered request must target a single chain.
 */
export function resolvePoolsListChainId({
  filterChainId,
  chainId,
  currencies,
}: {
  filterChainId?: UniverseChainId
  chainId?: UniverseChainId
  currencies?: readonly [Maybe<Currency>, Maybe<Currency>]
}): UniverseChainId | undefined {
  const [currency0, currency1] = currencies ?? []
  return filterChainId ?? chainId ?? currency0?.chainId ?? currency1?.chainId
}

/**
 * Shared data.v2 `ListPools` params for the ranked, filterable pools lists — the Explore pools tab and
 * the add-liquidity pool browser. Both surfaces send the same request; they differ only in that the
 * browser can additionally scope the list to one or two selected tokens.
 *
 * Sorting, search and the advanced protocol/TVL/APR/rewards filters are all applied by the backend,
 * so what a surface shows is entirely a function of this request.
 */
export function getPoolsListParams({
  chainId,
  fallbackChainIds,
  sort,
  filterParams,
  currencies,
  searchQuery,
}: {
  /** The single chain to scope to; when undefined the list spans `fallbackChainIds`. */
  chainId?: UniverseChainId
  /** Every enabled chain, used for an unscoped ("All networks") list. `chainIds` is required by the endpoint. */
  fallbackChainIds: UniverseChainId[]
  sort: { orderBy: PoolsOrderBy; ascending: boolean }
  /** Chain/protocol/stats filters contributed by the advanced pools filter. */
  filterParams?: PoolsFilterRequestParams
  /** Pool-browser token scope: one token matches either side, a pair matches that exact pair. */
  currencies?: readonly [Maybe<Currency>, Maybe<Currency>]
  /** Normalized search box value; undefined leaves the list unsearched. */
  searchQuery?: string
}): Omit<PartialMessage<ListPoolsRequest>, 'page'> {
  const [currency0, currency1] = currencies ?? []
  const tokens = [currency0, currency1]
    .map((currency) => (currency ? getTokenOrZeroAddress(currency) : undefined))
    .filter((address): address is string => address !== undefined)

  // Both tokens → AND (that exact pair); one token → OR (matches either side); none → no token filter.
  const tokenFilter = tokens.length
    ? {
        tokens,
        logicalOperator: tokens.length > 1 ? PoolTokenLogicalOperator.AND : PoolTokenLogicalOperator.OR,
      }
    : undefined

  const protocolVersions = filterParams?.protocolVersions ?? ALL_PROTOCOL_VERSIONS

  return {
    chainIds: chainId ? [chainId] : fallbackChainIds,
    sort,
    filter: {
      protocolVersions,
      tokenFilter,
      includeSpam: false,
      // Curated-feed quality gates. Sent explicitly even though the endpoint defaults it on, so the
      // ranked surfaces' request shape doesn't depend on a server-side default.
      applyTopLevelFilters: true,
      statsFilter: filterParams?.statsFilter,
      rewardsOnly: filterParams?.rewardsOnly,
      searchQuery,
    },
  }
}
