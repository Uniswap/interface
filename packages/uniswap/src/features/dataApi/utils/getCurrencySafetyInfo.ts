import { type PlainMessage } from '@bufbuild/protobuf'
import {
  ProtectionInfo,
  AttackType as RestAttackType,
  ProtectionResult as RestProtectionResult,
  SafetyLevel as RestSafetyLevel,
  SpamCode as RestSpamCode,
  TokenMetadata,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { type TokenFees, type TokenSafety } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi, SpamCode } from '@universe/api'
import { AttackType, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'

// TokenFees.{buy_fee,sell_fee} are fraction-of-1 doubles (e.g. 0.05 === 5%) per the v2 proto.
// buildCurrency's buyFeeBps/sellFeeBps params want basis points as a string.
export function fractionToBpsString(fraction?: number): string | undefined {
  return fraction !== undefined ? String(Math.round(fraction * 10_000)) : undefined
}

function getTokenListFromSafetyLevel(safetyInfo?: GraphQLApi.SafetyLevel): TokenList {
  switch (safetyInfo) {
    case GraphQLApi.SafetyLevel.Blocked:
      return TokenList.Blocked
    case GraphQLApi.SafetyLevel.Verified:
      return TokenList.Default
    default:
      return TokenList.NonDefault
  }
}

// Priority based on Token Protection PRD spec
function getHighestPriorityAttackType(
  attackTypes?: (GraphQLApi.ProtectionAttackType | undefined)[],
): AttackType | undefined {
  if (!attackTypes || attackTypes.length === 0) {
    return undefined
  }
  const attackTypeSet = new Set(attackTypes)
  if (attackTypeSet.has(GraphQLApi.ProtectionAttackType.Honeypot)) {
    return AttackType.Honeypot
  } else if (attackTypeSet.has(GraphQLApi.ProtectionAttackType.Impersonator)) {
    return AttackType.Impersonator
  } else if (attackTypeSet.has(GraphQLApi.ProtectionAttackType.AirdropPattern)) {
    return AttackType.Airdrop
  } else if (attackTypeSet.has(GraphQLApi.ProtectionAttackType.HighFees)) {
    return AttackType.HighFees
  } else {
    return AttackType.Other
  }
}

// Priority based on Token Protection PRD spec for REST API
function getHighestPriorityRestAttackType(attackTypes?: RestAttackType[]): AttackType | undefined {
  if (!attackTypes || attackTypes.length === 0) {
    return undefined
  }
  if (attackTypes.includes(RestAttackType.HONEYPOT)) {
    return AttackType.Honeypot
  } else if (attackTypes.includes(RestAttackType.IMPERSONATOR)) {
    return AttackType.Impersonator
  } else if (attackTypes.includes(RestAttackType.AIRDROP_PATTERN)) {
    return AttackType.Airdrop
  } else if (attackTypes.includes(RestAttackType.HIGH_FEES)) {
    return AttackType.HighFees
  } else {
    return AttackType.Other
  }
}

export function getCurrencySafetyInfo(
  safetyLevel?: GraphQLApi.SafetyLevel,
  protectionInfo?: NonNullable<GraphQLApi.TokenQuery['token']>['protectionInfo'],
): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(safetyLevel),
    attackType: getHighestPriorityAttackType(protectionInfo?.attackTypes),
    protectionResult: protectionInfo?.result ?? GraphQLApi.ProtectionResult.Unknown,
    blockaidFees: protectionInfo?.blockaidFees
      ? {
          buyFeePercent: protectionInfo.blockaidFees.buy ? protectionInfo.blockaidFees.buy * 100 : undefined,
          sellFeePercent: protectionInfo.blockaidFees.sell ? protectionInfo.blockaidFees.sell * 100 : undefined,
        }
      : undefined,
  }
}

export function mapRestProtectionResultToProtectionResult(result?: RestProtectionResult): GraphQLApi.ProtectionResult {
  switch (result) {
    case RestProtectionResult.MALICIOUS:
      return GraphQLApi.ProtectionResult.Malicious
    case RestProtectionResult.SPAM:
      return GraphQLApi.ProtectionResult.Spam
    case RestProtectionResult.BENIGN:
      return GraphQLApi.ProtectionResult.Benign
    default:
      return GraphQLApi.ProtectionResult.Unknown
  }
}

