/* eslint-disable consistent-return */
import { Currency, NativeCurrency } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AttackType, CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { NumberType } from 'utilities/src/format/types'
import { isInterface } from 'utilities/src/platform'

export enum TokenProtectionWarning {
  MaliciousHoneypot = 'malicious-honeypot', // 100% fot
  MaliciousImpersonator = 'malicious-impersonator',
  SpamAirdrop = 'spam-airdrop',
  MaliciousGeneral = 'malicious-general',
  FotVeryHigh = 'fot-very-high', // [80, 100)% fot
  FotHigh = 'fot-high', // [5, 80)% fot
  FotLow = 'fot-low', // (0, 5)% fot
  Blocked = 'blocked',
  NonDefault = 'non-default',
  None = 'none',
}

export const TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT = 100
export const TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT = 80
export const TOKEN_PROTECTION_FOT_FEE_BREAKPOINT = 5

function getFeeOnTransfer(currency?: Currency): number {
  if (!currency || currency.isNative) {
    return 0
  }
  const sellFeeBps = currency.sellFeeBps?.toNumber() ?? 0
  const buyFeeBps = currency.buyFeeBps?.toNumber() ?? 0
  return Math.max(sellFeeBps, buyFeeBps) / 100
}

// eslint-disable-next-line complexity
function getTokenProtectionWarning(currencyInfo?: Maybe<CurrencyInfo>): TokenProtectionWarning | undefined {
  if (!currencyInfo?.currency || !currencyInfo?.safetyInfo) {
    return undefined
  }
  const { currency, safetyInfo } = currencyInfo

  const { protectionResult, attackType } = safetyInfo
  if (currency instanceof NativeCurrency) {
    return TokenProtectionWarning.None
  }

  const feeOnTransfer = getFeeOnTransfer(currency)

  // prioritize high > medium > low warning levels
  if (safetyInfo.tokenList === TokenList.Blocked) {
    return TokenProtectionWarning.Blocked
  } else if (feeOnTransfer === TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT) {
    return TokenProtectionWarning.MaliciousHoneypot
  } else if (
    feeOnTransfer >= TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT ||
    ((protectionResult === ProtectionResult.Malicious || protectionResult === ProtectionResult.Spam) &&
      attackType === AttackType.HighFees)
  ) {
    return TokenProtectionWarning.FotVeryHigh
  } else if (feeOnTransfer >= TOKEN_PROTECTION_FOT_FEE_BREAKPOINT) {
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
  } else if (feeOnTransfer > 0 && feeOnTransfer < TOKEN_PROTECTION_FOT_FEE_BREAKPOINT) {
    return TokenProtectionWarning.FotLow
  } else if (safetyInfo.tokenList === TokenList.NonDefault) {
    return TokenProtectionWarning.NonDefault
  }

  return TokenProtectionWarning.None
}

export function getIsFeeRelatedWarning(currencyInfo?: CurrencyInfo): boolean {
  const warning = getTokenProtectionWarning(currencyInfo)
  return (
    warning === TokenProtectionWarning.MaliciousHoneypot ||
    warning === TokenProtectionWarning.FotVeryHigh ||
    warning === TokenProtectionWarning.FotHigh ||
    warning === TokenProtectionWarning.FotLow
  )
}

export function getTokenWarningSeverity(currencyInfo: Maybe<CurrencyInfo>): WarningSeverity | undefined {
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo)
  if (!currencyInfo || tokenProtectionWarning === undefined) {
    return undefined
  }

  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return WarningSeverity.Blocked
    case TokenProtectionWarning.MaliciousHoneypot:
    case TokenProtectionWarning.MaliciousImpersonator:
    case TokenProtectionWarning.MaliciousGeneral:
    case TokenProtectionWarning.FotVeryHigh:
    case TokenProtectionWarning.FotHigh:
      return WarningSeverity.High
    case TokenProtectionWarning.SpamAirdrop:
    case TokenProtectionWarning.FotLow:
      return WarningSeverity.Medium
    case TokenProtectionWarning.NonDefault:
      return WarningSeverity.Low
    case TokenProtectionWarning.None:
      return WarningSeverity.None
  }
}

