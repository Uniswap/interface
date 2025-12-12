/* eslint-disable consistent-return */
import { Currency, NativeCurrency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { ColorTokens } from 'ui/src'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { AttackType, CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { logger } from 'utilities/src/logger/logger'
import { isWebApp } from 'utilities/src/platform'

export enum TokenProtectionWarning {
  // THESE NUMERIC VALUES MATTER -- they are used for severity comparison
  Blocked = 10,
  MaliciousHoneypot = 9, // 100% fot
  FotVeryHigh = 8, // [80, 100)% fot
  MaliciousImpersonator = 7,
  FotHigh = 6, // [5, 80)% fot
  MaliciousGeneral = 5,
  PotentialHoneypot = 4.5, // Between SpamAirdrop (4) and MaliciousGeneral (5)
  SpamAirdrop = 4,
  FotLow = 3, // (0, 5)% fot
  NonDefault = 2,
  None = 1,
}

export const TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT = 100
export const TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT = 80
export const TOKEN_PROTECTION_FOT_FEE_BREAKPOINT = 15

// Gets the FoT percentages from Currency, populated by our internal fees DB
export function getCurrencyFeeOnTransfer(currency?: Currency): {
  buyFeePercent: number | undefined
  sellFeePercent: number | undefined
} {
  if (!currency) {
    return {
      buyFeePercent: undefined,
      sellFeePercent: undefined,
    }
  }
  if (currency.isNative) {
    return {
      buyFeePercent: 0,
      sellFeePercent: 0,
    }
  }

  const sellFeePercent = currency.sellFeeBps ? currency.sellFeeBps.toNumber() / 100 : undefined
  const buyFeePercent = currency.buyFeeBps ? currency.buyFeeBps.toNumber() / 100 : undefined

  // Returns the percent (i.e. 5.1 for 5.1%)
  return {
    buyFeePercent,
    sellFeePercent,
  }
}

/** If Blockaid marks the token as having high fees, but we don't have data on token fees, show Blockaid's fees data in token protection warnings.
 * Is *NOT* shown in swap review, which shows fees from TradingApi swap simulation.
 */
export function getTokenProtectionFeeOnTransfer(currencyInfo: Maybe<CurrencyInfo>): {
  buyFeePercent: number | undefined
  sellFeePercent: number | undefined
  maxFeePercent: number | undefined
} {
  const { buyFeePercent, sellFeePercent } = getCurrencyFeeOnTransfer(currencyInfo?.currency)

  const blockaidFeesData = currencyInfo?.safetyInfo?.blockaidFees
  const displayedBuyFeePercent = buyFeePercent ?? blockaidFeesData?.buyFeePercent
  const displayedSellFeePercent = sellFeePercent ?? blockaidFeesData?.sellFeePercent

  // Returns the percent (i.e. 5.1 for 5.1%)
  return {
    buyFeePercent: displayedBuyFeePercent,
    sellFeePercent: displayedSellFeePercent,
    maxFeePercent:
      displayedSellFeePercent || displayedBuyFeePercent
        ? Math.max(displayedSellFeePercent ?? 0, displayedBuyFeePercent ?? 0)
        : undefined,
  }
}

// eslint-disable-next-line complexity
export function getTokenProtectionWarning(currencyInfo?: Maybe<CurrencyInfo>): TokenProtectionWarning {
  if (!currencyInfo?.currency || !currencyInfo.safetyInfo) {
    return TokenProtectionWarning.NonDefault
  }
  const { currency, safetyInfo } = currencyInfo

  const { protectionResult, attackType } = safetyInfo
  if (currency instanceof NativeCurrency) {
    return TokenProtectionWarning.None
  }

  const { maxFeePercent: feeOnTransfer } = getTokenProtectionFeeOnTransfer(currencyInfo)

  // prioritize high > medium > low warning levels
  if (safetyInfo.tokenList === TokenList.Blocked) {
    return TokenProtectionWarning.Blocked
  } else if (feeOnTransfer === TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT) {
    return TokenProtectionWarning.MaliciousHoneypot
  } else if (
    (feeOnTransfer && feeOnTransfer >= TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT) ||
    ((protectionResult === GraphQLApi.ProtectionResult.Malicious ||
      protectionResult === GraphQLApi.ProtectionResult.Spam) &&
      attackType === AttackType.HighFees)
  ) {
    return TokenProtectionWarning.FotVeryHigh
  } else if (
    (protectionResult === GraphQLApi.ProtectionResult.Malicious ||
      protectionResult === GraphQLApi.ProtectionResult.Spam) &&
    attackType === AttackType.Impersonator
  ) {
    return TokenProtectionWarning.MaliciousImpersonator
  } else if (feeOnTransfer && feeOnTransfer >= TOKEN_PROTECTION_FOT_FEE_BREAKPOINT) {
    return TokenProtectionWarning.FotHigh
  } else if (protectionResult === GraphQLApi.ProtectionResult.Malicious) {
    return TokenProtectionWarning.MaliciousGeneral
  } else if (attackType === AttackType.Honeypot) {
    return TokenProtectionWarning.PotentialHoneypot
  } else if (protectionResult === GraphQLApi.ProtectionResult.Spam && attackType === AttackType.Airdrop) {
    return TokenProtectionWarning.SpamAirdrop
  } else if (feeOnTransfer && feeOnTransfer > 0 && feeOnTransfer < TOKEN_PROTECTION_FOT_FEE_BREAKPOINT) {
    return TokenProtectionWarning.FotLow
  } else if (safetyInfo.tokenList === TokenList.NonDefault) {
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

export function getTokenWarningSeverity(currencyInfo: Maybe<CurrencyInfo>): WarningSeverity {
  if (!currencyInfo) {
    return WarningSeverity.None
  }
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo)
  return getSeverityFromTokenProtectionWarning(tokenProtectionWarning)
}

export function getSeverityFromTokenProtectionWarning(tokenProtectionWarning: TokenProtectionWarning): WarningSeverity {
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return WarningSeverity.Blocked
    case TokenProtectionWarning.MaliciousHoneypot:
    case TokenProtectionWarning.MaliciousImpersonator:
    case TokenProtectionWarning.MaliciousGeneral:
    case TokenProtectionWarning.FotVeryHigh:
    case TokenProtectionWarning.FotHigh:
      return WarningSeverity.High
    case TokenProtectionWarning.PotentialHoneypot:
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

export function useModalHeaderText({
  tokenProtectionWarning,
  tokenSymbol0,
  tokenSymbol1,
  shouldHavePluralTreatment,
}: {
  tokenProtectionWarning?: TokenProtectionWarning
  tokenSymbol0?: string
  tokenSymbol1?: string
  shouldHavePluralTreatment?: boolean
}): string | null {
  const { t } = useTranslation()

  if (!tokenProtectionWarning) {
    return null
  }
  if (!shouldHavePluralTreatment && tokenSymbol1) {
    logger.error('Should only combine into one plural-languaged modal if BOTH are low or BOTH are blocked', {
      tags: { file: 'safetyUtils.ts', function: 'useModalHeaderText' },
    })
  }
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return shouldHavePluralTreatment && tokenSymbol1
        ? t('token.safety.blocked.title.tokensNotAvailable', {
            tokenSymbol0: tokenSymbol0 ?? t('common.thisToken'),
            tokenSymbol1,
          })
        : t('token.safety.blocked.title.tokenNotAvailable', { tokenSymbol: tokenSymbol0 ?? t('common.thisToken') })
    case TokenProtectionWarning.MaliciousHoneypot:
      return t('token.safety.warning.sellFee100.title')
    case TokenProtectionWarning.FotVeryHigh:
      return t('token.safety.warning.fotVeryHigh.title')
    case TokenProtectionWarning.MaliciousImpersonator:
      return t('token.safety.warning.impersonator.title')
    case TokenProtectionWarning.FotHigh:
      return t('token.safety.warning.fotHigh.title')
    case TokenProtectionWarning.MaliciousGeneral:
      return t('token.safety.warning.malicious.title')
    case TokenProtectionWarning.PotentialHoneypot:
      return t('token.safety.warning.potentialHoneypot.title')
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.title')
    case TokenProtectionWarning.FotLow:
      return t('token.safety.warning.fotLow.title')
    case TokenProtectionWarning.NonDefault:
      return t('token.safety.warning.alwaysDoYourResearch')
    case TokenProtectionWarning.None:
      return null
  }
}

// eslint-disable-next-line complexity
export function useModalSubtitleText({
  tokenProtectionWarning,
  tokenSymbol,
  buyFeePercent,
  sellFeePercent,
  shouldHavePluralTreatment,
}: {
  tokenProtectionWarning: TokenProtectionWarning | undefined
  tokenSymbol?: string
  buyFeePercent?: number
  sellFeePercent?: number
  shouldHavePluralTreatment?: boolean
}): string | null {
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()

  if (!tokenProtectionWarning) {
    return null
  }

  const tokenSymbolWithFallback = tokenSymbol ?? t('common.thisToken')
  const formattedBuyFeePercent = buyFeePercent && buyFeePercent > 0 ? formatPercent(buyFeePercent) : undefined
  const formattedSellFeePercent = sellFeePercent && sellFeePercent > 0 ? formatPercent(sellFeePercent) : undefined

  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return isWebApp
        ? shouldHavePluralTreatment
          ? t('token.safety.warning.blocked.description.default_other')
          : t('token.safety.warning.blocked.description.default_one')
        : t('token.safetyLevel.blocked.message')
    case TokenProtectionWarning.MaliciousHoneypot:
      return t('token.safety.warning.honeypot.message', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.MaliciousGeneral:
      return (
        t('token.safety.warning.malicious.general.message', { tokenSymbol: tokenSymbolWithFallback }) +
        ' ' +
        t('token.safety.warning.doYourOwnResearch')
      )
    case TokenProtectionWarning.MaliciousImpersonator:
      return t('token.safety.warning.malicious.impersonator.message', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.PotentialHoneypot:
      return t('token.safety.warning.potentialHoneypot.modal.message', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.SpamAirdrop:
      return (
        t('token.safety.warning.spam.message', { tokenSymbol: tokenSymbolWithFallback }) +
        ' ' +
        t('token.safety.warning.doYourOwnResearch')
      )
    case TokenProtectionWarning.FotVeryHigh:
    case TokenProtectionWarning.FotHigh:
    case TokenProtectionWarning.FotLow: {
      const feePercentCopy =
        !!formattedBuyFeePercent && !!formattedSellFeePercent
          ? t('token.safety.warning.tokenChargesFee.both.message', {
              tokenSymbol: tokenSymbolWithFallback,
              buyFeePercent: formattedBuyFeePercent,
              sellFeePercent: formattedSellFeePercent,
            })
          : formattedBuyFeePercent
            ? t('token.safety.warning.tokenChargesFee.buy.message', {
                tokenSymbol: tokenSymbolWithFallback,
                feePercent: formattedBuyFeePercent,
              })
            : formattedSellFeePercent
              ? t('token.safety.warning.tokenChargesFee.sell.message', {
                  tokenSymbol: tokenSymbolWithFallback,
                  feePercent: formattedSellFeePercent,
                })
              : t('token.safety.warning.tokenChargesFee.unknownFee.message', {
                  tokenSymbol: tokenSymbolWithFallback,
                })
      return (
        feePercentCopy +
        ' ' +
        t('token.safety.warning.mayResultInLoss') +
        ' ' +
        t('token.safety.fees.uniswapLabsDoesNotReceive')
      )
    }
    case TokenProtectionWarning.NonDefault:
      return shouldHavePluralTreatment
        ? t('token.safetyLevel.medium.message.plural')
        : t('token.safety.warning.medium.heading.named', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.None:
      return null
  }
}

export function useTokenWarningCardText(currencyInfo: Maybe<CurrencyInfo>): {
  heading: string | null
  description: string | null
} {
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo)
  const { buyFeePercent, sellFeePercent } = getTokenProtectionFeeOnTransfer(currencyInfo)

  const heading = useCardHeaderText({ tokenProtectionWarning })
  const description = useCardSubtitleText({
    tokenProtectionWarning,
    tokenSymbol: currencyInfo?.currency.symbol,
    buyFeePercent,
    sellFeePercent,
  })
  if (!currencyInfo || !currencyInfo.safetyInfo) {
    return {
      heading: null,
      description: null,
    }
  }
  return {
    heading,
    description,
  }
}

export function useCardHeaderText({
  tokenProtectionWarning,
}: {
  tokenProtectionWarning: TokenProtectionWarning
}): string | null {
  const { t } = useTranslation()
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.MaliciousHoneypot:
      return t('token.safety.warning.honeypot.title')
    case TokenProtectionWarning.FotVeryHigh:
      return t('token.safety.warning.fotVeryHigh.title')
    case TokenProtectionWarning.MaliciousImpersonator:
      return t('token.safety.warning.impersonator.title')
    case TokenProtectionWarning.FotHigh:
      return t('token.safety.warning.fotHigh.title')
    case TokenProtectionWarning.MaliciousGeneral:
      return t('token.safety.warning.malicious.title')
    case TokenProtectionWarning.PotentialHoneypot:
      return t('token.safety.warning.potentialHoneypot.title')
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.title')
    case TokenProtectionWarning.FotLow:
      return t('token.safety.warning.fotLow.title')
    case TokenProtectionWarning.NonDefault:
    case TokenProtectionWarning.None:
    default:
      return null
  }
}

// eslint-disable-next-line complexity
export function useCardSubtitleText({
  tokenProtectionWarning,
  tokenSymbol,
  buyFeePercent,
  sellFeePercent,
}: {
  tokenProtectionWarning: TokenProtectionWarning
  tokenSymbol?: string
  buyFeePercent?: number
  sellFeePercent?: number
}): string | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const tokenSymbolWithFallback = tokenSymbol ?? t('common.thisToken')
  const formattedBuyFeePercent = buyFeePercent && buyFeePercent > 0 ? formatPercent(buyFeePercent) : undefined
  const formattedSellFeePercent = sellFeePercent && sellFeePercent > 0 ? formatPercent(sellFeePercent) : undefined
  switch (tokenProtectionWarning) {
    case TokenProtectionWarning.Blocked:
      return isWebApp
        ? t('token.safety.warning.blocked.description.default_one')
        : t('token.safetyLevel.blocked.message')
    case TokenProtectionWarning.MaliciousHoneypot:
      return t('token.safety.warning.sellFee100.message', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.MaliciousGeneral:
      return t('token.safety.warning.malicious.general.message', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.MaliciousImpersonator:
      return t('token.safety.warning.malicious.impersonator.message.short', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.PotentialHoneypot:
      return t('token.safety.warning.potentialHoneypot.card.message', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.SpamAirdrop:
      return t('token.safety.warning.spam.message', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.FotVeryHigh:
    case TokenProtectionWarning.FotHigh:
    case TokenProtectionWarning.FotLow: {
      const feePercentCopy =
        !!formattedBuyFeePercent && !!formattedSellFeePercent
          ? t('token.safety.warning.tokenChargesFee.both.message', {
              tokenSymbol: tokenSymbolWithFallback,
              buyFeePercent: formattedBuyFeePercent,
              sellFeePercent: formattedSellFeePercent,
            })
          : formattedBuyFeePercent
            ? t('token.safety.warning.tokenChargesFee.buy.message', {
                tokenSymbol: tokenSymbolWithFallback,
                feePercent: formattedBuyFeePercent,
              })
            : formattedSellFeePercent
              ? t('token.safety.warning.tokenChargesFee.sell.message', {
                  tokenSymbol: tokenSymbolWithFallback,
                  feePercent: formattedSellFeePercent,
                })
              : t('token.safety.warning.tokenChargesFee.unknownFee.message', {
                  tokenSymbol: tokenSymbolWithFallback,
                })
      return feePercentCopy
    }
    case TokenProtectionWarning.NonDefault:
      return t('token.safety.warning.medium.heading.named', { tokenSymbol: tokenSymbolWithFallback })
    case TokenProtectionWarning.None:
      return null
  }
}

export function getFeeColor(feePercent: number): ColorTokens {
  const tokenProtectionWarning = getFeeWarning(feePercent)
  const severity = getSeverityFromTokenProtectionWarning(tokenProtectionWarning)
  const { headerText: textColor } = getAlertColor(severity)
  return textColor
}
