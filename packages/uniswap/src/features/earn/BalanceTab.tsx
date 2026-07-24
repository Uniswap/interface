import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { RewardsUnavailableIndicator } from 'uniswap/src/features/earn/RewardsUnavailableIndicator'
import type { EarnPositionInfo } from 'uniswap/src/features/earn/types'
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
  showActionButtons?: boolean
}

export function BalanceTab({
  canWithdraw,
  position,
  onDeposit,
  onWithdraw,
  lifetimeEarningsUsd,
  lifetimeEarningsError = false,
  showActionButtons = true,
}: BalanceTabProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, formatNumberOrString } = useLocalizationContext()

  const formatFiat = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatStandard })
  const resolvedLifetimeEarnings = lifetimeEarningsUsd ?? position.lifetimePnlUsd

  return (
    <Flex gap="$spacing16">
      <Flex gap="$spacing16" px="$spacing4">
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
              // Show '-' rather than coercing undefined to 0 (would read as a real zero).
              // Earnings are always framed as positive gains, so never render a minus sign.
              <Text variant="body2" color="$statusSuccess">
                {resolvedLifetimeEarnings === undefined ? '-' : formatFiat(Math.abs(resolvedLifetimeEarnings))}
              </Text>
            )
          }
        />
      </Flex>

      {showActionButtons && (
        <Flex row gap="$spacing8">
          <Button fill={false} emphasis="secondary" size="large" flex={1} disabled={!canWithdraw} onPress={onWithdraw}>
            {t('explore.earn.vault.withdraw')}
          </Button>
          <Button fill={false} emphasis="primary" size="large" flex={1} onPress={onDeposit}>
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
