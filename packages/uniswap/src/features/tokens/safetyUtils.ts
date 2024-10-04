import { Currency, NativeCurrency } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AttackType, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

// only used for design treatment theming for the TokenWarningModal
export enum TokenWarningDesignTreatment {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Blocked = 4,
}

enum TokenProtectionWarning {
  MaliciousHoneypot = 'malicious-honeypot', // 100% fot
  MaliciousImpersonator = 'malicious-impersonator',
  SpamAirdrop = 'spam-airdrop',
  MaliciousGeneral = 'malicious-general',
  FotVeryHigh = 'fot-very-high', // [80, 100)% fot
  FotHigh = 'fot-high', // [5, 80)% fot
  FotLow = 'fot-low', // (0, 5)% fot
  None = 'none',
}

function getFeeOnTransfer(currency: Currency): number {
  if (currency.isNative) {
    return 0
  }
  const sellFeeBps = currency.sellFeeBps?.toNumber() ?? 0
  const buyFeeBps = currency.buyFeeBps?.toNumber() ?? 0
  return Math.max(sellFeeBps, buyFeeBps) / 100
}

function getTokenProtectionWarning(
  currency?: Currency,
  safetyInfo?: Maybe<SafetyInfo>,
): TokenProtectionWarning | undefined {
  if (!currency || !safetyInfo) {
    return undefined
  }

  const { protectionResult, attackType } = safetyInfo
  if (currency instanceof NativeCurrency) {
    return TokenProtectionWarning.None
  }

  const feeOnTransfer = getFeeOnTransfer(currency)

  // prioritize high > medium > low warning levels
  if (feeOnTransfer === 100) {
    return TokenProtectionWarning.MaliciousHoneypot
  } else if (
    feeOnTransfer >= 80 ||
    ((protectionResult === ProtectionResult.Malicious || protectionResult === ProtectionResult.Spam) &&
      attackType === AttackType.HighFees)
  ) {
    return TokenProtectionWarning.FotVeryHigh
  } else if (feeOnTransfer >= 5) {
    return TokenProtectionWarning.FotHigh
  } else if (
    (protectionResult === ProtectionResult.Malicious || protectionResult === ProtectionResult.Spam) &&
    attackType === AttackType.Impersonator
  ) {
    return TokenProtectionWarning.MaliciousImpersonator
  } else if (
    (protectionResult === ProtectionResult.Malicious || protectionResult === ProtectionResult.Spam) &&
    attackType === AttackType.Other
  ) {
    return TokenProtectionWarning.MaliciousGeneral
  } else if (protectionResult === ProtectionResult.Spam && attackType === AttackType.Airdrop) {
    return TokenProtectionWarning.SpamAirdrop
  } else if (feeOnTransfer > 0 && feeOnTransfer < 5) {
    return TokenProtectionWarning.FotLow
  }

  return TokenProtectionWarning.None
}

export function getIsFeeRelatedWarning(currency?: Currency, safetyInfo?: Maybe<SafetyInfo>): boolean {
  const warning = getTokenProtectionWarning(currency, safetyInfo)
  return (
    warning === TokenProtectionWarning.MaliciousHoneypot ||
    warning === TokenProtectionWarning.FotVeryHigh ||
    warning === TokenProtectionWarning.FotHigh ||
    warning === TokenProtectionWarning.FotLow
  )
}

export function getTokenWarningDesignTreatment(
  currency?: Currency,
  safetyInfo?: Maybe<SafetyInfo>,
): TokenWarningDesignTreatment | undefined {
  const tokenProtectionWarning = getTokenProtectionWarning(currency, safetyInfo)
  if (!currency || !safetyInfo || tokenProtectionWarning === undefined) {
    return undefined
  }

  const tokenList = safetyInfo.tokenList

  if (tokenList === TokenList.Blocked) {
    return TokenWarningDesignTreatment.Blocked
  }

  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.MaliciousHoneypot:
    case TokenProtectionWarning.MaliciousImpersonator:
    case TokenProtectionWarning.MaliciousGeneral:
    case TokenProtectionWarning.FotVeryHigh:
    case TokenProtectionWarning.FotHigh:
      return TokenWarningDesignTreatment.High
    case TokenProtectionWarning.SpamAirdrop:
    case TokenProtectionWarning.FotLow:
      return TokenWarningDesignTreatment.Medium
    case TokenProtectionWarning.None:
      if (tokenList === TokenList.NonDefault) {
        return TokenWarningDesignTreatment.Low
      }
      return TokenWarningDesignTreatment.None
  }
}

