import { SafetyLevel, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  ChainTokenRankStats,
  MultichainToken,
  RankedMultichainToken,
  TokenPriceData,
  TokenProject,
  TokenRankStats,
  TokenSafety,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { PricePoint } from '~/appGraphql/data/util'
import type { RankedMultichainTokensResult } from '~/features/Explore/state/listTokens/types'
import type {
  ExploreStatVolumeAmounts,
  LegacyExploreStatChainToken,
  TokenStat,
  TokenStatWithExploreVolumes,
} from '~/types/explore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

type LegacyVolumeFields = {
  volume1h?: number
  volume1d?: number
  volume7d?: number
  volume30d?: number
  volume1y?: number
}

function legacyVolumeFieldsFromExploreAmounts(stat: ExploreStatVolumeAmounts): LegacyVolumeFields {
  return {
    volume1h: stat.volume1Hour?.value,
    volume1d: stat.volume1Day?.value,
    volume7d: stat.volume1Week?.value,
    volume30d: stat.volume1Month?.value,
    volume1y: stat.volume1Year?.value,
  }
}

function legacyVolumeFieldsFromChainToken(ct: LegacyExploreStatChainToken): LegacyVolumeFields {
  return {
    volume1h: ct.volume1h,
    volume1d: ct.volume1d,
    volume7d: ct.volume7d,
    volume30d: ct.volume30d,
    volume1y: ct.volume1y,
  }
}

function hasLegacyVolume(fields: LegacyVolumeFields): boolean {
  return (
    fields.volume1h !== undefined ||
    fields.volume1d !== undefined ||
    fields.volume7d !== undefined ||
    fields.volume30d !== undefined ||
    fields.volume1y !== undefined
  )
}

/** Prefer explore period fields; fall back to filtered `volume` (set by useTopTokensLegacy). */
function legacyVolumeFieldsFromStat(stat: TokenStat): LegacyVolumeFields {
  const fromExplore = legacyVolumeFieldsFromExploreAmounts(stat as TokenStatWithExploreVolumes)
  if (hasLegacyVolume(fromExplore)) {
    return fromExplore
  }
  if (stat.volume?.value !== undefined) {
    return { volume1d: stat.volume.value }
  }
  return {}
}

const STANDARD_TO_TOKEN_TYPE: Partial<Record<string, TokenType>> = {
  UNKNOWN: TokenType.UNKNOWN,
  NATIVE: TokenType.NATIVE,
  ERC20: TokenType.ERC20,
  ERC721: TokenType.ERC721,
  ERC1155: TokenType.ERC1155,
  SPL: TokenType.SPL,
}

function tokenTypeFromStat(stat: TokenStat): TokenType | undefined {
  const standard = stat.standard?.toUpperCase()
  return standard ? STANDARD_TO_TOKEN_TYPE[standard] : undefined
}

/** Valid SafetyLevel enum values (numeric); protobuf enum is number-based. */
const VALID_SAFETY_LEVELS = new Set(Object.values(SafetyLevel).filter((v): v is number => typeof v === 'number'))

function toSafetyLevel(value: unknown): SafetyLevel {
  const num = Number(value)
  if (!Number.isFinite(num) || !Number.isInteger(num) || !VALID_SAFETY_LEVELS.has(num)) {
    return SafetyLevel.UNKNOWN
  }
  return num as SafetyLevel
}

/**
 * v2's TokenSafety is a blocked/verified/neither tri-state with no MEDIUM_WARNING/STRONG_WARNING
 * equivalent, so those two legacy levels collapse to "neither" here (known fidelity loss).
 */
function toTokenSafety(stat: TokenStat): TokenSafety {
  const legacyLevel = stat.project?.safetyLevel ? toSafetyLevel(stat.project.safetyLevel) : SafetyLevel.UNKNOWN
  return new TokenSafety({
    isSpam: stat.project?.isSpam ?? false,
    isVerified: legacyLevel === SafetyLevel.VERIFIED,
    isBlocked: legacyLevel === SafetyLevel.BLOCKED,
  })
}

function chainStatsFromDeployments({
  primaryChainId,
  stat,
  exploreVolumes,
}: {
  primaryChainId: number
  stat: TokenStat
  exploreVolumes: LegacyVolumeFields
}): ChainTokenRankStats[] {
  const chainTokens = stat.chainTokens ?? []
  if (chainTokens.length > 0) {
    return chainTokens.map(
      (ct) =>
        new ChainTokenRankStats({
          chainId: ct.chainId,
          stats: new TokenRankStats(legacyVolumeFieldsFromChainToken(ct)),
        }),
    )
  }
  return [new ChainTokenRankStats({ chainId: primaryChainId, stats: new TokenRankStats(exploreVolumes) })]
}

function addressesFromDeployments(primaryChainId: number, stat: TokenStat): Record<string, string> {
  const chainTokens = stat.chainTokens ?? []
  if (chainTokens.length > 0) {
    return Object.fromEntries(chainTokens.map((ct) => [String(ct.chainId), ct.address]))
  }
  return { [String(primaryChainId)]: stat.address }
}

/**
 * Converts legacy Explore TokenStat[] to RankedMultichainToken[] (v2 shape) so the legacy path
 * produces the same canonical shape the (eventual) v2 backend will return.
 *
 * Each TokenStat becomes one RankedMultichainToken. `chainStats`/`addresses` are built from
 * `stat.chainTokens` when present (multichain ExploreStats row); otherwise a single chain entry
 * is built from `chain`/`address`. Token type is derived from stat.standard when present;
 * otherwise type is TokenType.UNKNOWN.
 *
 * @param tokenStats - Legacy explore token stats, or undefined/empty for no tokens.
 */
export function tokenStatsToRankedMultichainTokens(tokenStats: TokenStat[] | undefined): RankedMultichainTokensResult {
  if (!tokenStats?.length) {
    return { multichainTokens: [], priceHistoryByMultichainId: {} }
  }
  const priceHistoryByMultichainId: Record<string, PricePoint[]> = {}
  const multichainTokens = tokenStats.map((stat) => {
    const primaryChainId = getChainIdFromChainUrlParam(stat.chain.toLowerCase()) ?? 1
    const multichainId = `mc:${primaryChainId}_${stat.address}`
    const exploreVolumes = legacyVolumeFieldsFromStat(stat)

    if (stat.priceHistory?.length) {
      priceHistoryByMultichainId[multichainId] = stat.priceHistory
    }

    return new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId,
        symbol: stat.symbol,
        name: stat.name,
        decimals: stat.decimals ?? 18,
        type: tokenTypeFromStat(stat) ?? TokenType.UNKNOWN,
        addresses: addressesFromDeployments(primaryChainId, stat),
        price: new TokenPriceData({
          spotUsd: stat.price?.value,
          percentChange1h: stat.pricePercentChange1Hour?.value,
          percentChange1d: stat.pricePercentChange1Day?.value,
        }),
        safety: toTokenSafety(stat),
        // v2 TokenProject has no separate "project name" field (only description/homepage/twitter/logo);
        // the entity name shown on v1 (e.g. "Circle" for USDC) has no v2 equivalent.
        project: new TokenProject({ logoUrl: stat.logo ?? '' }),
      }),
      stats: new TokenRankStats({
        fdv: stat.fullyDilutedValuation?.value,
        ...exploreVolumes,
      }),
      chainStats: chainStatsFromDeployments({ primaryChainId, stat, exploreVolumes }),
    })
  })
  return { multichainTokens, priceHistoryByMultichainId }
}
