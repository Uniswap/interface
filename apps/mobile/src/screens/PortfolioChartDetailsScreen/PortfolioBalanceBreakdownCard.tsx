import { useTranslation } from 'react-i18next'
import { type TextStyle } from 'react-native'
import { type BreakdownCardProps } from 'src/screens/PortfolioChartDetailsScreen/getBreakdownCardProps'
import { Flex, Text } from 'ui/src'
import { Coin } from 'ui/src/components/icons/Coin'
import { Pools } from 'ui/src/components/icons/Pools'
import { iconSizes } from 'ui/src/theme'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'

const PERCENT_COLUMN_WIDTH = 56

// Tabular figures keep the value and percent columns from shifting as digits change while scrubbing.
const TABULAR_NUMS_STYLE: TextStyle = { fontVariant: ['tabular-nums'] }

export function PortfolioBalanceBreakdownCard({
  tokens,
  pools,
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
  ]

  return (
    <Flex alignSelf="flex-start" alignItems="stretch" gap="$spacing4" pt="$spacing12">
      {rows.map(({ Icon, label, testID, valueUSD, percentChange }) => (
        <Flex key={testID} row alignItems="center" gap="$spacing12" accessibilityLabel={label} testID={testID}>
          <Flex row grow shrink minWidth={0} alignItems="center" gap="$spacing8">
            <Icon color="$neutral2" size={iconSizes.icon16} />
            <Text color="$neutral1" numberOfLines={1} style={TABULAR_NUMS_STYLE} variant="body3">
              {convertFiatAmountFormatted(valueUSD, NumberType.PortfolioBalance)}
            </Text>
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