// Only combine into one plural-languaged modal if there are two tokens prefilled at the same time, and BOTH are low or BOTH are blocked
// i.e. interface PDP, or interface prefilled via URL `?inputCurrency=0x...&outputCurrency=0x...`
export function getShouldHavePluralTreatment(
  currency0: Currency,
  safetyInfo0?: Maybe<SafetyInfo>,
  currency1?: Currency,
  safetyInfo1?: Maybe<SafetyInfo>,
): boolean {
  const designTreatment0 = getTokenWarningDesignTreatment(currency0, safetyInfo0)
  const designTreatment1 = getTokenWarningDesignTreatment(currency1, safetyInfo1)
  const pluralLowWarnings =
    currency1 &&
    designTreatment0 === TokenWarningDesignTreatment.Low &&
    designTreatment1 === TokenWarningDesignTreatment.Low
  const pluralBlockedWarnings =
    currency1 &&
    designTreatment0 === TokenWarningDesignTreatment.Blocked &&
    designTreatment1 === TokenWarningDesignTreatment.Blocked
  const plural = pluralLowWarnings || pluralBlockedWarnings
  return plural ?? false
}

export function useModalHeaderText(
  currency0: Currency,
  safetyInfo0?: Maybe<SafetyInfo>,
  currency1?: Currency,
  safetyInfo1?: Maybe<SafetyInfo>,
): string | null {
  const shouldHavePluralTreatment = getShouldHavePluralTreatment(currency0, safetyInfo0, currency1, safetyInfo1)
  if (!shouldHavePluralTreatment && (currency1 || safetyInfo1)) {
    throw new Error('Should only combine into one plural-languaged modal if BOTH are low or BOTH are blocked')
  }

  const { t } = useTranslation()
  const tokenProtectionWarning = getTokenProtectionWarning(currency0, safetyInfo0)
  const tokenList = safetyInfo0?.tokenList

  if (!tokenProtectionWarning) {
    return null
  }

  if (tokenList === TokenList.Blocked) {
    return shouldHavePluralTreatment
      ? t('token.safety.blocked.title.tokensNotAvailable', {
          tokenSymbol0: currency0.symbol,
          tokenSymbol1: currency1?.symbol,
        })
      : t('token.safety.blocked.title.tokenNotAvailable', { tokenSymbol: currency0.symbol })
  }
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.MaliciousHoneypot:
      return t('token.safety.warning.honeypot.title')
    case TokenProtectionWarning.MaliciousImpersonator:
    case TokenProtectionWarning.MaliciousGeneral:
    case TokenProtectionWarning.FotVeryHigh:
      return t('token.safety.warning.malicious.title')
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.title')
    case TokenProtectionWarning.FotHigh:
      return t('token.safety.warning.tokenChargesHighFee.title', { tokenSymbol: currency0.symbol })
    case TokenProtectionWarning.FotLow:
      return t('token.safety.warning.tokenChargesFee.title', { tokenSymbol: currency0.symbol })
    case TokenProtectionWarning.None:
      if (tokenList === TokenList.NonDefault) {
        return t('token.safety.warning.alwaysDoYourResearch')
      }
      return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCardHeaderText(currency: Currency, safetyInfo?: Maybe<SafetyInfo>): string | null {
  const { t } = useTranslation()
  const tokenProtectionWarning = getTokenProtectionWarning(currency, safetyInfo)
  const tokenList = safetyInfo?.tokenList

  if (!tokenProtectionWarning) {
    return null
  }

  if (tokenList === TokenList.Blocked) {
    return t('token.safety.warning.notAvailableToTrade')
  }
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.MaliciousHoneypot:
      return t('token.safety.warning.honeypot.title')
    case TokenProtectionWarning.MaliciousImpersonator:
    case TokenProtectionWarning.MaliciousGeneral:
    case TokenProtectionWarning.FotVeryHigh:
      return t('token.safety.warning.malicious.title')
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.title')
    case TokenProtectionWarning.FotHigh:
      return t('token.safety.warning.highFeeDetected.title')
    case TokenProtectionWarning.FotLow:
      return t('token.safety.warning.feeDetected.title')
    case TokenProtectionWarning.None:
      if (tokenList === TokenList.NonDefault) {
        return t('token.safety.warning.medium.heading.default_one')
      }
      return null
  }
}

