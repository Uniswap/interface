import { useQuery } from '@tanstack/react-query'
import { Flex, Text } from '@universe/mycelium'
import { type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { type MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { marginPositionActivityQueryOptions } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { Cell } from '~/components/Table/Cell'
import { CellContainer } from '~/components/Table/styled'
import { type MarginMarket } from '~/constants/margin'
import { MarginVenueLogo } from '~/features/margin/components/MarginVenueLogo'
import { useResolveMarginMarketForPosition } from '~/features/margin/hooks/useResolveMarginMarket'
import {
  CAUTION_MIN_HF,
  formatBorrowRate,
  formatLeverageX,
  lltvToPercent,
  marginVenueLabel,
  rawToNumber,
  scaledE18ToNumber,
} from '~/features/margin/utils/marginFormat'
import { marginLeverageAtOpen, marginPositionDebt } from '~/features/margin/utils/marginPositionRow'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import { MARGIN_ACTIVE_COLUMN } from '~/pages/Swap/Margin/marginTableConstants'

// One table column as the row above it lays it out, so the drawer's figures sit under that row's.
export interface MarginDrawerColumn {
  id: string
  style: CSSProperties
}

type DrawerAlign = 'flex-start' | 'flex-end'

// Borrowing is wider than the mark/entry column, so it takes the empty PnL column beside it as one slot:
// summed widths and summed grow give the pair the same span the row's two cells occupy, and the figure
// wraps inside it rather than running into the column after. Unmerged where a width is not a number.
function spanBorrowingColumns(columns: MarginDrawerColumn[]): MarginDrawerColumn[] {
  const index = columns.findIndex((column) => column.id === MARGIN_ACTIVE_COLUMN.markEntry)
  const markEntry = columns[index]
  const pnl = columns.at(index + 1)
  if (
    index < 0 ||
    pnl?.id !== MARGIN_ACTIVE_COLUMN.pnl ||
    typeof markEntry.style.width !== 'number' ||
    typeof pnl.style.width !== 'number'
  ) {
    return columns
  }
  const grow = (column: MarginDrawerColumn): number => Number(column.style.flexGrow ?? 1)
  const spanned: MarginDrawerColumn = {
    id: markEntry.id,
    style: {
      ...markEntry.style,
      width: markEntry.style.width + pnl.style.width,
      flexGrow: grow(markEntry) + grow(pnl),
    },
  }
  return [...columns.slice(0, index), spanned, ...columns.slice(index + 2)]
}

// The position's partial decreases, read off its lifecycle events. Fetched only while the drawer is open;
// a failed or absent read leaves the lines out and the rest of the drawer as it is.
function DecreaseActivityLines({
  position,
  market,
}: {
  position: MarginActivePosition
  market: MarginMarket
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const { data: activity } = useQuery(marginPositionActivityQueryOptions(position.activityId))
  const decreases = (activity ?? []).flatMap(({ kind, txHash, debtRepaid, collateralSold, price }) =>
    kind === 'MARGIN_ACTIVITY_KIND_DECREASE' && debtRepaid !== undefined && collateralSold !== undefined
      ? [{ txHash, debtRepaid, collateralSold, price }]
      : [],
  )
  if (decreases.length === 0) {
    return null
  }
  return (
    <Flex gap="$spacing4">
      {decreases.map((decrease) => (
        <Text key={decrease.txHash} variant="body4" color="$neutral2">
          {t('margin.drawer.reducedActivity', {
            debt: `${formatNumberOrString({
              value: rawToNumber({ raw: decrease.debtRepaid, decimals: market.debt.decimals }),
              type: NumberType.TokenNonTx,
            })} ${marginUnwrapSymbol(market.debt)}`,
            collateral: `${formatNumberOrString({
              value: rawToNumber({ raw: decrease.collateralSold, decimals: market.collateral.decimals }),
              type: NumberType.TokenNonTx,
            })} ${market.displaySymbol}`,
            price: decrease.price
              ? formatNumberOrString({
                  value: scaledE18ToNumber(decrease.price),
                  type: NumberType.FiatTokenPrice,
                })
              : '—',
          })}
        </Text>
      ))}
    </Flex>
  )
}

// A $neutral2 label over its value. A string value gets the default style; a node renders as-is.
function DrawerFigure({ label, value, align }: { label: string; value: ReactNode; align: DrawerAlign }): JSX.Element {
  return (
    // A start-aligned figure (Borrowing) shrinks to its slot so its value wraps instead of being clipped;
    // the end-aligned ones keep their natural width, as the row's own cells do.
    <Flex gap="$spacing2" alignItems={align} flexShrink={align === 'flex-start' ? 1 : 0} minWidth={0}>
      <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="body3" color="$neutral1">
          {value}
        </Text>
      ) : (
        value
      )}
    </Flex>
  )
}

// What the debt is and where it sits: amount, venue (with its LLTV) and the borrow rate.
function BorrowingValue({ position, market }: { position: MarginActivePosition; market: MarginMarket }): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const debt = rawToNumber({ raw: marginPositionDebt(position), decimals: market.debt.decimals })
  const lltvPercent = lltvToPercent(market.lltvWad)
  return (
    <Flex row flexWrap="wrap" alignItems="center" gap="$spacing6" maxWidth="100%">
      <Text variant="body3" color="$neutral1" whiteSpace="nowrap">
        {`${formatNumberOrString({ value: debt, type: NumberType.TokenNonTx })} ${marginUnwrapSymbol(market.debt)}`}
      </Text>
      <MarginVenueLogo venue={market.venue} size="$icon.16" />
      <Text variant="body3" color="$neutral1" whiteSpace="nowrap">
        {lltvPercent > 0
          ? t('margin.market.venueLltv', { venue: marginVenueLabel(market.venue), lltv: Math.round(lltvPercent) })
          : marginVenueLabel(market.venue)}
      </Text>
      {position.borrowRate === undefined ? null : (
        <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
          {formatBorrowRate(scaledE18ToNumber(position.borrowRate) * 10_000)}
        </Text>
      )}
    </Flex>
  )
}

