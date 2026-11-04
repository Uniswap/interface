import { isWebPlatform } from '@universe/environment'
import { Button, Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { getProjectedAnnualEarnings } from 'uniswap/src/features/earn/amount'
import { LiveEarnRewardsAmount } from 'uniswap/src/features/earn/LiveEarnRewardsAmount'
import { RewardsUnavailableIndicator } from 'uniswap/src/features/earn/RewardsUnavailableIndicator'
import type { EarnPositionInfo } from 'uniswap/src/features/earn/types'
import { getDisplayLifetimeEarningsUsd } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

interface BalanceTabProps {
  canWithdraw: boolean
  position: EarnPositionInfo
  onDeposit: () => void
  onWithdraw: () => void
  /** Lifetime earnings sourced separately from the balance so it can fail on its own. */
  lifetimeEarningsUsd?: number
  lifetimeEarningsError?: boolean
  depositLoading?: boolean
  showActionButtons?: boolean
}

export function BalanceTab({
  canWithdraw,
  position,
  onDeposit,
  onWithdraw,
  lifetimeEarningsUsd,
  lifetimeEarningsError = false,
  depositLoading = false,
  showActionButtons = true,
}: BalanceTabProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()

  // Position values are USD-denominated; convert before formatting in the selected fiat.
  const formatFiat = (value: number): string => convertFiatAmountFormatted(value, NumberType.FiatStandard)
  const resolvedLifetimeEarnings = lifetimeEarningsUsd ?? position.lifetimePnlUsd
  const displayLifetimeEarnings = getDisplayLifetimeEarningsUsd(resolvedLifetimeEarnings)
  const annualRewardsRateUsd = getProjectedAnnualEarnings({
    balance: position.depositedUsd,
    apyPercent: position.apyPercent,
  })

  return (
    <Flex gap="$spacing16">
      <Flex gap="$spacing16" px="$spacing4" py={isWebPlatform ? undefined : '$spacing4'}>
        <BalanceRow
          label={t('explore.earn.vault.deposited')}
          value={
            <Text variant="body2" color="$neutral1">
              {formatFiat(position.depositedUsd)}
            </Text>
          }
        />
        <BalanceRow
          label={t('explore.earn.vault.rate')}
          value={
            <Text variant="body2" color="$accent1">
              {t('explore.earn.vault.rateValue', {
                apy: formatPercent(position.apyPercent),
              })}
            </Text>
          }
        />
        <BalanceRow
          label={t('explore.earn.vault.lifetimeEarnings')}
          value={
            lifetimeEarningsError ? (
              <RewardsUnavailableIndicator />
            ) : (
              <LiveEarnRewardsAmount
                // Remount on vault switch so a prior position's extrapolation never carries over.
                key={position.vaultId}
                lifetimeEarningsUsd={resolvedLifetimeEarnings}
                annualRewardsRateUsd={annualRewardsRateUsd}
                textVariant="$body2"
                fallback={
                  // Show '-' rather than coercing undefined to 0 (would read as a real zero).
                  <Text variant="body2" color="$statusSuccess">
                    {displayLifetimeEarnings === undefined ? '-' : formatFiat(displayLifetimeEarnings)}
                  </Text>
                }
              />
            )
          }
        />
      </Flex>

      {showActionButtons && (
        <Flex row gap="$spacing8">
          <Button fill={false} emphasis="secondary" size="large" flex={1} disabled={!canWithdraw} onPress={onWithdraw}>
            {t('explore.earn.vault.withdraw')}
          </Button>
          <Button fill={false} emphasis="primary" size="large" flex={1} loading={depositLoading} onPress={onDeposit}>
            {t('explore.earn.vault.deposit')}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

function BalanceRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="body2" color="$neutral2">
        {label}
      </Text>
      {value}
    </Flex>
  )
}
