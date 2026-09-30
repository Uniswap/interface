import { type PlainMessage } from '@bufbuild/protobuf'
import {
  ProtectionInfo,
  AttackType as RestAttackType,
  SpamCode as RestSpamCode,
  TokenMetadata,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { type TokenFees, type TokenSafety } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi, SpamCode } from '@universe/api'
import {
  fromGraphQLProtectionResult,
  fromGraphQLSafetyLevel,
  fromRestProtectionResult,
  fromRestSafetyLevel,
  fromV2Verdict,
  parseAttackTypes,
  parseProtectionResult,
  parseSafetyLevel,
  SafetyLevel,
} from 'uniswap/src/features/dataApi/safety'
import { AttackType, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'

// TokenFees.{buy_fee,sell_fee} are fraction-of-1 doubles (e.g. 0.05 === 5%) per the v2 proto.
// buildCurrency's buyFeeBps/sellFeeBps params want basis points as a string.
export function fractionToBpsString(fraction?: number): string | undefined {
  return fraction !== undefined ? String(Math.round(fraction * 10_000)) : undefined
}

function getTokenListFromSafetyLevel(safetyLevel?: SafetyLevel): TokenList {
  switch (safetyLevel) {
    case SafetyLevel.Blocked:
      return TokenList.Blocked
    case SafetyLevel.Verified:
      return TokenList.Default
    default:
      return TokenList.NonDefault
  }
}

// Attack-type display priority per the Token Protection PRD spec — the single ordered source
// every mapper below selects from. ExitScamRisk is Blockaid's lowest-confidence bucket, so any
// more specific signal outranks it.
const ATTACK_TYPE_PRIORITY: AttackType[] = [
  AttackType.Honeypot,
  AttackType.Impersonator,
  AttackType.Airdrop,
  AttackType.HighFees,
  AttackType.ExitScamRisk,
]

/**
 * Highest-priority attack type among already-domain-mapped values. A non-empty input whose
 * values all fall outside the priority list collapses to Other; empty input means no attack.
 */
function getHighestPriorityAttackType(attackTypes: AttackType[]): AttackType | undefined {
  if (attackTypes.length === 0) {
    return undefined
  }
  const attackTypeSet = new Set(attackTypes)
  return ATTACK_TYPE_PRIORITY.find((attackType) => attackTypeSet.has(attackType)) ?? AttackType.Other
}

const GRAPHQL_ATTACK_TYPES: Partial<Record<GraphQLApi.ProtectionAttackType, AttackType>> = {
  [GraphQLApi.ProtectionAttackType.Honeypot]: AttackType.Honeypot,
  [GraphQLApi.ProtectionAttackType.Impersonator]: AttackType.Impersonator,
  [GraphQLApi.ProtectionAttackType.AirdropPattern]: AttackType.Airdrop,
  [GraphQLApi.ProtectionAttackType.HighFees]: AttackType.HighFees,
}

const REST_ATTACK_TYPES: Partial<Record<RestAttackType, AttackType>> = {
  [RestAttackType.HONEYPOT]: AttackType.Honeypot,
  [RestAttackType.IMPERSONATOR]: AttackType.Impersonator,
  [RestAttackType.AIRDROP_PATTERN]: AttackType.Airdrop,
  [RestAttackType.HIGH_FEES]: AttackType.HighFees,
}

export function getCurrencySafetyInfo(
  safetyLevel?: GraphQLApi.SafetyLevel,
  protectionInfo?: Maybe<Pick<GraphQLApi.ProtectionInfo, 'result' | 'attackTypes' | 'blockaidFees'>>,
): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(fromGraphQLSafetyLevel(safetyLevel)),
    attackType: getHighestPriorityAttackType(
      (protectionInfo?.attackTypes ?? []).map((attackType) =>
        attackType ? (GRAPHQL_ATTACK_TYPES[attackType] ?? AttackType.Other) : AttackType.Other,
      ),
    ),
    protectionResult: fromGraphQLProtectionResult(protectionInfo?.result),
    blockaidFees: protectionInfo?.blockaidFees
      ? {
          buyFeePercent: protectionInfo.blockaidFees.buy ? protectionInfo.blockaidFees.buy * 100 : undefined,
          sellFeePercent: protectionInfo.blockaidFees.sell ? protectionInfo.blockaidFees.sell * 100 : undefined,
        }
      : undefined,
  }
}

