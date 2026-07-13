import {
  ChainToken,
  ChainTokenStats,
  MultichainToken,
  SafetyLevel,
  SpamCode,
  TimestampedValue,
  TokenStats,
  TokenType,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
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

function chainTokenStatsFromLegacyVolumes(fields: LegacyVolumeFields): ChainTokenStats | undefined {
  if (!hasLegacyVolume(fields)) {
    return undefined
  }
  return new ChainTokenStats(fields)
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
 * Converts legacy Explore TokenStat[] to MultichainToken[] so the legacy path
 * can produce the same canonical shape as the backend paths.
 *
 * Each TokenStat becomes one MultichainToken. When `chainTokens` is set (multichain
 * ExploreStats row), all deployments are copied into `MultichainToken.chainTokens`;
 * otherwise a single ChainToken is built from `chain`, `address`, and `decimals`.
 * Token type is derived from stat.standard when present; otherwise type is TokenType.UNKNOWN.
 *
 * @param tokenStats - Legacy explore token stats, or undefined/empty for no tokens.
 * @returns MultichainToken[] in the same shape as backend list-tokens responses.
 */
export function tokenStatsToMultichainTokens(tokenStats: TokenStat[] | undefined): MultichainToken[] {
  if (!tokenStats?.length) {
    return []
  }
  return tokenStats.map((stat) => tokenStatToMultichainToken(stat))
}

function tokenStatToMultichainToken(stat: TokenStat): MultichainToken {
  const primaryChainId = getChainIdFromChainUrlParam(stat.chain.toLowerCase()) ?? 1
  const multichainId = `mc:${primaryChainId}_${stat.address}`

  const exploreVolumes = legacyVolumeFieldsFromStat(stat)
  const volumeStats = chainTokenStatsFromLegacyVolumes(exploreVolumes)

  const chainTokens =
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
    (stat.chainTokens?.length ?? 0) > 0
      ? stat.chainTokens.map(
          (ct) =>
            new ChainToken({
              chainId: ct.chainId,
              address: ct.address,
              decimals: ct.decimals ?? stat.decimals ?? 18,
              isBridged: ct.isBridged ?? false,
              stats: chainTokenStatsFromLegacyVolumes(legacyVolumeFieldsFromChainToken(ct)),
            }),
        )
      : [
          new ChainToken({
            chainId: primaryChainId,
            address: stat.address,
            decimals: stat.decimals ?? 18,
            isBridged: false,
            stats: volumeStats,
          }),
        ]

  const safetyLevel = stat.project?.safetyLevel ? toSafetyLevel(stat.project.safetyLevel) : SafetyLevel.UNKNOWN
  const spamCode = stat.project?.isSpam ? SpamCode.SPAM : SpamCode.NOT_SPAM

  const stats = new TokenStats({
    price: stat.price?.value,
    fdv: stat.fullyDilutedValuation?.value,
    priceChange1h: stat.pricePercentChange1Hour?.value,
    priceChange1d: stat.pricePercentChange1Day?.value,
    ...exploreVolumes,
    priceHistory1d: stat.priceHistory?.map(
      (p) => new TimestampedValue({ timestamp: BigInt(p.timestamp), value: p.value }),
    ),
  })

  return new MultichainToken({
    multichainId,
    symbol: stat.symbol,
    name: stat.name,
    type: tokenTypeFromStat(stat) ?? TokenType.UNKNOWN,
    projectName: stat.project?.name ?? '',
    logoUrl: stat.logo ?? '',
    safetyLevel,
    spamCode,
    stats,
    chainTokens,
  })
}
