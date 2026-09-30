import { Flex, iconSizes } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { type BreakdownCardProps } from 'src/screens/PortfolioChartDetailsScreen/getBreakdownCardProps'
import { Coin } from 'ui/src/components/icons/Coin'
import { EarnSparkle } from 'ui/src/components/icons/EarnSparkle'
import { Pools } from 'ui/src/components/icons/Pools'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const PERCENT_COLUMN_WIDTH = 56

export function PortfolioBalanceBreakdownCard({
  tokens,
  pools,
  earn,
  semanticPercentColor,
}: BreakdownCardProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const rows = [
    {
      Icon: Coin,
      label: t('portfolio.balanceBreakdown.tokenBalance'),
      testID: TestID.BalanceBreakdownRowTokens,
      ...tokens,
    },
    {
      Icon: Pools,
      label: t('portfolio.balanceBreakdown.poolsBalance'),
      testID: TestID.BalanceBreakdownRowPools,
      ...pools,
    },
    {
      Icon: EarnSparkle,
      label: t('portfolio.balanceBreakdown.earnBalance'),
      testID: TestID.BalanceBreakdownRowEarn,
      ...earn,
    },
  ].filter((row) => row.valueUSD !== undefined)

  return (
    <Flex alignSelf="flex-start" alignItems="stretch" gap="$spacing4" py="$spacing12">
      {rows.map(({ Icon, label, testID, valueUSD, percentChange }) => (
        <Flex key={testID} row alignItems="center" gap="$spacing12" accessibilityLabel={label} testID={testID}>
          <Flex row grow shrink minWidth={0} alignItems="center" gap="$spacing8">
            <Icon color="$neutral2" size={iconSizes.icon16} />
            <AnimatedNumber
              numericValue={valueUSD ?? undefined}
              value={convertFiatAmountFormatted(valueUSD, NumberType.PortfolioBalance)}
              textVariant="$body3"
            />
          </Flex>
          <Flex row justifyContent="flex-end" minWidth={PERCENT_COLUMN_WIDTH}>
            <RelativeChange
              shouldAnimate
              arrowSize="$icon.12"
              change={percentChange}
              semanticColor={semanticPercentColor}
              variant="body3"
            />
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}