/**
 * SafetyInfo from the data.v1 REST shape. `safetyLevel` is already the domain enum — callers map
 * the protobuf level through fromRestSafetyLevel / getRestTokenSafetyInfo first; `protectionInfo`
 * is the raw v1 protobuf message.
 */
export function getRestCurrencySafetyInfo(
  safetyLevel?: SafetyLevel,
  protectionInfo?: PlainMessage<ProtectionInfo>,
): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(safetyLevel),
    attackType: getHighestPriorityAttackType(
      (protectionInfo?.attackTypes ?? []).map((attackType) => REST_ATTACK_TYPES[attackType] ?? AttackType.Other),
    ),
    protectionResult: fromRestProtectionResult(protectionInfo?.result),
    blockaidFees: undefined,
  }
}

export function getRestTokenSafetyInfo(metadata?: Pick<TokenMetadata, 'spamCode' | 'safetyLevel'>): {
  isSpam: boolean
  spamCodeValue: SpamCode
  mappedSafetyLevel: SafetyLevel | undefined
} {
  let isSpam = false
  let spamCodeValue = SpamCode.LOW

  switch (metadata?.spamCode) {
    case RestSpamCode.SPAM:
    case RestSpamCode.SPAM_URL:
      isSpam = true
      spamCodeValue = SpamCode.HIGH
      break
    case RestSpamCode.NOT_SPAM:
      isSpam = false
      spamCodeValue = SpamCode.LOW
      break
    default:
      break
  }

  return { isSpam, spamCodeValue, mappedSafetyLevel: fromRestSafetyLevel(metadata?.safetyLevel) }
}

const V2_ATTACK_FEATURES: Partial<Record<AttackType, Set<string>>> = {
  [AttackType.Honeypot]: new Set(['HONEYPOT']),
  [AttackType.Impersonator]: new Set([
    'IMPERSONATOR',
    'IMPERSONATOR_HIGH_CONFIDENCE',
    'IMPERSONATOR_MEDIUM_CONFIDENCE',
    'IMPERSONATOR_LOW_CONFIDENCE',
    'IMPERSONATOR_SENSITIVE_ASSET',
  ]),
  [AttackType.Airdrop]: new Set(['AIRDROP_PATTERN']),
  [AttackType.HighFees]: new Set(['HIGH_TRANSFER_FEE', 'HIGH_BUY_FEE', 'HIGH_SELL_FEE']),
  [AttackType.ExitScamRisk]: new Set(['EXIT_SCAM_RISK']),
}

function getAttackTypeFromV2Safety(verdict?: string, features?: string[]): AttackType | undefined {
  const match = ATTACK_TYPE_PRIORITY.find((attackType) =>
    features?.some((feature) => V2_ATTACK_FEATURES[attackType]?.has(feature)),
  )
  if (match) {
    return match
  }
  if (verdict === 'Malicious' || verdict === 'Warning') {
    return AttackType.Other
  }
  return undefined
}

// V2 is the canonical data source going forward — its safety shape is flat booleans
// (isSpam/isVerified/isBlocked) plus `verdict`/`fees` rather than GraphQL's safetyLevel enum +
// protectionInfo. This mapping is temporary scaffolding for the current GraphQL/V2 dual-path: it
// adapts V2's shape into the still-GraphQL-shaped SafetyInfo type. Once GraphQL is fully retired,
// SafetyInfo itself should become V2-native and this direction should reverse — see follow-up
// ticket to migrate gqlTokenToCurrencyInfo onto it.
//
// See getRestCurrencySafetyInfoV2 for the ListTokens/search counterpart — it shares the same
// fromV2Verdict and features→attackType mapping.
export function getV2CurrencySafetyInfo(
  safety?: PlainMessage<TokenSafety>,
  fees?: PlainMessage<TokenFees>,
): SafetyInfo {
  const tokenList = safety?.isBlocked
    ? TokenList.Blocked
    : safety?.isVerified
      ? TokenList.Default
      : TokenList.NonDefault

  return {
    tokenList,
    attackType: getAttackTypeFromV2Safety(safety?.verdict, safety?.features),
    protectionResult: fromV2Verdict(safety?.verdict),
    // same fraction-of-1 convention as v1 ProtectionInfo.blockaidFees, converted to percent
    blockaidFees:
      fees?.buyFee !== undefined || fees?.sellFee !== undefined
        ? {
            buyFeePercent: fees.buyFee !== undefined ? fees.buyFee * 100 : undefined,
            sellFeePercent: fees.sellFee !== undefined ? fees.sellFee * 100 : undefined,
          }
        : undefined,
  }
}

