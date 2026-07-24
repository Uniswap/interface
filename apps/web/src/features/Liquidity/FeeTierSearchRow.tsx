import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { FeeDisplay } from 'uniswap/src/components/FeeDisplay/FeeDisplay'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { LpIncentivesAprDisplay } from '~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay'
import { isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import type { FeeTierData } from '~/types/liquidity'

/** A single fee-tier row in the {@link FeeTierSearchModal} search list. */
export function FeeTierSearchRow({
  pool,
  blocked,
  isSelected,
  isLpIncentivesEnabled,
  existingPoolWarning,
  existingPoolWarningLearnMoreUrl,
  onSelect,
}: {
  pool: FeeTierData
  blocked: boolean
  isSelected: boolean
  isLpIncentivesEnabled?: boolean
  existingPoolWarning?: string
  existingPoolWarningLearnMoreUrl?: string
  onSelect: (pool: FeeTierData) => void
}) {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()

  const row = (
    <Flex
      row
      alignItems="center"
      gap="$spacing24"
      width="100%"
      py="$padding12"
      justifyContent="space-between"
      opacity={blocked ? 0.54 : 1}
      {...(blocked ? { cursor: 'default' as const } : ClickableTamaguiStyle)}
      onPress={blocked ? undefined : () => onSelect(pool)}
    >
      <Flex>
        <Flex row alignItems="center">
          {/* v4 rows headline the LP fee and reveal protocol + all-in on hover via FeeDisplay's tooltip. */}
          <FeeDisplay feeBreakdown={isDynamicFeeTier(pool.fee) ? undefined : pool.feeBreakdown}>
            <Text variant="subheading2">{pool.formattedFee}</Text>
          </FeeDisplay>
          {isLpIncentivesEnabled && pool.boostedApr !== undefined && pool.boostedApr > 0 && (
            <Tooltip placement="right">
              <Tooltip.Trigger>
                <LpIncentivesAprDisplay lpIncentiveRewardApr={pool.boostedApr} isSmall ml="$spacing8" />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <Tooltip.Arrow />
                <Text variant="body4" color="$neutral2" textAlign="center">
                  {t('pool.incentives.eligibleTooltip')}
                </Text>
              </Tooltip.Content>
            </Tooltip>
          )}
        </Flex>
        <Flex row gap="$gap12" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {pool.totalLiquidityUsd === 0
              ? '0'
              : formatNumberOrString({ value: pool.totalLiquidityUsd, type: NumberType.FiatTokenStats })}{' '}
            {t('common.totalValueLocked')}
          </Text>
          <Text variant="body3" color="$neutral2">
            {pool.created
              ? t('fee.tier.percent.select', { percentage: formatPercent(pool.percentage.toSignificant(), 3) })
              : t('common.notCreated.label')}
          </Text>
        </Flex>
      </Flex>
      {isSelected && <CheckCircleFilled size="$icon.24" color="$accent3" />}
    </Flex>
  )

  if (blocked && existingPoolWarning) {
    return (
      <Tooltip placement="top">
        <Tooltip.Trigger width="100%">{row}</Tooltip.Trigger>
        {/* pointerEvents="auto" lets the Learn more link receive clicks (see DisconnectButton) */}
        <Tooltip.Content maxWidth={280} pointerEvents="auto">
          <Tooltip.Arrow />
          <Flex gap="$spacing4">
            <Text variant="body4" color="$neutral1">
              {existingPoolWarning}
            </Text>
            {existingPoolWarningLearnMoreUrl && (
              <LearnMoreLink url={existingPoolWarningLearnMoreUrl} textVariant="buttonLabel4" textColor="$accent1" />
            )}
          </Flex>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return row
}
