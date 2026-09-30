import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { ListTokenGroupsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { RankedTokenGroup } from '@uniswap/client-data-api/dist/data/v2/tokenGroups_pb'
import type {
  MultichainToken,
  RankedMultichainToken,
  TokenRankStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { mapAddressesToChainTokens } from 'uniswap/src/data/apiClients/dataApiService/rwa/rwaMappingUtils'
import type {
  IssuerToken,
  Rwa,
  RwaAggregatedMetrics,
  RwaSparkline,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import {
  getVolumeForOrderBy,
  type VolumeOrderBy,
} from 'uniswap/src/data/apiClients/dataApiService/utils/tokenRankStatsVolume'

function mapSparkline(points: RankedMultichainToken['sparkline']): RwaSparkline {
  return { points: points.map((point) => ({ timestampS: Number(point.timestamp), value: point.value })) }
}

function mapGroupStats({
  stats,
  sparkline1d,
  volumeOrderBy,
}: {
  stats: TokenRankStats | undefined
  sparkline1d: RwaSparkline
  volumeOrderBy: VolumeOrderBy
}): RwaAggregatedMetrics {
  return {
    priceUsd: stats?.price ?? 0,
    priceChange1hPct: stats?.priceChange1h,
    priceChange24hPct: stats?.priceChange1d,
    marketCapUsd: stats?.marketCap,
    volume24hUsd: getVolumeForOrderBy(stats, volumeOrderBy) ?? 0,
    sparkline1d,
  }
}

// The stub serves member price on `multichainToken.price` and leaves it out of member stats;
// stats is kept as a fallback in case the real endpoint fills it in.
function mapMemberStats({
  token,
  stats,
  sparkline1d,
  volumeOrderBy,
}: {
  token: MultichainToken
  stats: TokenRankStats | undefined
  sparkline1d: RwaSparkline
  volumeOrderBy: VolumeOrderBy
}): RwaAggregatedMetrics {
  return {
    priceUsd: token.price?.spotUsd ?? stats?.price ?? 0,
    priceChange1hPct: token.price?.percentChange1h ?? stats?.priceChange1h,
    priceChange24hPct: token.price?.percentChange1d ?? stats?.priceChange1d,
    marketCapUsd: stats?.marketCap,
    volume24hUsd: getVolumeForOrderBy(stats, volumeOrderBy) ?? 0,
    sparkline1d,
  }
}

export function mapGroupMemberToIssuerToken({
  member,
  parentLogoUrl,
  volumeOrderBy,
}: {
  member: RankedMultichainToken
  parentLogoUrl: string
  volumeOrderBy: VolumeOrderBy
}): IssuerToken | null {
  const token = member.multichainToken
  if (!token?.symbol || !token.issuer?.id) {
    return null
  }

  const chainTokens = mapAddressesToChainTokens(token.addresses)
  if (chainTokens.length === 0) {
    return null
  }

  return {
    symbol: token.symbol,
    name: token.name,
    logoUrl: token.project?.logoUrl || parentLogoUrl,
    issuer: token.issuer.id,
    issuerDisplayName: token.issuer.displayName || undefined,
    ...mapMemberStats({ token, stats: member.stats, sparkline1d: mapSparkline(member.sparkline), volumeOrderBy }),
    chainTokens,
  }
}

export function mapRankedTokenGroup({
  rankedGroup,
  category,
  volumeOrderBy,
}: {
  rankedGroup: RankedTokenGroup
  category: RwaCategory
  volumeOrderBy: VolumeOrderBy
}): Rwa | null {
  const group = rankedGroup.group
  if (!group?.ticker) {
    return null
  }

  const issuerTokens = rankedGroup.members
    .map((member) => mapGroupMemberToIssuerToken({ member, parentLogoUrl: group.logoUrl, volumeOrderBy }))
    .filter((issuer): issuer is IssuerToken => issuer !== null)

  if (issuerTokens.length === 0) {
    return null
  }

  // Groups carry no sparkline; the grouped rows only chart the primary issuer anyway.
  const sparkline1d = issuerTokens[0]?.sparkline1d ?? { points: [] }

  return {
    symbol: group.ticker,
    // Rows render this with no further fallback, so an empty proto3 default must not blank the name.
    name: group.displayName || group.ticker,
    logoUrl: group.logoUrl,
    ...mapGroupStats({ stats: rankedGroup.stats, sparkline1d, volumeOrderBy }),
    priceDeviationPct: rankedGroup.priceDeviationPct,
    issuerTokens,
    categories: [category],
  }
}

export function mapRankedTokenGroupList({
  response,
  category,
  volumeOrderBy,
}: {
  response?: ListTokenGroupsResponse
  category: RwaCategory
  volumeOrderBy: VolumeOrderBy
}): Rwa[] {
  return (response?.tokenGroups ?? [])
    .map((rankedGroup) => mapRankedTokenGroup({ rankedGroup, category, volumeOrderBy }))
    .filter((rwa): rwa is Rwa => rwa !== null)
}