/**
 * data.v2.TokenSafety {isSpam, isVerified, isBlocked} has less granularity than the v1
 * SafetyLevel enum this maps to — there's no MEDIUM_WARNING/STRONG_WARNING distinction in v2,
 * only a blocked/verified/neither tri-state. Revisit if BE adds a graded verdict.
 */
export function getRestTokenSafetyInfoV2(safety?: { isSpam: boolean; isVerified: boolean; isBlocked: boolean }): {
  isSpam: boolean
  mappedSafetyLevel: SafetyLevel | undefined
} {
  if (safety?.isBlocked) {
    return { isSpam: safety.isSpam, mappedSafetyLevel: SafetyLevel.Blocked }
  }
  if (safety?.isVerified) {
    return { isSpam: safety.isSpam, mappedSafetyLevel: SafetyLevel.Verified }
  }
  return { isSpam: safety?.isSpam ?? false, mappedSafetyLevel: undefined }
}

/**
 * v2 counterpart to getRestCurrencySafetyInfo, used for the ListTokens/search path. Shares
 * fromV2Verdict and getAttackTypeFromV2Safety with getV2CurrencySafetyInfo
 * (TokenRankings) since both consume the same data.v2.TokenSafety/TokenFees shape.
 */
export function getRestCurrencySafetyInfoV2(
  safety?: {
    isSpam: boolean
    isVerified: boolean
    isBlocked: boolean
    verdict?: string
    features?: string[]
  },
  fees?: { buyFee?: number; sellFee?: number },
): SafetyInfo {
  const { mappedSafetyLevel } = getRestTokenSafetyInfoV2(safety)
  return {
    tokenList: getTokenListFromSafetyLevel(mappedSafetyLevel),
    attackType: getAttackTypeFromV2Safety(safety?.verdict, safety?.features),
    protectionResult: fromV2Verdict(safety?.verdict),
    // same fraction-of-1 convention as v1 ProtectionInfo.blockaidFees, converted to percent
    blockaidFees:
      fees?.buyFee !== undefined || fees?.sellFee !== undefined
        ? {
            buyFeePercent: fees.buyFee !== undefined ? fees.buyFee * 100 : undefined,
            sellFeePercent: fees.sellFee !== undefined ? fees.sellFee * 100 : undefined,
          }
        : undefined,
  }
}

/**
 * SafetyInfo from the string-shaped safety/protection fields served by the search/explore v1
 * REST endpoints (which proxy GraphQL, so values are serialized GraphQL enums — capitalized
 * `result`/`attackTypes` that uppercase onto the domain). Replaces the deleted
 * `parseSafetyLevel`/`parseProtectionInfo` pair from `@universe/api`.
 */
export function parseCurrencySafetyInfo(
  safetyLevel?: string,
  protectionInfo?: { result: string; attackTypes: string[] },
): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(parseSafetyLevel(safetyLevel)),
    attackType: getHighestPriorityAttackType(parseAttackTypes(protectionInfo?.attackTypes)),
    protectionResult: parseProtectionResult(protectionInfo?.result),
    // The search/explore v1 protection payload carries only result/attackTypes — no fee data
    // exists on this path (the deleted parseProtectionInfo returned the same two fields).
    blockaidFees: undefined,
  }
}
