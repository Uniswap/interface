import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import type { EarnPositionInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

interface BalanceTabProps {
  position: EarnPositionInfo
  onDeposit: () => void
  onWithdraw: () => void
}

export function BalanceTab({ position, onDeposit, onWithdraw }: BalanceTabProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, formatNumberOrString } = useLocalizationContext()

  const formatFiat = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatStandard })

  return (
    <Flex gap="$spacing16">
      <Flex gap="$spacing16">
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
              {t('explore.earn.vault.rateValue', { apy: formatPercent(position.apyPercent) })}
            </Text>
          }
        />
        <BalanceRow
          label={t('explore.earn.vault.lifetimeEarnings')}
          value={
            // Show '-' rather than coercing undefined to 0 (would read as a real zero).
            <Text variant="body2" color="$statusSuccess">
              {position.lifetimePnlUsd === undefined ? '-' : formatFiat(position.lifetimePnlUsd)}
            </Text>
          }
        />
      </Flex>

      <Flex row gap="$spacing8">
        <Button emphasis="tertiary" size="medium" py="$spacing16" flex={1} onPress={onWithdraw}>
          {t('explore.earn.vault.withdraw')}
        </Button>
        <Button emphasis="primary" size="medium" py="$spacing16" flex={1} onPress={onDeposit}>
          {t('explore.earn.vault.deposit')}
        </Button>
      </Flex>
    </Flex>
  )
}

function BalanceRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between" px="$spacing6">
      <Text variant="body2" color="$neutral1">
        {label}
      </Text>
      {value}
    </Flex>
  )
}
