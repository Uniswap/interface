// Dependency-free on purpose: the token-protection derivation without this package's UI,
// i18n or @universe/api (Apollo) barrels, so apps that can't take those can share it.
// tokenProtection.test.ts fails if an import here starts pulling one in.
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/warningSeverity'
import { AttackType, ProtectionResult, TokenList } from 'uniswap/src/features/dataApi/safetyEnums'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'

export const TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT = 100
export const TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT = 80
export const TOKEN_PROTECTION_FOT_FEE_BREAKPOINT = 15

// Attack-type display priority per the Token Protection PRD spec — the single ordered source
// every attack-type mapper selects from. ExitScamRisk is Blockaid's lowest-confidence bucket, so
// any more specific signal outranks it.
export const ATTACK_TYPE_PRIORITY: AttackType[] = [
  AttackType.Honeypot,
  AttackType.Impersonator,
  AttackType.Airdrop,
  AttackType.HighFees,
  AttackType.ExitScamRisk,
]

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

/**
 * data.v2 verdict string → domain. `onUnrecognized` sees any non-empty verdict outside the
 * four known ones, so callers can report schema drift instead of silently degrading (a
 * malicious verdict falling to Unknown).
 */
export function fromV2Verdict(
  verdict: string | undefined,
  onUnrecognized?: (verdict: string) => void,
): ProtectionResult {
  switch (verdict) {
    case 'Benign':
      return ProtectionResult.Benign
    case 'Malicious':
      return ProtectionResult.Malicious
    case 'Spam':
      return ProtectionResult.Spam
    case 'Warning':
      return ProtectionResult.Warning
    default:
      if (verdict) {
        onUnrecognized?.(verdict)
      }
      return ProtectionResult.Unknown
  }
}