// The expanded content under a position row: the lending figures laid out under the row's own columns
// (borrowing under mark/entry and PnL, interest under the liquidation price, leverage at open under
// margin), then any partial-decrease activity.
export function MarginPositionDrawer({
  position,
  columns,
}: {
  position: MarginActivePosition
  columns: MarginDrawerColumn[]
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  // Live registry first, else a currency-info fallback, so a server/indexer-sourced position in a
  // market outside the registry still renders its figures (parity with the table).
  const market = useResolveMarginMarketForPosition(position)

  if (!market) {
    return (
      <Flex px="$spacing12" pb="$spacing16" backgroundColor="$surface1">
        <Text variant="body3" color="$neutral2">
          {t('margin.market.empty')}
        </Text>
      </Flex>
    )
  }

  const hasDebt = BigInt(marginPositionDebt(position)) !== 0n
  const nearLiquidation = hasDebt && scaledE18ToNumber(position.healthFactor) < CAUTION_MIN_HF
  const interestAccrued =
    position.accruedInterest === undefined
      ? '—'
      : `${formatNumberOrString({
          value: rawToNumber({ raw: position.accruedInterest, decimals: market.debt.decimals }),
          type: NumberType.TokenNonTx,
        })} ${marginUnwrapSymbol(market.debt)}`
  const leverageAtOpen = marginLeverageAtOpen(position)

  const figureFor = (columnId: string): { figure: JSX.Element; align: DrawerAlign } | undefined => {
    switch (columnId) {
      case MARGIN_ACTIVE_COLUMN.markEntry:
        return {
          figure: (
            <DrawerFigure
              label={t('margin.size.borrowing')}
              value={<BorrowingValue position={position} market={market} />}
              align="flex-start"
            />
          ),
          align: 'flex-start',
        }
      case MARGIN_ACTIVE_COLUMN.liqPrice:
        return {
          figure: <DrawerFigure label={t('margin.drawer.interestAccrued')} value={interestAccrued} align="flex-end" />,
          align: 'flex-end',
        }
      case MARGIN_ACTIVE_COLUMN.margin:
        return {
          figure: (
            <DrawerFigure
              label={t('margin.drawer.openedLeverage')}
              value={leverageAtOpen === undefined ? '—' : formatLeverageX(leverageAtOpen)}
              align="flex-end"
            />
          ),
          align: 'flex-end',
        }
      default:
        return undefined
    }
  }

  return (
    <Flex pb="$spacing8" backgroundColor="$surface1">
      {nearLiquidation ? (
        <Flex mx="$spacing12" p="$spacing8" borderRadius="$rounded12" backgroundColor="$statusCritical2">
          <Text variant="body4" color="$statusCritical">
            {t('margin.warning.nearLiquidation')}
          </Text>
        </Flex>
      ) : null}
      <Flex row width="100%">
        {spanBorrowingColumns(columns).map((column) => {
          const slot = figureFor(column.id)
          return (
            <CellContainer key={column.id} style={column.style}>
              <Cell py="$spacing8" alignItems="flex-start" justifyContent={slot?.align ?? 'flex-end'}>
                {slot?.figure}
              </Cell>
            </CellContainer>
          )
        })}
      </Flex>
      <Flex px="$spacing12">
        <DecreaseActivityLines position={position} market={market} />
      </Flex>
    </Flex>
  )
}