export function getRestCurrencySafetyInfo(
  safetyLevel?: GraphQLApi.SafetyLevel,
  protectionInfo?: PlainMessage<ProtectionInfo>,
): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(safetyLevel),
    attackType: getHighestPriorityRestAttackType(protectionInfo?.attackTypes),
    protectionResult: mapRestProtectionResultToProtectionResult(protectionInfo?.result),
    blockaidFees: undefined,
  }
}

export function getRestTokenSafetyInfo(metadata?: Pick<TokenMetadata, 'spamCode' | 'safetyLevel'>): {
  isSpam: boolean
  spamCodeValue: SpamCode
  mappedSafetyLevel: GraphQLApi.SafetyLevel | undefined
} {
  let isSpam = false
  let spamCodeValue = SpamCode.LOW
  let mappedSafetyLevel: GraphQLApi.SafetyLevel | undefined

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

  switch (metadata?.safetyLevel) {
    case RestSafetyLevel.VERIFIED:
      mappedSafetyLevel = GraphQLApi.SafetyLevel.Verified
      break
    case RestSafetyLevel.MEDIUM_WARNING:
      mappedSafetyLevel = GraphQLApi.SafetyLevel.MediumWarning
      break
    case RestSafetyLevel.STRONG_WARNING:
      mappedSafetyLevel = GraphQLApi.SafetyLevel.StrongWarning
      break
    case RestSafetyLevel.BLOCKED:
      mappedSafetyLevel = GraphQLApi.SafetyLevel.Blocked
      break
    default:
      break
  }

  return { isSpam, spamCodeValue, mappedSafetyLevel }
}

function mapV2VerdictToProtectionResult(verdict?: string): GraphQLApi.ProtectionResult {
  switch (verdict) {
    case 'Benign':
      return GraphQLApi.ProtectionResult.Benign
    case 'Malicious':
      return GraphQLApi.ProtectionResult.Malicious
    case 'Spam':
      return GraphQLApi.ProtectionResult.Spam
    case 'Warning':
      return GraphQLApi.ProtectionResult.Warning
    default:
      return GraphQLApi.ProtectionResult.Unknown
  }
}

const HONEYPOT_FEATURES = new Set(['HONEYPOT'])
const IMPERSONATOR_FEATURES = new Set([
  'IMPERSONATOR',
  'IMPERSONATOR_HIGH_CONFIDENCE',
  'IMPERSONATOR_MEDIUM_CONFIDENCE',
  'IMPERSONATOR_LOW_CONFIDENCE',
  'IMPERSONATOR_SENSITIVE_ASSET',
])
const AIRDROP_FEATURES = new Set(['AIRDROP_PATTERN'])
const HIGH_FEES_FEATURES = new Set(['HIGH_TRANSFER_FEE', 'HIGH_BUY_FEE', 'HIGH_SELL_FEE'])

function getAttackTypeFromV2Safety(verdict?: string, features?: string[]): AttackType | undefined {
  if (features?.some((feature) => HONEYPOT_FEATURES.has(feature))) {
    return AttackType.Honeypot
  }
  if (features?.some((feature) => IMPERSONATOR_FEATURES.has(feature))) {
    return AttackType.Impersonator
  }
  if (features?.some((feature) => AIRDROP_FEATURES.has(feature))) {
    return AttackType.Airdrop
  }
  if (features?.some((feature) => HIGH_FEES_FEATURES.has(feature))) {
    return AttackType.HighFees
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
// See getRestCurrencySafetyInfoV2 for the ListTokens/search counterpart — it shares this same
// verdict→protectionResult and features→attackType mapping.
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
    protectionResult: mapV2VerdictToProtectionResult(safety?.verdict),
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
  mappedSafetyLevel: GraphQLApi.SafetyLevel | undefined
} {
  if (safety?.isBlocked) {
    return { isSpam: safety.isSpam, mappedSafetyLevel: GraphQLApi.SafetyLevel.Blocked }
  }
  if (safety?.isVerified) {
    return { isSpam: safety.isSpam, mappedSafetyLevel: GraphQLApi.SafetyLevel.Verified }
  }
  return { isSpam: safety?.isSpam ?? false, mappedSafetyLevel: undefined }
}

/**
 * v2 counterpart to getRestCurrencySafetyInfo, used for the ListTokens/search path. Shares
 * mapV2VerdictToProtectionResult and getAttackTypeFromV2Safety with getV2CurrencySafetyInfo
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
    protectionResult: mapV2VerdictToProtectionResult(safety?.verdict),
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
