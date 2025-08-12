import {
  ProtectionInfo,
  AttackType as RestAttackType,
  ProtectionResult as RestProtectionResult,
  SafetyLevel as RestSafetyLevel,
  SpamCode as RestSpamCode,
  TokenMetadata,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  ProtectionAttackType,
  ProtectionResult,
  SafetyLevel,
  TokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SpamCode } from 'uniswap/src/data/types'
import { AttackType, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'

function getTokenListFromSafetyLevel(safetyInfo?: SafetyLevel): TokenList {
  switch (safetyInfo) {
    case SafetyLevel.Blocked:
      return TokenList.Blocked
    case SafetyLevel.Verified:
      return TokenList.Default
    default:
      return TokenList.NonDefault
  }
}

// Priority based on Token Protection PRD spec
function getHighestPriorityAttackType(attackTypes?: (ProtectionAttackType | undefined)[]): AttackType | undefined {
  if (!attackTypes || attackTypes.length === 0) {
    return undefined
  }
  const attackTypeSet = new Set(attackTypes)
  if (attackTypeSet.has(ProtectionAttackType.Honeypot)) {
    return AttackType.Honeypot
  } else if (attackTypeSet.has(ProtectionAttackType.Impersonator)) {
    return AttackType.Impersonator
  } else if (attackTypeSet.has(ProtectionAttackType.AirdropPattern)) {
    return AttackType.Airdrop
  } else if (attackTypeSet.has(ProtectionAttackType.HighFees)) {
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
  safetyLevel?: SafetyLevel,
  protectionInfo?: NonNullable<TokenQuery['token']>['protectionInfo'],
): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(safetyLevel),
    attackType: getHighestPriorityAttackType(protectionInfo?.attackTypes),
    protectionResult: protectionInfo?.result ?? ProtectionResult.Unknown,
    blockaidFees: protectionInfo?.blockaidFees
      ? {
          buyFeePercent: protectionInfo.blockaidFees.buy ? protectionInfo.blockaidFees.buy * 100 : undefined,
          sellFeePercent: protectionInfo.blockaidFees.sell ? protectionInfo.blockaidFees.sell * 100 : undefined,
        }
      : undefined,
  }
}

export function mapRestProtectionResultToProtectionResult(result?: RestProtectionResult): ProtectionResult {
  switch (result) {
    case RestProtectionResult.MALICIOUS:
      return ProtectionResult.Malicious
    case RestProtectionResult.SPAM:
      return ProtectionResult.Spam
    case RestProtectionResult.BENIGN:
      return ProtectionResult.Benign
    default:
      return ProtectionResult.Unknown
  }
}

export function getRestCurrencySafetyInfo(safetyLevel?: SafetyLevel, protectionInfo?: ProtectionInfo): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(safetyLevel),
    attackType: getHighestPriorityRestAttackType(protectionInfo?.attackTypes),
    protectionResult: mapRestProtectionResultToProtectionResult(protectionInfo?.result),
    blockaidFees: undefined,
  }
}

export function getRestTokenSafetyInfo(metadata?: TokenMetadata): {
  isSpam: boolean
  spamCodeValue: SpamCode
  mappedSafetyLevel: SafetyLevel | undefined
} {
  let isSpam = false
  let spamCodeValue = SpamCode.LOW
  let mappedSafetyLevel: SafetyLevel | undefined

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
      mappedSafetyLevel = SafetyLevel.Verified
      break
    case RestSafetyLevel.MEDIUM_WARNING:
      mappedSafetyLevel = SafetyLevel.MediumWarning
      break
    case RestSafetyLevel.STRONG_WARNING:
      mappedSafetyLevel = SafetyLevel.StrongWarning
      break
    case RestSafetyLevel.BLOCKED:
      mappedSafetyLevel = SafetyLevel.Blocked
      break
    default:
      break
  }

  return { isSpam, spamCodeValue, mappedSafetyLevel }
}
