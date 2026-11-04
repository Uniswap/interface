import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { NumberType } from 'utilities/src/format/types'
import type { MarginMarket } from '~/constants/margin'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { scaledE18ToNumber } from '~/features/margin/utils/marginFormat'
import { useMarginStats24h } from '~/pages/Swap/Margin/chart/useMarginChartData'

enum MarginMarketStat {
  Mark = 'mark',
  High24h = 'high24h',
  Low24h = 'low24h',
}

/**
 * Mark / 24H high / 24H low for the form's market, in three equal columns split by hairlines: the
 * chart header's figures for a layout that shows no chart until asked. Same sources as that header,
 * so the two never disagree.
 */
export function MarginMarketStatsRow(): JSX.Element | null {
  const pairKey = useMarginFormStore((s) => s.pairKey)
  const { getPairMarket, markets } = useMarginMarkets()
  const market = getPairMarket(pairKey) ?? markets.at(0)
  // The form renders its own markets loading/error state; there is nothing to quote without a market.
  if (!market) {
    return null
  }
  return <MarginMarketStatsRowBody market={market} />
}

function MarginMarketStatsRowBody({ market }: { market: MarginMarket }): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { getLive } = useMarginMarkets()
  const { stats24h, markPrice } = useMarginStats24h({ market })
  // As in the chart header: the live price first, then the markets feed's oracle mark ('0' when the
  // feed has no oracle for the market, which is no price at all).
  const live = getLive(market.key)
  const liveMark = live ? scaledE18ToNumber(live.markPriceX18) : undefined
  const mark = markPrice !== undefined && markPrice > 0 ? markPrice : liveMark && liveMark > 0 ? liveMark : undefined
  const price = (value: number | undefined): string =>
    value === undefined ? '—' : convertFiatAmountFormatted(value, NumberType.FiatTokenPrice)

  const columns = [
    { key: MarginMarketStat.Mark, label: t('margin.stats.label.mark'), value: price(mark) },
    { key: MarginMarketStat.High24h, label: t('margin.stats.label.high24h'), value: price(stats24h.high) },
    { key: MarginMarketStat.Low24h, label: t('margin.stats.label.low24h'), value: price(stats24h.low) },
  ]
  return (
    <Flex row alignItems="stretch" px="$spacing4" testID={TestID.MarginMarketStatsRow}>
      {columns.map((column, index) => (
        <Fragment key={column.key}>
          {index > 0 ? <Flex width={1} backgroundColor="$surface3" mx="$spacing12" /> : null}
          <Flex flex={1} minWidth={0} gap="$spacing2">
            <Text variant="body4" color="$neutral2" numberOfLines={1}>
              {column.label}
            </Text>
            <Text variant="body3" color="$neutral1" numberOfLines={1}>
              {column.value}
            </Text>
          </Flex>
        </Fragment>
      ))}
    </Flex>
  )
}