/** data.v2 verdict + Blockaid features → the highest-priority attack type, if any. */
export function getAttackTypeFromV2Safety(verdict?: string, features?: string[]): AttackType | undefined {
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

/** What the warning reads, already mapped into the domain vocabulary. */
export interface TokenProtectionInput {
  tokenList: TokenList
  protectionResult?: ProtectionResult
  attackType?: AttackType
  /** The higher of the buy/sell fee-on-transfer percents (5.1 = 5.1%), when known. */
  maxFeePercent?: number
}

/** The warning for a non-native token whose safety data is known. */
export function deriveTokenProtectionWarning({
  tokenList,
  protectionResult,
  attackType,
  maxFeePercent: feeOnTransfer,
}: TokenProtectionInput): TokenProtectionWarning {
  // prioritize high > medium > low warning levels
  if (tokenList === TokenList.Blocked) {
    return TokenProtectionWarning.Blocked
  } else if (feeOnTransfer === TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT) {
    return TokenProtectionWarning.MaliciousHoneypot
  } else if (
    (feeOnTransfer && feeOnTransfer >= TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT) ||
    ((protectionResult === ProtectionResult.Malicious || protectionResult === ProtectionResult.Spam) &&
      attackType === AttackType.HighFees)
  ) {
    return TokenProtectionWarning.FotVeryHigh
  } else if (
    (protectionResult === ProtectionResult.Malicious || protectionResult === ProtectionResult.Spam) &&
    attackType === AttackType.Impersonator
  ) {
    return TokenProtectionWarning.MaliciousImpersonator
  } else if (feeOnTransfer && feeOnTransfer >= TOKEN_PROTECTION_FOT_FEE_BREAKPOINT) {
    return TokenProtectionWarning.FotHigh
  } else if (protectionResult === ProtectionResult.Malicious) {
    return TokenProtectionWarning.MaliciousGeneral
  } else if (attackType === AttackType.Honeypot) {
    return TokenProtectionWarning.PotentialHoneypot
  } else if (attackType === AttackType.ExitScamRisk) {
    return TokenProtectionWarning.ExitScamRisk
  } else if (protectionResult === ProtectionResult.Spam && attackType === AttackType.Airdrop) {
    return TokenProtectionWarning.SpamAirdrop
  } else if (feeOnTransfer && feeOnTransfer > 0 && feeOnTransfer < TOKEN_PROTECTION_FOT_FEE_BREAKPOINT) {
    return TokenProtectionWarning.FotLow
  } else if (tokenList === TokenList.NonDefault) {
    return TokenProtectionWarning.NonDefault
  }

  return TokenProtectionWarning.None
}

export function getIsFeeRelatedWarning(tokenProtectionWarning?: TokenProtectionWarning): boolean {
  return (
    tokenProtectionWarning === TokenProtectionWarning.MaliciousHoneypot ||
    tokenProtectionWarning === TokenProtectionWarning.FotVeryHigh ||
    tokenProtectionWarning === TokenProtectionWarning.FotHigh ||
    tokenProtectionWarning === TokenProtectionWarning.FotLow
  )
}

export function getFeeWarning(feePercent: number): TokenProtectionWarning {
  // WarningSeverity for styling. Same logic as getTokenWarningSeverity but without non-fee-related cases.
  // If fee >= 5% then HIGH, else 0% < fee < 5% then MEDIUM, else NONE
  let tokenProtectionWarning = TokenProtectionWarning.None
  if (feePercent >= TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT) {
    tokenProtectionWarning = TokenProtectionWarning.MaliciousHoneypot
  } else if (feePercent >= TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT) {
    tokenProtectionWarning = TokenProtectionWarning.FotVeryHigh
  } else if (feePercent >= TOKEN_PROTECTION_FOT_FEE_BREAKPOINT) {
    tokenProtectionWarning = TokenProtectionWarning.FotHigh
  } else if (feePercent > 0) {
    tokenProtectionWarning = TokenProtectionWarning.FotLow
  }
  return tokenProtectionWarning
}

const SEVERITY_BY_WARNING: Record<TokenProtectionWarning, WarningSeverity> = {
  [TokenProtectionWarning.Blocked]: WarningSeverity.Blocked,
  [TokenProtectionWarning.MaliciousHoneypot]: WarningSeverity.High,
  [TokenProtectionWarning.MaliciousImpersonator]: WarningSeverity.High,
  [TokenProtectionWarning.MaliciousGeneral]: WarningSeverity.High,
  [TokenProtectionWarning.FotVeryHigh]: WarningSeverity.High,
  [TokenProtectionWarning.FotHigh]: WarningSeverity.High,
  [TokenProtectionWarning.PotentialHoneypot]: WarningSeverity.Medium,
  [TokenProtectionWarning.ExitScamRisk]: WarningSeverity.Medium,
  [TokenProtectionWarning.SpamAirdrop]: WarningSeverity.Medium,
  [TokenProtectionWarning.FotLow]: WarningSeverity.Medium,
  [TokenProtectionWarning.NonDefault]: WarningSeverity.Low,
  [TokenProtectionWarning.None]: WarningSeverity.None,
}

export function getSeverityFromTokenProtectionWarning(tokenProtectionWarning: TokenProtectionWarning): WarningSeverity {
  return SEVERITY_BY_WARNING[tokenProtectionWarning]
}

// Which warnings the "don't show again" checkbox may silence. Not a severity tier: MaliciousHoneypot
// (high) is dismissible while PotentialHoneypot (medium) is not.
const WARNINGS_ALLOWING_DISMISSAL: TokenProtectionWarning[] = [
  TokenProtectionWarning.NonDefault,
  TokenProtectionWarning.FotLow,
  TokenProtectionWarning.FotHigh,
  TokenProtectionWarning.SpamAirdrop,
  TokenProtectionWarning.MaliciousImpersonator,
  TokenProtectionWarning.MaliciousHoneypot,
] as const

export function allowsDismissWarning(tokenProtectionWarning: TokenProtectionWarning): boolean {
  return WARNINGS_ALLOWING_DISMISSAL.includes(tokenProtectionWarning)
}