// Only combine into one plural-languaged modal if there are two tokens prefilled at the same time, and BOTH are low or BOTH are blocked
// i.e. interface PDP, or interface prefilled via URL `?inputCurrency=0x...&outputCurrency=0x...`
export function getShouldHaveCombinedPluralTreatment(
  currencyInfo0: CurrencyInfo,
  currencyInfo1?: CurrencyInfo,
): boolean {
  const designTreatment0 = getTokenWarningSeverity(currencyInfo0)
  const designTreatment1 = getTokenWarningSeverity(currencyInfo1)
  const pluralLowWarnings =
    currencyInfo1 && designTreatment0 === WarningSeverity.Low && designTreatment1 === WarningSeverity.Low
  const pluralBlockedWarnings =
    currencyInfo1 && designTreatment0 === WarningSeverity.Blocked && designTreatment1 === WarningSeverity.Blocked
  const plural = pluralLowWarnings || pluralBlockedWarnings
  return plural ?? false
}

export function useModalHeaderText(currencyInfo0: CurrencyInfo, currencyInfo1?: CurrencyInfo): string | null {
  const shouldHavePluralTreatment = getShouldHaveCombinedPluralTreatment(currencyInfo0, currencyInfo1)
  if (!shouldHavePluralTreatment && currencyInfo1) {
    throw new Error('Should only combine into one plural-languaged modal if BOTH are low or BOTH are blocked')
  }

  const { t } = useTranslation()
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo0)
  if (!tokenProtectionWarning) {
    return null
  }

  const tokenSymbol0 = currencyInfo0.currency?.symbol
  const tokenSymbol1 = currencyInfo1?.currency?.symbol
  return getModalHeaderText({ t, tokenSymbol0, tokenSymbol1, tokenProtectionWarning, shouldHavePluralTreatment })
}

export function getModalHeaderText({
  t,
  tokenProtectionWarning,
  tokenSymbol0,
  tokenSymbol1,
  shouldHavePluralTreatment,
}: {
  t: TFunction
  tokenProtectionWarning: TokenProtectionWarning
  tokenSymbol0?: string
  tokenSymbol1?: string
  shouldHavePluralTreatment?: boolean
}): string | null {
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return shouldHavePluralTreatment
        ? t('token.safety.blocked.title.tokensNotAvailable', {
            tokenSymbol0,
            tokenSymbol1,
          })
        : t('token.safety.blocked.title.tokenNotAvailable', { tokenSymbol: tokenSymbol0 })
    case TokenProtectionWarning.MaliciousHoneypot:
      return t('token.safety.warning.honeypot.title')
    case TokenProtectionWarning.MaliciousImpersonator:
    case TokenProtectionWarning.MaliciousGeneral:
    case TokenProtectionWarning.FotVeryHigh:
      return t('token.safety.warning.malicious.title')
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.title')
    case TokenProtectionWarning.FotHigh:
      return t('token.safety.warning.tokenChargesHighFee.title', { tokenSymbol: tokenSymbol0 })
    case TokenProtectionWarning.FotLow:
      return t('token.safety.warning.tokenChargesFee.title', { tokenSymbol: tokenSymbol0 })
    case TokenProtectionWarning.NonDefault:
      return t('token.safety.warning.alwaysDoYourResearch')
    case TokenProtectionWarning.None:
      return null
  }
}

export function useModalSubtitleText(currencyInfo0: CurrencyInfo, currencyInfo1?: CurrencyInfo): string | null {
  const shouldHavePluralTreatment = getShouldHaveCombinedPluralTreatment(currencyInfo0, currencyInfo1)
  if (!shouldHavePluralTreatment && currencyInfo1) {
    throw new Error('Should only combine into one plural-languaged modal if BOTH are low or BOTH are blocked')
  }
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo0)
  const tokenList = currencyInfo0.safetyInfo?.tokenList

  if (!tokenProtectionWarning) {
    return null
  }

  const formattedFeePercent = formatNumberOrString({
    value: getFeeOnTransfer(currencyInfo0.currency) / 100,
    type: NumberType.Percentage,
  })

  const tokenSymbol = currencyInfo0.currency?.symbol
  const warningCopy = getModalSubtitleTokenWarningText({
    t,
    tokenProtectionWarning,
    tokenSymbol,
    formattedFeePercent,
    shouldHavePluralTreatment,
  })

  // if warningCopy is not null and is not already NonDefault warning, then add extra copy if it's a non-default list token
  const shouldAddNonDefaultCopy =
    tokenProtectionWarning !== TokenProtectionWarning.NonDefault && tokenList === TokenList.NonDefault && warningCopy
  if (shouldAddNonDefaultCopy) {
    const nonDefaultCopy = shouldHavePluralTreatment
      ? t('token.safety.warning.medium.heading.default_other_also')
      : t('token.safety.warning.medium.heading.default_one_also')
    return warningCopy + ' ' + nonDefaultCopy
  }
  return warningCopy
}

