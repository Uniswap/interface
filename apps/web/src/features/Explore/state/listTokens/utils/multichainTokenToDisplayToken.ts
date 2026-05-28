import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Amount, Image, TokenProject } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getRestTokenSafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { TimePeriod } from '~/appGraphql/data/util'
import type { TokenStat } from '~/types/explore'

/** Stats shape with optional volume fields (from data-api MultichainToken.stats). */
type StatsWithVolume = {
  volume1h?: number
  volume1d?: number
  volume7d?: number
  volume30d?: number
  volume1y?: number
}

/** Returns the volume value for the given time period, or volume1d as fallback (e.g. legacy path only has volume1d). */
function getVolumeForTimePeriod(stats: StatsWithVolume | undefined, timePeriod: TimePeriod): number | undefined {
  if (!stats) {
    return undefined
  }
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return stats.volume1h ?? stats.volume1d
    case TimePeriod.DAY:
      return stats.volume1d
    case TimePeriod.WEEK:
      return stats.volume7d ?? stats.volume1d
    case TimePeriod.MONTH:
      return stats.volume30d ?? stats.volume1d
    case TimePeriod.YEAR:
    case TimePeriod.MAX:
      return stats.volume1y ?? stats.volume1d
    default:
      return stats.volume1d
  }
}

function pickPrimaryChainToken(
  chainTokens: MultichainToken['chainTokens'],
  exploreChainId: UniverseChainId | undefined,
): (typeof chainTokens)[number] | undefined {
  if (chainTokens.length === 0) {
    return undefined
  }
  if (exploreChainId === undefined) {
    return chainTokens[0]
  }
  return chainTokens.find((ct) => ct.chainId === exploreChainId)
}

/**
 * Converts a MultichainToken to a TokenStat-like object for display in tables/carousels.
 * Uses the first chainToken as the primary chain for links and price lookup, or the deployment
 * matching `exploreChainId` when set (e.g. explore page network filter) so TDP opens on that network.
 * When `exploreChainId` is set and no deployment matches, returns undefined (exclude from chain-scoped lists).
 * Returns undefined when chainTokens is empty.
 *
 * When filterTimePeriod is provided, the volume shown matches the selected period (backend returns multiple volume fields).
 * When omitted, defaults to volume1d. Legacy path only populates volume1d with the period-specific value.
 *
 * Safety level: data-api enum is mapped to GraphQL SafetyLevel via getRestTokenSafetyInfo (revisit before GA if enum contract changes).
 */
export function multichainTokenToDisplayToken({
  mcToken,
  filterTimePeriod = TimePeriod.DAY,
  exploreChainId,
}: {
  mcToken: MultichainToken
  filterTimePeriod?: TimePeriod
  exploreChainId?: UniverseChainId
}): TokenStat | undefined {
  const primary = pickPrimaryChainToken(mcToken.chainTokens, exploreChainId)
  // Guard empty chainTokens, should never happen but protobuf default can be empty array

  if (!primary) {
    return undefined
  }
  const chainId = primary.chainId
  const chain = toGraphQLChain(chainId)
  const address = primary.address
  const { mappedSafetyLevel } = getRestTokenSafetyInfo({
    safetyLevel: mcToken.safetyLevel,
    spamCode: mcToken.spamCode,
  })

  return {
    id: mcToken.multichainId,
    chain,
    address,
    name: mcToken.name,
    symbol: mcToken.symbol,
    decimals: primary.decimals,
    logo: mcToken.logoUrl,
    chainTokens: [],
    price: mcToken.stats?.price !== undefined ? new Amount({ value: mcToken.stats.price }) : undefined,
    fullyDilutedValuation: mcToken.stats?.fdv !== undefined ? new Amount({ value: mcToken.stats.fdv }) : undefined,
    pricePercentChange1Hour:
      mcToken.stats?.priceChange1h !== undefined ? new Amount({ value: mcToken.stats.priceChange1h }) : undefined,
    pricePercentChange1Day:
      mcToken.stats?.priceChange1d !== undefined ? new Amount({ value: mcToken.stats.priceChange1d }) : undefined,
    volume: (() => {
      const value = getVolumeForTimePeriod(mcToken.stats, filterTimePeriod)
      return value !== undefined ? new Amount({ value }) : undefined
    })(),
    project: new TokenProject({
      name: mcToken.projectName,
      logo: mcToken.logoUrl ? new Image({ url: mcToken.logoUrl }) : undefined,
      safetyLevel: mappedSafetyLevel,
      isSpam: mcToken.spamCode !== 0,
    }),
  }
}
