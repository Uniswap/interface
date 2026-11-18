import { Flex, Text, Tooltip, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { InfoBadge, infoBadgePlacement } from '~/components/Badge/InfoBadge'
import type { MarginMarket } from '~/constants/margin'
import { getMarginPairLogoProps } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import {
  formatBorrowRate,
  formatMarginDebtUnits,
  formatMaxLeverage,
  marginVenueLabel,
  scaledE18ToNumber,
} from '~/features/margin/utils/marginFormat'
import { marginPairGroupLabel, marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import { useMarginStats24h } from '~/pages/Swap/Margin/chart/useMarginChartData'
import {
  CHANGE_COL_WIDTH,
  columnGap,
  COMPACT_PRICE_COL_WIDTH,
  FigureCell,
  HeaderCell,
  LOWEST_RATE_COL_WIDTH,
  MARK_PRICE_COL_WIDTH,
  MAX_LEV_COL_WIDTH,
  MAX_LIQUIDITY_COL_WIDTH,
  PAIR_LOGO_SIZE,
  PriceCells,
  ROW_PADDING_X,
} from '~/pages/Swap/Margin/components/MarginMarketSelectorCells'
import {
  marginPairDeepestVenue,
  marginPairLowestBorrowRateBps,
  marginPairMaxLeverage,
  type MarginPairRowData,
} from '~/pages/Swap/Margin/marginPairVenueList'

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
          <HeaderCell label={t('margin.selector.columnLowestRate')} width={LOWEST_RATE_COL_WIDTH} />
          <HeaderCell label={t('margin.selector.columnMaxLiquidity')} width={MAX_LIQUIDITY_COL_WIDTH} />
          <HeaderCell label={t('margin.selector.columnMarkPrice')} width={MARK_PRICE_COL_WIDTH} />
          <HeaderCell label={t('margin.selector.columnChange24h')} width={CHANGE_COL_WIDTH} />
        </>
      )}
      <HeaderCell label={t('margin.selector.columnMaxLeverage')} width={MAX_LEV_COL_WIDTH} />
    </Flex>
  )
}

// "2 markets · Long · Short" as the pools fee-tier chips: the pair's distinct venues, then the sides it
// trades. Hovering lists each venue's borrow rate per side, venues sorted by id: a group's pairs are
// ordered by live rate, which would reshuffle on every poll.
function PairSides({ sides }: { sides: MarginPairRowData[] }): JSX.Element {
  const { t } = useTranslation()
  const sideLabel = ({ group }: MarginPairRowData): string =>
    group.direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')
  const venues = [...new Set(sides.flatMap((side) => side.venues.map((pair) => pair.venue)))].sort()
  const labels = [t('margin.selector.marketCount', { count: venues.length }), ...sides.map(sideLabel)]
  return (
    <Tooltip placement="bottom-start" delay={{ open: 200, close: 0 }}>
      <Tooltip.Trigger>
        <Flex row gap="$spacing2" testID={TestID.MarginPairSides}>
          {labels.map((label, index) => (
            <InfoBadge key={label} size="small" placement={infoBadgePlacement(index, labels.length)}>
              {label}
            </InfoBadge>
          ))}
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        <Flex gap="$spacing4">
          <Text variant="body4" color="$neutral2">
            {t('margin.route.column.borrowRate')}
          </Text>
          {venues.map((venue) => (
            <Flex key={venue} row justifyContent="space-between" gap="$spacing16">
              <Text variant="body4">{marginVenueLabel(venue)}</Text>
              <Text variant="body4">
                {sides
                  .flatMap((side) => {
                    const pair = side.venues.find((candidate) => candidate.venue === venue)
                    return pair ? [`${sideLabel(side)} ${formatBorrowRate(pair.borrowRateBps)}`] : []
                  })
                  .join(' · ')}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Tooltip.Content>
    </Tooltip>
  )
}

// One row per pair, both sides folded in. `row` is the side a press selects; the venue is routed.
function PairRowContent({
  row,
  sides,
  currencyInfos,
  mark,
  changePct,
  compact,
  onSelect,
}: {
  row: MarginPairRowData
  sides: MarginPairRowData[]
  currencyInfos: Map<string, CurrencyInfo>
  mark?: number
  changePct?: number
  compact: boolean
  onSelect: (row: MarginPairRowData) => void
}): JSX.Element {
  const locale = useCurrentLocale()
  const maxLeverage = formatMaxLeverage(marginPairMaxLeverage(row))
  const deepest = marginPairDeepestVenue(row)
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
        <Flex shrink minWidth={0} gap="$spacing2">
          <Text variant="body2" color="$neutral1" numberOfLines={1}>
            {marginPairGroupLabel({ group: row.group })}
          </Text>
          <PairSides sides={sides} />
        </Flex>
      </Flex>
      {compact
        ? null
        : [
            <FigureCell
              key="rate"
              value={formatBorrowRate(marginPairLowestBorrowRateBps(row))}
              width={LOWEST_RATE_COL_WIDTH}
            />,
            <FigureCell
              key="liquidity"
              value={
                deepest?.availableBorrowLiquidity === undefined
                  ? '—'
                  : formatMarginDebtUnits({
                      raw: deepest.availableBorrowLiquidity,
                      decimals: deepest.debt.decimals,
                      symbol: marginUnwrapSymbol(deepest.debt),
                      locale,
                    })
              }
              width={MAX_LIQUIDITY_COL_WIDTH}
            />,
          ]}
      <PriceCells mark={mark} changePct={changePct} compact={compact} />
      <FigureCell value={maxLeverage} width={MAX_LEV_COL_WIDTH} />
    </TouchableArea>
  )
}

export function MarginPairRow({
  row,
  sides,
  currencyInfos,
  compact,
  onSelect,
}: {
  row: MarginPairRowData
  sides: MarginPairRowData[]
  currencyInfos: Map<string, CurrencyInfo>
  compact: boolean
  onSelect: (row: MarginPairRowData) => void
}): JSX.Element {
  const { getPairMarket } = useMarginMarkets()
  const market = getPairMarket(row.group.pairKey)
  return market ? (
    <PricedPairRow
      row={row}
      sides={sides}
      market={market}
      currencyInfos={currencyInfos}
      compact={compact}
      onSelect={onSelect}
    />
  ) : (
    <PairRowContent row={row} sides={sides} currencyInfos={currencyInfos} compact={compact} onSelect={onSelect} />
  )
}

function PricedPairRow({
  market,
  ...props
}: {
  row: MarginPairRowData
  sides: MarginPairRowData[]
  market: MarginMarket
  currencyInfos: Map<string, CurrencyInfo>
  compact: boolean
  onSelect: (row: MarginPairRowData) => void
}): JSX.Element {
  const { mark, changePct } = useMarginPairPriceStats(market)
  return <PairRowContent {...props} mark={mark} changePct={changePct} />
}
