import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { type BreakdownCardProps } from 'src/screens/PortfolioChartDetailsScreen/getBreakdownCardProps'
import { Flex } from 'ui/src'
import { Coin } from 'ui/src/components/icons/Coin'
import { Pools } from 'ui/src/components/icons/Pools'
import { iconSizes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'

const PERCENT_COLUMN_WIDTH = 56

export function PortfolioBalanceBreakdownCard({
  tokens,
  pools,
  semanticPercentColor,
}: BreakdownCardProps): JSX.Element {
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
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
  ]

  return (
    <Flex alignSelf="flex-start" alignItems="stretch" gap="$spacing4" pt="$spacing12">
      {rows.map(({ Icon, label, testID, valueUSD, percentChange }) => (
        <Flex key={testID} row alignItems="center" gap="$spacing12" accessibilityLabel={label} testID={testID}>
          <Flex row grow shrink minWidth={0} alignItems="center" gap="$spacing8">
            <Icon color="$neutral2" size={iconSizes.icon16} />
            <AnimatedNumber
              numericValue={valueUSD ?? undefined}
              value={convertFiatAmountFormatted(valueUSD, NumberType.PortfolioBalance)}
              textVariant="$body3"
              disableAnimations={!isDataLivelinessEnabled}
            />
          </Flex>
          <Flex row justifyContent="flex-end" minWidth={PERCENT_COLUMN_WIDTH}>
            <RelativeChange
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