export function useModalSubtitleText(
  currency0: Currency,
  safetyInfo0?: Maybe<SafetyInfo>,
  currency1?: Currency,
  safetyInfo1?: Maybe<SafetyInfo>,
): string | null {
  const shouldHavePluralTreatment = getShouldHavePluralTreatment(currency0, safetyInfo0, currency1, safetyInfo1)
  if (!shouldHavePluralTreatment && (currency1 || safetyInfo1)) {
    throw new Error('Should only combine into one plural-languaged modal if BOTH are low or BOTH are blocked')
  }
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const tokenProtectionWarning = getTokenProtectionWarning(currency0, safetyInfo0)
  const tokenList = safetyInfo0?.tokenList

  if (!tokenProtectionWarning) {
    return null
  }

  if (tokenList === TokenList.Blocked) {
    return t('token.safety.warning.notAvailableToTrade') + '.'
  }

  const feePercent: string = formatNumberOrString({
    value: getFeeOnTransfer(currency0) / 100,
    type: NumberType.Percentage,
  })

  const warningCopy = ((): string | null => {
    switch (tokenProtectionWarning) {
      case TokenProtectionWarning.MaliciousHoneypot:
        return t('token.safety.warning.honeypot.message', { tokenSymbol: currency0.symbol })
      case TokenProtectionWarning.MaliciousImpersonator:
        return (
          t('token.safety.warning.malicious.impersonator.message', { tokenSymbol: currency0.symbol }) +
          ' ' +
          t('token.safety.warning.doYourOwnResearch')
        )
      case TokenProtectionWarning.SpamAirdrop:
        return (
          t('token.safety.warning.spam.message', { tokenSymbol: currency0.symbol }) +
          ' ' +
          t('token.safety.warning.doYourOwnResearch')
        )
      case TokenProtectionWarning.MaliciousGeneral:
        return (
          t('token.safety.warning.malicious.general.message', { tokenSymbol: currency0.symbol }) +
          ' ' +
          t('token.safety.warning.doYourOwnResearch')
        )
      case TokenProtectionWarning.FotVeryHigh:
      case TokenProtectionWarning.FotHigh:
        return (
          t('token.safety.warning.tokenChargesFee.percent.message', { tokenSymbol: currency0.symbol, feePercent }) +
          ' ' +
          t('token.safety.fees.uniswapLabsDoesNotReceive')
        )
      case TokenProtectionWarning.FotLow:
        return (
          t('token.safety.warning.tokenChargesFee.message', { tokenSymbol: currency0.symbol }) +
          ' ' +
          t('token.safety.fees.uniswapLabsDoesNotReceive')
        )
      case TokenProtectionWarning.None:
        if (tokenList === TokenList.NonDefault) {
          if (shouldHavePluralTreatment) {
            return t('token.safetyLevel.medium.message.plural')
          }
          return t('token.safetyLevel.medium.message')
        }
        return null
    }
  })()

  if (tokenProtectionWarning !== TokenProtectionWarning.None && tokenList === TokenList.NonDefault && warningCopy) {
    return (
      warningCopy +
      ' ' +
      (shouldHavePluralTreatment
        ? "These tokens also aren't traded on leading U.S. centralized exchanges."
        : "This token also isn't traded on leading U.S. centralized exchanges.")
    )
  }
  return warningCopy
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useCardSubtitleText(currency: Currency, safetyInfo?: Maybe<SafetyInfo>): string | null {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const tokenProtectionWarning = getTokenProtectionWarning(currency, safetyInfo)
  const tokenList = safetyInfo?.tokenList

  if (!tokenProtectionWarning) {
    return null
  }

  if (tokenList === TokenList.Blocked) {
    return t('token.safety.warning.notAvailableToTrade')
  }
  const feePercent: string = formatNumberOrString({
    value: getFeeOnTransfer(currency) / 100,
    type: NumberType.Percentage,
  })

  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.MaliciousHoneypot:
    case TokenProtectionWarning.MaliciousGeneral:
      return t('token.safety.warning.malicious.general.message', { tokenSymbol: currency.symbol })
    case TokenProtectionWarning.MaliciousImpersonator:
      return t('token.safety.warning.malicious.impersonator.message.short', { tokenSymbol: currency.symbol })
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.message', { tokenSymbol: currency.symbol })
    case TokenProtectionWarning.FotVeryHigh:
    case TokenProtectionWarning.FotHigh:
      return t('token.safety.warning.tokenChargesFee.percent.message', { tokenSymbol: currency.symbol, feePercent })
    case TokenProtectionWarning.FotLow:
      return t('token.safety.warning.tokenChargesFee.message')
    case TokenProtectionWarning.None:
      return null
  }
}
