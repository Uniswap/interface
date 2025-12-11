import { TFunction } from 'i18next'
import { PropsWithChildren, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Flag } from 'ui/src/components/icons/Flag'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getFeeColor } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import { WarningModalInfoContainer } from 'uniswap/src/features/tokens/warnings/WarningInfoModalContainer'

function getWarningFlags({
  currencyInfo,
  formatPercent,
  t,
  tokenProtectionWarning,
}: {
  currencyInfo: CurrencyInfo
  formatPercent: (value: Maybe<string | number>) => string
  t: TFunction
  tokenProtectionWarning: TokenProtectionWarning
}): JSX.Element[] {
  const flags: JSX.Element[] = []

  const isToken = currencyInfo.currency.isToken

  if (isToken) {
    // If Blockaid marks the token as having high fees, but we don't have data on token fees, show Blockaid's fees data
    const buyFeePercent = currencyInfo.currency.buyFeeBps
      ? currencyInfo.currency.buyFeeBps.toNumber() / 100
      : currencyInfo.safetyInfo?.blockaidFees?.buyFeePercent
    const sellFeePercent = currencyInfo.currency.sellFeeBps
      ? currencyInfo.currency.sellFeeBps.toNumber() / 100
      : currencyInfo.safetyInfo?.blockaidFees?.sellFeePercent

    if (buyFeePercent) {
      const buyFeeColor = getFeeColor(buyFeePercent)

      flags.push(
        <WarningFlag key="buy-fee">
          <Trans
            i18nKey="token.safety.warning.feeDescription"
            components={{
              fee: (
                <Text variant="body3" color={buyFeeColor}>
                  {formatPercent(buyFeePercent)} {t('common.fee').toLowerCase()}
                </Text>
              ),
            }}
            values={{
              action: t('common.bought').toLowerCase(),
            }}
          />
        </WarningFlag>,
      )
    }

    if (sellFeePercent) {
      const sellFeeColor = getFeeColor(sellFeePercent)

      flags.push(
        <WarningFlag key="sell-fee">
          <Trans
            i18nKey="token.safety.warning.feeDescription"
            components={{
              fee: (
                <Text variant="body3" color={sellFeeColor}>
                  {formatPercent(sellFeePercent)} {t('common.fee').toLowerCase()}
                </Text>
              ),
            }}
            values={{
              action: t('common.sold').toLowerCase(),
            }}
          />
        </WarningFlag>,
      )
    }
  }

  if (tokenProtectionWarning === TokenProtectionWarning.SpamAirdrop) {
    flags.push(<WarningFlag key="spam-warning">{t('token.safety.warning.spamsUsers')}</WarningFlag>)
  }

  if (tokenProtectionWarning === TokenProtectionWarning.MaliciousImpersonator) {
    flags.push(<WarningFlag key="impersonator-warning">{t('token.safety.warning.impersonator')}</WarningFlag>)
  }

  if (tokenProtectionWarning === TokenProtectionWarning.MaliciousGeneral) {
    flags.push(
      <WarningFlag key="malicious-general-warning">{t('token.safety.warning.flaggedAsMalicious')}</WarningFlag>,
    )
  }

  if (tokenProtectionWarning === TokenProtectionWarning.PotentialHoneypot) {
    flags.push(
      <WarningFlag key="potential-honeypot-warning">{t('token.safety.warning.flaggedAsSuspicious')}</WarningFlag>,
    )
  }

  if (currencyInfo.safetyInfo?.tokenList === TokenList.NonDefault) {
    flags.push(<WarningFlag key="exchange-warning">{t('token.safety.warning.notListedOnExchanges')}</WarningFlag>)
  }

  return flags
}

function WarningFlag({ children }: PropsWithChildren): JSX.Element {
  return (
    <Flex row width="100%" alignItems="center" justifyContent="flex-start" gap="$spacing8">
      <Flag size="$icon.16" color="$neutral2" />
      <Text variant="body3" color="$neutral2">
        {children}
      </Text>
    </Flex>
  )
}

export function TokenWarningFlagsTable({
  currencyInfo,
  tokenProtectionWarning,
}: {
  currencyInfo: CurrencyInfo
  tokenProtectionWarning: TokenProtectionWarning
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const flags = useMemo(
    () => getWarningFlags({ currencyInfo, formatPercent, t, tokenProtectionWarning }),
    [currencyInfo, formatPercent, t, tokenProtectionWarning],
  )

  if (flags.length === 0) {
    return null
  }

  return (
    <WarningModalInfoContainer gap="$spacing8" py="$spacing12">
      {flags}
    </WarningModalInfoContainer>
  )
}
