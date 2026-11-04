import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useEvent } from 'utilities/src/react/hooks'
import type { MarginMarket } from '~/constants/margin'
import { getMarginPairLogoProps } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { formatMaxLeverage, scaledE18ToNumber } from '~/features/margin/utils/marginFormat'
import { marginPairGroupLabel } from '~/features/margin/utils/marginTokenDisplay'
import { useMarginStats24h } from '~/pages/Swap/Margin/chart/useMarginChartData'
import {
  CHANGE_COL_WIDTH,
  columnGap,
  COMPACT_PRICE_COL_WIDTH,
  HeaderCell,
  MARK_PRICE_COL_WIDTH,
  MAX_LEV_COL_WIDTH,
  PAIR_LOGO_SIZE,
  PriceCells,
  ROW_PADDING_X,
} from '~/pages/Swap/Margin/components/MarginMarketSelectorCells'
import { marginPairMaxLeverage, type MarginPairRowData } from '~/pages/Swap/Margin/marginPairVenueList'

const PAIR_ROW_HEIGHT = 56

// Mark and 24h change for one pair, from the same sources as the chart header and stats row: the live
// price first, then the markets feed's oracle mark ('0' when it has no oracle, which is no price).
function useMarginPairPriceStats(market: MarginMarket): { mark?: number; changePct?: number } {
  const { getLive } = useMarginMarkets()
  const { stats24h, markPrice } = useMarginStats24h({ market })
  const live = getLive(market.key)
  const liveMark = live ? scaledE18ToNumber(live.markPriceX18) : undefined
  return {
    mark: markPrice !== undefined && markPrice > 0 ? markPrice : liveMark && liveMark > 0 ? liveMark : undefined,
    changePct: stats24h.changePct,
  }
}

export function PairColumnHeader({ compact }: { compact: boolean }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="center" px={ROW_PADDING_X} gap={columnGap(compact)} pb="$spacing4">
      <Flex fill>
        <Text variant="body4" color="$neutral2">
          {t('margin.selector.columnPair')}
        </Text>
      </Flex>
      {compact ? (
        <HeaderCell label={t('margin.selector.columnMarkPrice')} width={COMPACT_PRICE_COL_WIDTH} />
      ) : (
        <>
          <HeaderCell label={t('margin.selector.columnMarkPrice')} width={MARK_PRICE_COL_WIDTH} />
          <HeaderCell label={t('margin.selector.columnChange24h')} width={CHANGE_COL_WIDTH} />
          <HeaderCell label={t('margin.selector.columnMaxLeverage')} width={MAX_LEV_COL_WIDTH} />
        </>
      )}
    </Flex>
  )
}

// Pressing a row selects only the pair; the venue is routed.
function PairRowContent({
  row,
  currencyInfos,
  mark,
  changePct,
  compact,
  onSelect,
}: {
  row: MarginPairRowData
  currencyInfos: Map<string, CurrencyInfo>
  mark?: number
  changePct?: number
  compact: boolean
  onSelect: (row: MarginPairRowData) => void
}): JSX.Element {
  const { t } = useTranslation()
  const maxLeverage = formatMaxLeverage(marginPairMaxLeverage(row))
  const onPress = useEvent(() => onSelect(row))
  return (
    <TouchableArea
      row
      alignItems="center"
      height={PAIR_ROW_HEIGHT}
      px={ROW_PADDING_X}
      gap={columnGap(compact)}
      borderRadius="$rounded12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      testID={TestID.MarginPairRow}
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing8" fill minWidth={0}>
        <SplitLogo
          orientation="stacked"
          size={PAIR_LOGO_SIZE}
          chainId={null}
          inputCurrencyInfo={null}
          outputCurrencyInfo={null}
          {...getMarginPairLogoProps({ base: row.group.base, quote: row.group.quote, currencyInfos })}
        />
        <Flex shrink minWidth={0}>
          <Text variant="body2" color="$neutral1" numberOfLines={1}>
            {marginPairGroupLabel({ group: row.group })}
          </Text>
          {compact ? (
            <Text variant="body4" color="$neutral2" numberOfLines={1}>
              {t('margin.stats.maxLeverage', { max: maxLeverage })}
            </Text>
          ) : null}
        </Flex>
      </Flex>
      <PriceCells mark={mark} changePct={changePct} compact={compact} />
      {compact ? null : (
        <Text width={MAX_LEV_COL_WIDTH} flexShrink={0} textAlign="right" variant="body3" color="$neutral1">
          {maxLeverage}
        </Text>
      )}
    </TouchableArea>
  )
}

export function MarginPairRow({
  row,
  currencyInfos,
  compact,
  onSelect,
}: {
  row: MarginPairRowData
  currencyInfos: Map<string, CurrencyInfo>
  compact: boolean
  onSelect: (row: MarginPairRowData) => void
}): JSX.Element {
  const { getPairMarket } = useMarginMarkets()
  const market = getPairMarket(row.group.pairKey)
  return market ? (
    <PricedPairRow row={row} market={market} currencyInfos={currencyInfos} compact={compact} onSelect={onSelect} />
  ) : (
    <PairRowContent row={row} currencyInfos={currencyInfos} compact={compact} onSelect={onSelect} />
  )
}

function PricedPairRow({
  market,
  ...props
}: {
  row: MarginPairRowData
  market: MarginMarket
  currencyInfos: Map<string, CurrencyInfo>
  compact: boolean
  onSelect: (row: MarginPairRowData) => void
}): JSX.Element {
  const { mark, changePct } = useMarginPairPriceStats(market)
  return <PairRowContent {...props} mark={mark} changePct={changePct} />
}
