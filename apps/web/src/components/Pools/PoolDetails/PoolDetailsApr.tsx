import { Percent } from '@uniswap/sdk-core'
import { LpIncentivesAprDisplay } from 'components/LpIncentives/LpIncentivesAprDisplay'
import { calculateTotalApr } from 'components/LpIncentives/utils'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

export const PoolDetailsApr = ({ poolApr, rewardsApr }: { poolApr: Percent; rewardsApr?: number }) => {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const showAprBreakdown = rewardsApr !== undefined && rewardsApr > 0
  const totalApr = rewardsApr
    ? formatPercent(calculateTotalApr(poolApr, rewardsApr).toSignificant(), 2)
    : `${poolApr.toFixed(2)}%`

  return (
    <Flex
      gap="$spacing12"
      padding="$spacing20"
      borderRadius="$spacing20"
      backgroundColor="$surface2"
      width="100%"
      flexDirection="column"
      mt={-24}
      mb={24}
      $xl={{ my: 0 }}
    >
      <Flex>
        <Text variant="body2" color="$neutral2">
          {t('pool.totalAPR')}
        </Text>
        <Text variant="heading2" color="$neutral1" mt="$spacing4">
          {totalApr}
        </Text>
      </Flex>
      {showAprBreakdown && (
        <Flex mt="$spacing8" gap="$spacing6">
          <Flex row justifyContent="space-between" alignItems="center" gap="$gap8">
            <Text variant="body3" color="$neutral2">
              {t('pool.apr.base')}
            </Text>
            <Text variant="body3" color="$neutral1">
              {formatPercent(poolApr.toSignificant())}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between" alignItems="center" gap="$gap8">
            <Text variant="body3" color="$neutral2">
              {t('pool.apr.reward')}
            </Text>
            <LpIncentivesAprDisplay lpIncentiveRewardApr={rewardsApr} hideBackground showTokenSymbol />
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
