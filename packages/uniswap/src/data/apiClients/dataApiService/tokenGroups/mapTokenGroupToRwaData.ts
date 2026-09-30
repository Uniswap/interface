import type { GetTokenGroupResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { TokenGroup } from '@uniswap/client-data-api/dist/data/v2/tokenGroups_pb'
import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { isSubjectToken } from 'uniswap/src/data/apiClients/dataApiService/relatedTokens/relatedTokenMappers'
import { pickPrimaryChainToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/pickPrimaryChainToken'
import { mapAddressesToChainTokens } from 'uniswap/src/data/apiClients/dataApiService/rwa/rwaMappingUtils'
import type { TokenGroupMember } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import { mapTokenIssuerInfo } from 'uniswap/src/features/rwa/issuers'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAAsset, RWAToken } from 'uniswap/src/features/rwa/types'
import { type RWAIssuerMarketData, rwaTokenMarketDataKey } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'
import { getRwaCategoryForCategoryId } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'

/** The v2 group mapped onto the v1 `RWAMatch` shape so the TDP RWA surfaces render unchanged. */
export type TokenGroupRwaData = {
  rwaMatch: RWAMatch
  /** Every group member except the subject token, in the backend's volume_1d DESC order. */
  otherIssuerTokens: RWAToken[]
  /** Card stats per member, keyed by `rwaTokenMarketDataKey`. */
  marketDataByToken: ReadonlyMap<string, RWAIssuerMarketData>
}

// The stub serves price on the token, not in member stats; stats stays as a fallback for real serving.
function mapMemberMarketData(member: RankedMultichainToken): RWAIssuerMarketData {
  return {
    priceUsd: member.multichainToken?.price?.spotUsd ?? member.stats?.price,
    marketCapUsd: member.stats?.marketCap,
    volume24hUsd: member.stats?.volume1d,
  }
}

/**
 * The subject member keeps the page's own leg; siblings take the mainnet-first enabled leg and are
 * dropped without one (the stub ignores `chain_ids`, so unsupported legs still arrive).
 */
function mapMemberToken({
  member,
  group,
  subject,
  enabledChainIds,
  enabledChainIdSet,
}: {
  member: RankedMultichainToken
  group: TokenGroup
  subject: TokenGroupMember
  enabledChainIds: readonly UniverseChainId[]
  enabledChainIdSet: ReadonlySet<number>
}): { token: RWAToken; isSubject: boolean } | undefined {
  const multichainToken = member.multichainToken
  if (!multichainToken) {
    return undefined
  }

  const chainTokens = mapAddressesToChainTokens(multichainToken.addresses)
  const isSubject = isSubjectToken(member, subject)
  const deployment = isSubject
    ? { chainId: subject.chainId, address: multichainToken.addresses[String(subject.chainId)] ?? subject.address }
    : pickPrimaryChainToken(chainTokens, enabledChainIds)
  if (!deployment) {
    return undefined
  }

  const enabledLegCount = chainTokens.filter((chainToken) => enabledChainIdSet.has(chainToken.chainId)).length

  return {
    isSubject,
    token: {
      chainId: deployment.chainId,
      address: deployment.address,
      ...mapTokenIssuerInfo(multichainToken.issuer),
      networkCount: enabledLegCount > 1 ? enabledLegCount : undefined,
      name: multichainToken.name,
      symbol: multichainToken.symbol,
      logoUrl: multichainToken.project?.logoUrl || group.logoUrl,
    },
  }
}

/** Maps a GetTokenGroup response onto the v1 `RWAMatch` shape. No member on the subject's leg means no match. */
export function mapTokenGroupToRwaData({
  response,
  subject,
  enabledChainIds,
}: {
  response: GetTokenGroupResponse
  subject: TokenGroupMember
  enabledChainIds: readonly UniverseChainId[]
}): TokenGroupRwaData | undefined {
  const group = response.group
  if (!group?.ticker) {
    return undefined
  }

  const enabledChainIdSet = new Set<number>(enabledChainIds)
  const marketDataByToken = new Map<string, RWAIssuerMarketData>()
  const tokens: RWAToken[] = []
  let subjectToken: RWAToken | undefined

  for (const member of response.members) {
    const mapped = mapMemberToken({ member, group, subject, enabledChainIds, enabledChainIdSet })
    if (!mapped) {
      continue
    }
    tokens.push(mapped.token)
    marketDataByToken.set(rwaTokenMarketDataKey(mapped.token), mapMemberMarketData(member))
    if (mapped.isSubject && !subjectToken) {
      subjectToken = mapped.token
    }
  }

  if (!subjectToken) {
    return undefined
  }

  const asset: RWAAsset = {
    symbol: group.ticker,
    name: group.displayName,
    icon: group.logoUrl,
    tokens,
    category: getRwaCategoryForCategoryId(group.categoryId),
  }

  return {
    rwaMatch: { asset, token: subjectToken },
    otherIssuerTokens: tokens.filter((token) => token !== subjectToken),
    marketDataByToken,
  }
}
