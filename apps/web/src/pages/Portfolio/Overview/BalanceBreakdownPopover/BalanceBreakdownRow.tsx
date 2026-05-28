import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Coin } from 'ui/src/components/icons/Coin'
import { Pools } from 'ui/src/components/icons/Pools'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

const PERCENT_CHANGE_COLUMN_WIDTH = 64

const MONOSPACE_NUMERIC_STYLE = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: "'tnum' 1",
} as const

type BalanceBreakdownRowKind = 'tokens' | 'pools'

export interface BalanceBreakdownRowData {
  kind: BalanceBreakdownRowKind
  valueUSD: number
  percentChange1d: number | undefined
}

const ROW_TEST_ID_BY_KIND: Record<BalanceBreakdownRowKind, string> = {
  tokens: TestID.BalanceBreakdownRowTokens,
  pools: TestID.BalanceBreakdownRowPools,
}

export function BalanceBreakdownRow({ kind, valueUSD, percentChange1d }: BalanceBreakdownRowData): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()

  const Icon = kind === 'tokens' ? Coin : Pools
  const label =
    kind === 'tokens' ? t('portfolio.balanceBreakdown.tokenBalance') : t('portfolio.balanceBreakdown.poolsBalance')
  const formattedValue = convertFiatAmountFormatted(valueUSD, NumberType.PortfolioBalance)
  const formattedPercent = percentChange1d !== undefined ? formatPercent(Math.abs(percentChange1d)) : '-'

  return (
    <Flex row alignItems="center" gap="$spacing8" width="100%" aria-label={label} testID={ROW_TEST_ID_BY_KIND[kind]}>
      <Icon size={iconSizes.icon20} color="$neutral2" />
      <Text
        variant="body3"
        color="$neutral1"
        flex={1}
        minWidth={0}
        numberOfLines={1}
        style={MONOSPACE_NUMERIC_STYLE}
        {...EllipsisTamaguiStyle}
      >
        {formattedValue}
      </Text>
      <Flex
        row
        alignItems="center"
        gap="$spacing4"
        justifyContent="flex-end"
        pl="$spacing8"
        width={PERCENT_CHANGE_COLUMN_WIDTH}
      >
        {percentChange1d !== undefined && (
          <DeltaArrow delta={percentChange1d} formattedDelta={formattedPercent} size={12} />
        )}
        <Text variant="body3" color="$neutral2" style={MONOSPACE_NUMERIC_STYLE}>
          {formattedPercent}
        </Text>
      </Flex>
    </Flex>
  )
}
