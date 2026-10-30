import {
  ProtectionResult as RestProtectionResult,
  SafetyLevel as RestSafetyLevel,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { GraphQLApi, TradingApi } from '@universe/api'
import { ProtectionResult, SafetyLevel } from 'uniswap/src/features/dataApi/safetyEnums'
import { AttackType } from 'uniswap/src/features/dataApi/types'
import { fromV2Verdict as mapV2Verdict } from 'uniswap/src/features/tokens/warnings/tokenProtection'
import { logger } from 'utilities/src/logger/logger'

export { ProtectionResult, SafetyLevel } from 'uniswap/src/features/dataApi/safetyEnums'

/** Legacy GraphQL → domain; deleted with the GraphQL data paths. */
export function fromGraphQLSafetyLevel(level: GraphQLApi.SafetyLevel | undefined): SafetyLevel | undefined {
  switch (level) {
    case GraphQLApi.SafetyLevel.Blocked:
      return SafetyLevel.Blocked
    case GraphQLApi.SafetyLevel.MediumWarning:
      return SafetyLevel.MediumWarning
    case GraphQLApi.SafetyLevel.StrongWarning:
      return SafetyLevel.StrongWarning
    case GraphQLApi.SafetyLevel.Verified:
      return SafetyLevel.Verified
    default:
      return undefined
  }
}

/** Legacy GraphQL → domain; deleted with the GraphQL data paths. */
export function fromGraphQLProtectionResult(result: GraphQLApi.ProtectionResult | undefined): ProtectionResult {
  switch (result) {
    case GraphQLApi.ProtectionResult.Benign:
      return ProtectionResult.Benign
    case GraphQLApi.ProtectionResult.Malicious:
      return ProtectionResult.Malicious
    case GraphQLApi.ProtectionResult.Spam:
      return ProtectionResult.Spam
    case GraphQLApi.ProtectionResult.Warning:
      return ProtectionResult.Warning
    default:
      return ProtectionResult.Unknown
  }
}

/** data.v1 protobuf → domain. */
export function fromRestSafetyLevel(level: RestSafetyLevel | undefined): SafetyLevel | undefined {
  switch (level) {
    case RestSafetyLevel.BLOCKED:
      return SafetyLevel.Blocked
    case RestSafetyLevel.MEDIUM_WARNING:
      return SafetyLevel.MediumWarning
    case RestSafetyLevel.STRONG_WARNING:
      return SafetyLevel.StrongWarning
    case RestSafetyLevel.VERIFIED:
      return SafetyLevel.Verified
    default:
      return undefined
  }
}

/** data.v1 protobuf → domain. */
export function fromRestProtectionResult(result: RestProtectionResult | undefined): ProtectionResult {
  switch (result) {
    case RestProtectionResult.BENIGN:
      return ProtectionResult.Benign
    case RestProtectionResult.MALICIOUS:
      return ProtectionResult.Malicious
    case RestProtectionResult.SPAM:
      return ProtectionResult.Spam
    case RestProtectionResult.WARNING:
      return ProtectionResult.Warning
    default:
      return ProtectionResult.Unknown
  }
}

/** Trading-api → domain. */
export function fromTradingApiSafetyLevel(level: TradingApi.SafetyLevel | undefined): SafetyLevel | undefined {
  switch (level) {
    case TradingApi.SafetyLevel.BLOCKED:
      return SafetyLevel.Blocked
    case TradingApi.SafetyLevel.MEDIUM_WARNING:
      return SafetyLevel.MediumWarning
    case TradingApi.SafetyLevel.STRONG_WARNING:
      return SafetyLevel.StrongWarning
    case TradingApi.SafetyLevel.VERIFIED:
      return SafetyLevel.Verified
    default:
      return undefined
  }
}

/** data.v2 `TokenSafety.verdict` strings → domain. */
export function fromV2Verdict(verdict: string | undefined): ProtectionResult {
  // Log non-empty unrecognized verdicts so v2 schema drift is detectable instead of silently
  // degrading (e.g. a malicious verdict falling to Unknown).
  return mapV2Verdict(verdict, (unrecognized) =>
    logger.warn('features/dataApi/safety.ts', 'fromV2Verdict', `Unrecognized v2 verdict: ${unrecognized}`),
  )
}

/**
 * REST services that proxy GraphQL (search, explore rankings) serve safety levels as the GraphQL
 * wire strings; uppercase-validate into the domain like parseProtectionResult, warning on
 * anything unrecognized.
 */
export function parseSafetyLevel(safetyLevel: string | undefined): SafetyLevel | undefined {
  if (!safetyLevel) {
    return undefined
  }
  const upperSafetyLevel = safetyLevel.toUpperCase()
  const validSafetyLevels: string[] = Object.values(SafetyLevel)
  if (validSafetyLevels.includes(upperSafetyLevel)) {
    return upperSafetyLevel as SafetyLevel
  }
  logger.warn('features/dataApi/safety.ts', 'parseSafetyLevel', `Invalid safetyLevel from REST payload: ${safetyLevel}`)
  return undefined
}

/**
 * `result` counterpart to parseSafetyLevel. Wire results are capitalized ('Malicious');
 * uppercase-validate into the domain, warning on anything unrecognized so schema drift is
 * detectable instead of silently degrading to Unknown.
 */
export function parseProtectionResult(result: string | undefined): ProtectionResult {
  if (!result) {
    return ProtectionResult.Unknown
  }
  const upperResult = result.toUpperCase()
  const validProtectionResults: string[] = Object.values(ProtectionResult)
  if (validProtectionResults.includes(upperResult)) {
    return upperResult as ProtectionResult
  }
  logger.warn(
    'features/dataApi/safety.ts',
    'parseProtectionResult',
    `Invalid protection result from REST payload: ${result}`,
  )
  return ProtectionResult.Unknown
}

// The serialized GraphQL ProtectionAttackType vocabulary, as served by the search/explore v1
// REST endpoints (which proxy GraphQL). Removing the GraphQL client doesn't retire this — it
// lives until those endpoints serve data.v2 safety shapes and callers move to
// getRestCurrencySafetyInfoV2. Values beyond the PRD's four displayed types are recognized but
// unranked, so they collapse to Other in getHighestPriorityAttackType.
const STRING_ATTACK_TYPES: Record<string, AttackType> = {
  HONEYPOT: AttackType.Honeypot,
  IMPERSONATOR: AttackType.Impersonator,
  AIRDROP_PATTERN: AttackType.Airdrop,
  HIGH_FEES: AttackType.HighFees,
  UNKNOWN: AttackType.Other,
  METADATA: AttackType.Other,
  INORGANIC_VOLUME: AttackType.Other,
  DYNAMIC_ANALYSIS: AttackType.Other,
  STATIC_CODE_SIGNATURE: AttackType.Other,
  KNOWN_MALICIOUS: AttackType.Other,
  UNSTABLE_TOKEN_PRICE: AttackType.Other,
  RUGPULL: AttackType.Other,
}

/**
 * `attackTypes` counterpart to parseSafetyLevel/parseProtectionResult: uppercase-validate the
 * string values into the domain, warning on unrecognized ones. An unrecognized string is most
 * likely a newly added server value the table above hasn't caught up with, so it still degrades
 * to a generic Other warning rather than dropping the signal entirely.
 */
export function parseAttackTypes(attackTypes: string[] | undefined): AttackType[] {
  return (attackTypes ?? []).map((attackType) => {
    const domainAttackType = STRING_ATTACK_TYPES[attackType.toUpperCase()]
    if (!domainAttackType) {
      logger.warn(
        'features/dataApi/safety.ts',
        'parseAttackTypes',
        `Unrecognized attackType from REST payload: ${attackType}`,
      )
    }
    return domainAttackType ?? AttackType.Other
  })
}
