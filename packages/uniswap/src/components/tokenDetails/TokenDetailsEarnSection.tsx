import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RewardsUnavailableIndicator } from 'uniswap/src/features/earn/RewardsUnavailableIndicator'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { NumberType } from 'utilities/src/format/types'

type TokenDetailsEarnSectionProps = {
  earnPosition: EarnPositionInfo
  earnVault: EarnVaultInfo
  onPositionPress: (vault: EarnVaultInfo, position: EarnPositionInfo) => void
  onWithdrawPress: (vault: EarnVaultInfo, position: EarnPositionInfo) => void
  onDepositPress: (vault: EarnVaultInfo, position: EarnPositionInfo) => void
  mobileLayout?: boolean
  rewardsUnavailable?: boolean
}

export function TokenDetailsEarnSection({
  earnPosition,
  earnVault,
  onPositionPress,
  onWithdrawPress,
  onDepositPress,
  mobileLayout = false,
  rewardsUnavailable = false,
}: TokenDetailsEarnSectionProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()

  if (mobileLayout) {
    return (
      <MobileTokenDetailsEarnSection
        earnPosition={earnPosition}
        earnVault={earnVault}
        rewardsUnavailable={rewardsUnavailable}
        onDepositPress={onDepositPress}
        onPositionPress={onPositionPress}
        onWithdrawPress={onWithdrawPress}
      />
    )
  }

  return (
    <Flex gap="$spacing12" width="100%">
      <Flex gap="$spacing8" width="100%">
        <Text variant="body1" color="$neutral1">
          {t('explore.earn.title')}
        </Text>

        <TouchableArea
          row
          alignItems="center"
          gap="$spacing8"
          width="100%"
          py="$spacing4"
          borderRadius="$rounded8"
          hoverStyle={{ backgroundColor: '$surface2' }}
          onPress={() => onPositionPress(earnVault, earnPosition)}
        >
          <Text variant="body2" color="$neutral2" flex={1} minWidth={0}>
            {t('explore.earn.vault.deposited')}
          </Text>
          <Text variant="body2" color="$neutral1" textAlign="right" whiteSpace="nowrap">
            {convertFiatAmountFormatted(earnPosition.depositedUsd, NumberType.PortfolioBalance)}
          </Text>
          <Flex width="$spacing4" height="$spacing4" borderRadius="$roundedFull" backgroundColor="$neutral3" />
          <Text variant="body2" color="$accent1" textAlign="right" whiteSpace="nowrap">
            {t('explore.earn.apy', { apy: formatPercent(earnPosition.apyPercent) })}
          </Text>
          <RotatableChevron direction="right" color="$neutral2" size="$icon.16" />
        </TouchableArea>
      </Flex>

      <Flex row gap="$spacing8">
        <Button size="small" emphasis="tertiary" onPress={() => onWithdrawPress(earnVault, earnPosition)}>
          {t('explore.earn.vault.withdraw')}
        </Button>
        <Button size="small" emphasis="secondary" onPress={() => onDepositPress(earnVault, earnPosition)}>
          {t('explore.earn.vault.deposit')}
        </Button>
      </Flex>
    </Flex>
  )
}

function MobileTokenDetailsEarnSection({
  earnPosition,
  earnVault,
  rewardsUnavailable,
  onDepositPress,
  onPositionPress,
  onWithdrawPress,
}: Required<Pick<TokenDetailsEarnSectionProps, 'earnPosition' | 'earnVault' | 'rewardsUnavailable'>> &
  Pick<TokenDetailsEarnSectionProps, 'onDepositPress' | 'onPositionPress' | 'onWithdrawPress'>): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const currency = useCurrencyInfo(earnVault.displayCurrencyId)?.currency
  const depositedAmount = useMemo(
    () => getCurrencyAmount({ value: earnPosition.depositedRaw, valueType: ValueType.Raw, currency }),
    [currency, earnPosition.depositedRaw],
  )
  const depositedTokenLabel = depositedAmount
    ? `${formatCurrencyAmount({ value: depositedAmount, type: NumberType.TokenNonTx })} ${currency?.symbol ?? ''}`.trim()
    : undefined
  const totalRewards = earnPosition.lifetimePnlUsd

  return (
    <Flex gap="$spacing12" width="100%" px="$spacing8" pt="$spacing32">
      <TouchableArea
        alignSelf="flex-start"
        accessibilityRole="button"
        accessibilityLabel={t('explore.earn.vault.viewDetails')}
        onPress={() => onPositionPress(earnVault, earnPosition)}
      >
        <Flex row alignItems="center" gap="$spacing6">
          <Text variant="body1" color="$neutral1">
            {t('home.earning.title')}
          </Text>
          <InfoCircleFilled color="$neutral3" size="$icon.16" />
        </Flex>
      </TouchableArea>

      <Flex gap="$spacing16">
        <Flex row alignItems="baseline" gap="$spacing8" minWidth={0}>
          <Text variant="heading3" color="$neutral1" numberOfLines={1}>
            {convertFiatAmountFormatted(earnPosition.depositedUsd, NumberType.FiatTokenDetails)}
          </Text>
          {depositedTokenLabel && (
            <Text variant="body2" color="$neutral2" numberOfLines={1} flexShrink={1}>
              {depositedTokenLabel}
            </Text>
          )}
        </Flex>

        <MobileBalanceRow
          label={t('explore.earn.vault.rewardRate')}
          value={
            <Text variant="body3" color="$accent1">
              {t('explore.earn.vault.rateValue', { apy: formatPercent(earnPosition.apyPercent) })}
            </Text>
          }
        />
        <MobileBalanceRow
          label={t('pool.positions.summary.totalRewards')}
          value={
            rewardsUnavailable ? (
              <RewardsUnavailableIndicator />
            ) : (
              <Text variant="body3" color="$statusSuccess">
                {totalRewards === undefined
                  ? '-'
                  : convertFiatAmountFormatted(Math.abs(totalRewards), NumberType.FiatTokenDetails)}
              </Text>
            )
          }
        />

        <Flex row gap="$spacing8">
          <Button
            fill={false}
            size="small"
            emphasis="tertiary"
            flex={1}
            onPress={() => onWithdrawPress(earnVault, earnPosition)}
          >
            {t('explore.earn.vault.withdraw')}
          </Button>
          <Button
            fill={false}
            size="small"
            emphasis="secondary"
            flex={1}
            onPress={() => onDepositPress(earnVault, earnPosition)}
          >
            {t('explore.earn.vault.deposit')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}

function MobileBalanceRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="body3" color="$neutral1">
        {label}
      </Text>
      {value}
    </Flex>
  )
}