export function getModalSubtitleTokenWarningText({
  t,
  tokenProtectionWarning,
  tokenSymbol,
  formattedFeePercent,
  shouldHavePluralTreatment,
}: {
  t: TFunction
  tokenProtectionWarning: TokenProtectionWarning
  tokenSymbol?: string
  formattedFeePercent?: string
  shouldHavePluralTreatment?: boolean
}): string | null {
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return t('token.safety.warning.notAvailableToTrade') + '.'
    case TokenProtectionWarning.MaliciousHoneypot:
      return t('token.safety.warning.honeypot.message', { tokenSymbol })
    case TokenProtectionWarning.MaliciousImpersonator:
      return (
        t('token.safety.warning.malicious.impersonator.message', { tokenSymbol }) +
        ' ' +
        t('token.safety.warning.doYourOwnResearch')
      )
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.message', { tokenSymbol }) + ' ' + t('token.safety.warning.doYourOwnResearch')
    case TokenProtectionWarning.MaliciousGeneral:
      return (
        t('token.safety.warning.malicious.general.message', { tokenSymbol }) +
        ' ' +
        t('token.safety.warning.doYourOwnResearch')
      )
    case TokenProtectionWarning.FotVeryHigh:
    case TokenProtectionWarning.FotHigh:
      return (
        t('token.safety.warning.tokenChargesFee.percent.message', { tokenSymbol, feePercent: formattedFeePercent }) +
        ' ' +
        t('token.safety.fees.uniswapLabsDoesNotReceive')
      )
    case TokenProtectionWarning.FotLow:
      return (
        t('token.safety.warning.tokenChargesFee.message', { tokenSymbol }) +
        ' ' +
        t('token.safety.fees.uniswapLabsDoesNotReceive')
      )
    case TokenProtectionWarning.NonDefault:
      if (shouldHavePluralTreatment) {
        return t('token.safetyLevel.medium.message.plural')
      }
      return t('token.safetyLevel.medium.message')
    case TokenProtectionWarning.None:
      return null
  }
}

export function useTokenWarningCardText(currencyInfo: Maybe<CurrencyInfo>): {
  heading?: string
  description: string | null
} {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo)
  return {
    heading: getCardHeaderText({ t, tokenProtectionWarning }),
    description: getCardSubtitleText({ t, currencyInfo, tokenProtectionWarning, formatNumberOrString }),
  }
}

function getCardHeaderText({
  t,
  tokenProtectionWarning,
}: {
  t: TFunction
  tokenProtectionWarning?: TokenProtectionWarning
}): string | undefined {
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return t('token.safetyLevel.blocked.header')
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
    default:
      return undefined
  }
}

function getCardSubtitleText({
  currencyInfo,
  tokenProtectionWarning,
  t,
  formatNumberOrString,
}: {
  t: TFunction
  currencyInfo: Maybe<CurrencyInfo>
  tokenProtectionWarning?: TokenProtectionWarning
  formatNumberOrString: (input: FormatNumberOrStringInput) => string
}): string | null {
  const feePercent: string = formatNumberOrString({
    value: getFeeOnTransfer(currencyInfo?.currency) / 100,
    type: NumberType.Percentage,
  })
  const tokenSymbol = currencyInfo?.currency?.symbol
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return isInterface
        ? t('token.safety.warning.blocked.description.default_one')
        : t('token.safetyLevel.blocked.message')
    case TokenProtectionWarning.MaliciousHoneypot:
    case TokenProtectionWarning.MaliciousGeneral:
      return t('token.safety.warning.malicious.general.message', { tokenSymbol })
    case TokenProtectionWarning.MaliciousImpersonator:
      return t('token.safety.warning.malicious.impersonator.message.short', { tokenSymbol })
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.message', { tokenSymbol })
    case TokenProtectionWarning.FotVeryHigh:
    case TokenProtectionWarning.FotHigh:
      return t('token.safety.warning.tokenChargesFee.percent.message', { tokenSymbol, feePercent })
    case TokenProtectionWarning.FotLow:
      return t('token.safety.warning.tokenChargesFee.message')
    case TokenProtectionWarning.NonDefault:
      return t('token.safety.warning.medium.heading.default_one')
    case TokenProtectionWarning.None:
      return null
  }
  return null
}
