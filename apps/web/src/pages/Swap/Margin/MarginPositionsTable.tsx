import { createColumnHelper, type Row } from '@tanstack/react-table'
import { Button, Flex as MyceliumFlex, SpinningLoader, iconSizes } from '@universe/mycelium'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { TestID } from '@universe/test'
import type { TFunction } from 'i18next'
import { memo, type ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import {
  MARGIN_ACTIVE_POSITION_STATUSES,
  MARGIN_TERMINAL_POSITION_STATUSES,
  type MarginActivePosition,
  type MarginPlanIntent,
  type MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginPositionsInfiniteQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { MarginDirection, type MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
/* oxlint-disable max-lines */
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { HeaderCell } from '~/components/Table/styled'
import type { RenderUnifiedExpandableRow } from '~/components/Table/types'
import { getColumnSizingStyles } from '~/components/Table/utils/getColumnSizingStyles'
import { hasRow } from '~/components/Table/utils/hasRow'
import { useAccount } from '~/connection/hooks/useAccount'
import { MARGIN_CHAIN_ID, MARGIN_POSITIONS_REFETCH_MS, type MarginMarket } from '~/constants/margin'
import { getMarginPairLogoProps, useMarginCurrencyInfos } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { type MarginMarketResolver, useResolveMarginMarket } from '~/features/margin/hooks/useResolveMarginMarket'
import {
  formatLeverage,
  formatLiqDistanceSuffix,
  formatSignedFiat,
  getMarginDirectionStyle,
  getMarginHealthStatus,
  getMarginLiquidationBadge,
  liqDistanceSignedPct,
  rawToNumber,
  scaledE18ToNumber,
} from '~/features/margin/utils/marginFormat'
import {
  isShortCollateral,
  type MarginAmountLeg,
  marginAmountLabel,
  resolveMarketForPosition,
} from '~/features/margin/utils/marginPositionDisplay'
import {
  hasMarginOpenedAt,
  hasMarginPositionBasis,
  isMarginActivePosition,
  isMarginTerminalPosition,
  marginCurrentLeverage,
  marginPositionDebt,
  marginPositionTokens,
} from '~/features/margin/utils/marginPositionRow'
import { marginFallbackPairLabel, marginPairLabel, marginPairLegs } from '~/features/margin/utils/marginTokenDisplay'
import { MarginActionModals } from '~/pages/Swap/Margin/components/MarginActionModals'
import { MarginPositionActionsMenu } from '~/pages/Swap/Margin/components/MarginPositionActionsMenu'
import {
  MarginPositionCard,
  type MarginPositionCardMetric,
  MarginPositionCardSkeletons,
} from '~/pages/Swap/Margin/components/MarginPositionCard'
import { type MarginDrawerColumn, MarginPositionDrawer } from '~/pages/Swap/Margin/components/MarginPositionDrawer'
import type { MarginPositionSheetArgs } from '~/pages/Swap/Margin/components/MarginPositionSheet'
import {
  MarginExplainerContent,
  MarginExplainerTooltip,
  useMarginPnlCopy,
} from '~/pages/Swap/Margin/components/shared/MarginExplainer'
import { MarginLiquidationPill } from '~/pages/Swap/Margin/components/shared/MarginLiquidationPill'
import { useMarginPlanExecution } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import { useExecuteMarginPlan } from '~/pages/Swap/Margin/hooks/useExecuteMarginPlan'
import { buildMarginActiveRows, type MarginTableRow } from '~/pages/Swap/Margin/marginActiveRows'
import { useMarginMorph } from '~/pages/Swap/Margin/MarginMorphContext'
import { buildMarginRealizedLines } from '~/pages/Swap/Margin/marginPnlExplainer'
import { formatAge } from '~/pages/Swap/Margin/marginPositionsMath'
import { MARGIN_ACTIVE_COLUMN, MARGIN_TABLE_ROW_HEIGHT } from '~/pages/Swap/Margin/marginTableConstants'
import { marginPositionMark, marginRawUsdToNumber } from '~/pages/Swap/Margin/marginUsdPnl'

const LOADING_ROWS = 3

type MarginTableTab = 'active' | 'completed'
// `cards` re-flows each row into a card for phone widths, where the table's columns cannot fit; a tapped
// card opens `renderPositionSheet` rather than an inline drawer. The sheet is a render prop because it
// carries the chart, which this module (also in desktop's bundle) must not import.
type MarginPositionsTableProps =
  | { layout?: 'table' }
  | { layout: 'cards'; renderPositionSheet: (args: MarginPositionSheetArgs) => JSX.Element }
type CellAlign = 'flex-start' | 'flex-end'
// Which management modal a row's menu requests; positionId keys the (freshest) position object.
type MarginModalRequest = { action: MarginManageAction; positionId: string }

// Position rows expand to a single synthetic 'drawer' sub-row; renderUnifiedExpandableRow renders the
// editors in its place (the sub-row is never drawn as a real table row) — this only makes the row expandable.
function getMarginTableSubRows(row: MarginTableRow): MarginTableRow[] | undefined {
  return row.kind === 'position' ? [{ kind: 'drawer', position: row.position }] : undefined
}

function inFlightIntentLabel({ intent, t }: { intent: MarginPlanIntent; t: TFunction }): string {
  switch (intent) {
    case 'OPEN':
      return t('margin.table.opening')
    case 'CLOSE':
      return t('margin.table.closing')
    case 'ADJUST':
      return t('margin.plan.title.adjust')
    default:
      return intent
  }
}

function PairIdentity({
  market,
  fallbackTokens,
  currencyInfos,
  subtitle,
  trailing,
}: {
  market: MarginMarket | undefined
  fallbackTokens: { collateralToken: string; debtToken: string }
  currencyInfos: Map<string, CurrencyInfo>
  subtitle?: ReactNode
  trailing?: JSX.Element
}): JSX.Element {
  // An unresolvable market costs the LOGO and the resolved pair label, and nothing else: `subtitle`
  // (direction + leverage) and `trailing` (the liquidation pill) are composed by the caller from the
  // ROW, so dropping them here would silently discard data the row still has — on the Closed tab,
  // which carries no status column, that turns a liquidation into an ordinary close.
  return (
    <Flex row alignItems="center" gap="$gap8">
      {market ? (
        <SplitLogo
          orientation="stacked"
          size={28}
          chainId={MARGIN_CHAIN_ID}
          inputCurrencyInfo={null}
          outputCurrencyInfo={null}
          {...getMarginPairLogoProps({ ...marginPairLegs(market), currencyInfos })}
        />
      ) : null}
      <Flex>
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body3" color="$neutral1">
            {market ? marginPairLabel({ market }) : marginFallbackPairLabel({ ...fallbackTokens, currencyInfos })}
          </Text>
          {trailing}
        </Flex>
        {typeof subtitle === 'string' ? (
          <Text variant="body4" color="$neutral2">
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </Flex>
    </Flex>
  )
}

const PairCell = memo(function PairCell({
  row,
  currencyInfos,
  resolveMarket,
}: {
  row: MarginTableRow
  currencyInfos: Map<string, CurrencyInfo>
  resolveMarket: MarginMarketResolver
}): JSX.Element {
  const { t } = useTranslation()

  if (row.kind === 'inFlight') {
    return (
      <Flex row alignItems="center" gap="$gap8">
        <SpinningLoader size={iconSizes.icon16} color="$accent1" />
        <Text variant="body3" color="$neutral1">
          {inFlightIntentLabel({ intent: row.intent, t })} ({row.stepLabel})
        </Text>
      </Flex>
    )
  }

  const { position } = row
  const market = resolveMarketForPosition({ position, resolveMarket })
  const direction = position.direction
  const directionStyle = getMarginDirectionStyle(direction)
  const directionLabel = direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')
  // A still-open position that was liquidated is only partially liquidated (collateral remains).
  const liquidationBadge = getMarginLiquidationBadge({ liquidated: position.liquidated, status: 'open' })
  const leverage = marginCurrentLeverage(position)
  return (
    <PairIdentity
      market={market}
      fallbackTokens={marginPositionTokens(position)}
      currencyInfos={currencyInfos}
      // Direction + CURRENT leverage, so an adjusted position reads what it holds now; leverage at open
      // lives in the drawer.
      subtitle={
        <Text variant="body4" color={directionStyle.color}>
          {leverage === undefined ? directionLabel : `${directionLabel} ${formatLeverage(leverage)}`}
        </Text>
      }
      trailing={liquidationBadge ? <MarginLiquidationPill badge={liquidationBadge} /> : undefined}
    />
  )
})

// The USD value of a raw wire amount. The volatile leg is priced at the position's own mark (the volatile
// leg's USD price for either direction); a SHORT's collateral is the stable leg, so it is its own dollar
// figure. undefined where there is no honest dollar figure: an untradable pair has no USD leg, and the
// wire's '0' mark is no price at all.
function marginAmountUsd({
  raw,
  leg = 'exposure',
  position,
}: {
  raw: string
  leg?: MarginAmountLeg
  position: MarginActivePosition
}): number | undefined {
  if (position.isTradable === false) {
    return undefined
  }
  if (isShortCollateral({ position, leg })) {
    const value = rawToNumber({ raw, decimals: position.counterToken.decimals })
    return Number.isFinite(value) ? value : undefined
  }
  const mark = marginPositionMark({ position })
  if (mark === undefined) {
    return undefined
  }
  const value = rawToNumber({ raw, decimals: position.exposureToken.decimals })
  return Number.isFinite(value) ? value * mark : undefined
}

// A token figure over its dollar value, the shape the Size and Margin columns share. The dollar line drops
// out on its own where marginAmountUsd has nothing honest to say.
function AmountFigure({
  label,
  usd,
  align,
}: {
  label: string
  usd: number | undefined
  align: CellAlign
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  return (
    <Flex alignItems={align}>
      <Text variant="body3" color="$neutral1">
        {label}
      </Text>
      {usd === undefined ? null : (
        <Text variant="body4" color="$neutral2">
          {formatNumberOrString({ value: usd, type: NumberType.FiatStandard })}
        </Text>
      )}
    </Flex>
  )
}

const SizeCell = memo(function SizeCell({
  position,
  resolveMarket,
  currencyInfos,
  align = 'flex-end',
}: {
  position: MarginActivePosition
  resolveMarket: MarginMarketResolver
  currencyInfos: Map<string, CurrencyInfo>
  align?: CellAlign
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const market = resolveMarketForPosition({ position, resolveMarket })
  return (
    <AmountFigure
      label={marginAmountLabel({ raw: position.size, position, market, currencyInfos, formatNumberOrString })}
      usd={marginAmountUsd({ raw: position.size, position })}
      align={align}
    />
  )
})

// Mark over entry: where the price is NOW leads, what the position committed to trails as the muted
// sub-line. The entry line keeps its explainer tooltip.
const MarkEntryCell = memo(function MarkEntryCell({ position }: { position: MarginActivePosition }): JSX.Element {
  const copy = useMarginPnlCopy()
  const { formatNumberOrString } = useLocalizationContext()
  // An untradable pair has no single USD leg, so both prices are quoted against a leg that is not USD.
  if (position.isTradable === false) {
    return (
      <Text variant="body3" color="$neutral1">
        —
      </Text>
    )
  }
  const price = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatTokenPrice })
  // '0' is the wire's "no figure", not a price of zero — the same sentinel the PnL and margin cells
  // suppress on.
  const mark = marginPositionMark({ position })
  const entry = hasMarginPositionBasis(position) ? scaledE18ToNumber(position.entryPrice) : undefined
  return (
    <Flex alignItems="flex-start">
      <Text variant="body3" color="$neutral1">
        {mark === undefined ? '—' : price(mark)}
      </Text>
      {entry === undefined || entry <= 0 ? (
        <Text variant="body4" color="$neutral2">
          —
        </Text>
      ) : (
        <MarginExplainerTooltip
          content={
            <Text variant="body4" color="$neutral2" maxWidth={326}>
              {copy.entryPrice}
            </Text>
          }
        >
          <Text variant="body4" color="$neutral2" testID={TestID.MarginEntryPriceTrigger}>
            {price(entry)}
          </Text>
        </MarginExplainerTooltip>
      )}
    </Flex>
  )
})

// Liquidation price over its signed distance from the mark. Healthy positions read neutral; caution and
// at-risk color the whole cell in the tier color and add a warning icon beside the distance (an icon, not
// the labeled health pill, which clips at this column width).
const LiqPriceCell = memo(function LiqPriceCell({
  position,
  align = 'flex-end',
}: {
  position: MarginActivePosition
  align?: CellAlign
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  // Backend reports HF = 0 / liq price = 0 for a debt-free position — there is no liquidation to show.
  const hasDebt = BigInt(marginPositionDebt(position)) !== 0n
  const liqPriceRaw = scaledE18ToNumber(position.liquidationPrice)
  const liqPrice = liqPriceRaw > 0 ? liqPriceRaw : undefined
  if (position.isTradable === false || !hasDebt || liqPrice === undefined) {
    return (
      <Text variant="body3" color="$neutral2">
        —
      </Text>
    )
  }
  const mark = marginPositionMark({ position })
  const healthStatus = getMarginHealthStatus(scaledE18ToNumber(position.healthFactor))
  // Signed distance from mark to liq (negative for a long: price must fall to liquidate).
  const distancePct = mark === undefined ? undefined : liqDistanceSignedPct({ liqPrice, mark })
  const isElevatedRisk = healthStatus.key !== 'healthy'
  return (
    <Flex alignItems={align}>
      <Text variant="body3" color={isElevatedRisk ? healthStatus.color : '$neutral1'}>
        {formatNumberOrString({ value: liqPrice, type: NumberType.FiatTokenPrice })}
      </Text>
      {distancePct === undefined ? null : (
        <Flex row alignItems="center" gap="$spacing4">
          {isElevatedRisk ? <AlertTriangleFilled size="$icon.12" color={healthStatus.color} /> : null}
          <Text variant="body4" color={isElevatedRisk ? healthStatus.color : '$neutral2'}>
            {formatLiqDistanceSuffix(distancePct)}
          </Text>
        </Flex>
      )}
    </Flex>
  )
})

// Unrealized PnL in the collateral token over the return on the margin deposited — both straight off the
// wire (equity − depositedEquity, and that over depositedEquity), so the arrow and the figure always agree.
const PnlCell = memo(function PnlCell({
  position,
  resolveMarket,
  currencyInfos,
  align = 'flex-end',
}: {
  position: MarginActivePosition
  resolveMarket: MarginMarketResolver
  currencyInfos: Map<string, CurrencyInfo>
  align?: CellAlign
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const market = resolveMarketForPosition({ position, resolveMarket })
  const pnl = position.unrealizedPnl === undefined ? Number.NaN : Number(position.unrealizedPnl)
  if (position.unrealizedPnl === undefined || position.unrealizedPnl === '' || !Number.isFinite(pnl)) {
    return (
      <Text variant="body3" color="$neutral1" testID={TestID.MarginPnlSuppressed}>
        —
      </Text>
    )
  }
  const color = pnl >= 0 ? '$statusSuccess' : '$statusCritical'
  const roe = position.roe === undefined ? undefined : scaledE18ToNumber(position.roe) * 100
  return (
    <Flex alignItems={align} testID={TestID.MarginPnlTrigger}>
      <Text variant="body3" color={color}>
        {marginAmountLabel({
          raw: position.unrealizedPnl,
          leg: 'collateral',
          position,
          market,
          currencyInfos,
          formatNumberOrString,
          signed: true,
        })}
      </Text>
      {/* The arrow carries the sign, so the percent shows its magnitude. */}
      {roe === undefined || !Number.isFinite(roe) ? null : (
        <Text variant="body4" color={color}>
          {`${pnl >= 0 ? '▲' : '▼'} ${Math.abs(roe).toFixed(2)}%`}
        </Text>
      )}
    </Flex>
  )
})

function HeaderText({ label }: { label: string }): JSX.Element {
  return (
    <Text variant="body3" color="$neutral2">
      {label}
    </Text>
  )
}

// The margin in the position NOW: live equity in the collateral token, over its dollar value.
const MarginEquityCell = memo(function MarginEquityCell({
  position,
  resolveMarket,
  currencyInfos,
  align = 'flex-end',
}: {
  position: MarginActivePosition
  resolveMarket: MarginMarketResolver
  currencyInfos: Map<string, CurrencyInfo>
  align?: CellAlign
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const market = resolveMarketForPosition({ position, resolveMarket })
  if (position.equity === '' || !Number.isFinite(Number(position.equity))) {
    return (
      <Text variant="body3" color="$neutral1">
        —
      </Text>
    )
  }
  return (
    <AmountFigure
      label={marginAmountLabel({
        raw: position.equity,
        leg: 'collateral',
        position,
        market,
        currencyInfos,
        formatNumberOrString,
      })}
      usd={marginAmountUsd({ raw: position.equity, leg: 'collateral', position })}
      align={align}
    />
  )
})

const HistoryPairCell = memo(function HistoryPairCell({
  row,
  currencyInfos,
  resolveMarket,
}: {
  row: MarginTerminalPosition
  currencyInfos: Map<string, CurrencyInfo>
  resolveMarket: MarginMarketResolver
}): JSX.Element {
  const { t } = useTranslation()
  const market = resolveMarketForPosition({ position: row, resolveMarket })
  const liquidationBadge = getMarginLiquidationBadge({
    liquidated: row.status === 'LIQUIDATED',
    partiallyLiquidated: row.status === 'PARTIALLY_LIQUIDATED',
    status: 'closed',
  })
  const direction = row.direction
  const directionStyle = getMarginDirectionStyle(direction)
  const directionLabel = direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')
  return (
    <PairIdentity
      market={market}
      fallbackTokens={marginPositionTokens(row)}
      currencyInfos={currencyInfos}
      subtitle={
        <Text variant="body4" color={directionStyle.color}>
          {directionLabel}
        </Text>
      }
      trailing={liquidationBadge ? <MarginLiquidationPill badge={liquidationBadge} /> : undefined}
    />
  )
})

// Realized against the ACTUAL proceeds, in USD — the same denomination the Active tab's unrealized PnL
// uses, so the two tabs of this table can be read against each other.
const HistoryPnlCell = memo(function HistoryPnlCell({
  row,
  resolveMarket,
}: {
  row: MarginTerminalPosition
  resolveMarket: MarginMarketResolver
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const market = resolveMarketForPosition({ position: row, resolveMarket })
  if (!market || row.realizedPnlUsd === undefined || row.isTradable === false) {
    return (
      <Text variant="body3" color="$neutral1">
        —
      </Text>
    )
  }
  const pnl = marginRawUsdToNumber({ raw: row.realizedPnlUsd, market, direction: row.direction })
  const fiat = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatStandard })
  return (
    <MarginExplainerTooltip
      content={<MarginExplainerContent realized={buildMarginRealizedLines({ row: { status: row.status } })} />}
    >
      <Text
        variant="body3"
        color={pnl >= 0 ? '$statusSuccess' : '$statusCritical'}
        testID={TestID.MarginRealizedTrigger}
      >
        {formatSignedFiat({ value: pnl, format: fiat })}
      </Text>
    </MarginExplainerTooltip>
  )
})

function marginClosedDateLabel({ row, locale }: { row: MarginTerminalPosition; locale: string }): string {
  return new Date(Number(row.closedAt) * 1000).toLocaleDateString(locale)
}

// Entry → exit for a closed row. Same gate the realized-PnL and current-price cells use: an untradable
// pair has no single USD leg, so both figures are quoted against something that is not dollars and must
// not reach a fiat formatter.
function marginEntryExitLabel({
  row,
  formatNumberOrString,
}: {
  row: MarginTerminalPosition
  formatNumberOrString: ReturnType<typeof useLocalizationContext>['formatNumberOrString']
}): string {
  if (row.isTradable === false) {
    return '—'
  }
  // 0 is the wire's absent sentinel (no stamped mark, or a zero-debt close that sold nothing).
  const formatPrice = (x18: string | undefined): string => {
    const price = x18 === undefined ? 0 : scaledE18ToNumber(x18)
    return price > 0 ? formatNumberOrString({ value: price, type: NumberType.FiatTokenPrice }) : '—'
  }
  return `${formatPrice(row.entryPrice)} → ${formatPrice(row.exitPrice)}`
}

// Empty tab: a column-header echo row + a rounded-outline box with the centered empty message. The
// Table renders nothing when empty, so this stands in for both the active and closed tabs.
function EmptyPositions({
  headers,
  message,
}: {
  // Omitted in the card layout, which has no columns to echo.
  headers?: { label: string; leftAlign?: boolean }[]
  message: string
}): JSX.Element {
  return (
    <Flex gap="$spacing8" width="100%">
      {headers ? (
        <Flex
          row
          px="$spacing16"
          py="$spacing12"
          gap="$spacing12"
          borderRadius="$rounded12"
          backgroundColor="$surface2"
        >
          {headers.map((headerColumn, index) => (
            <Flex
              key={headerColumn.label}
              flex={index === 0 ? 2 : 1}
              alignItems={headerColumn.leftAlign ? 'flex-start' : 'flex-end'}
            >
              <Text variant="body3" color="$neutral2">
                {headerColumn.label}
              </Text>
            </Flex>
          ))}
        </Flex>
      ) : null}
      <Flex centered py="$spacing24" borderRadius="$rounded16" borderWidth={1} borderColor="$surface3">
        <Text variant="body3" color="$neutral2">
          {message}
        </Text>
      </Flex>
    </Flex>
  )
}

export function MarginPositionsTable(props: MarginPositionsTableProps = {}): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const { formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const currencyInfos = useMarginCurrencyInfos()
  const [tab, setTab] = useState<MarginTableTab>('active')
  const { tableMaxHeight } = useMarginMorph()

  const plan = useMarginPlanExecution((s) => s.plan)
  const isModalOpen = useMarginPlanExecution((s) => s.isModalOpen)
  const isExecuting = useMarginPlanExecution((s) => s.isExecuting)
  const { resumePlan } = useExecuteMarginPlan()

  const activeQuery = useMarginPositionsInfiniteQuery({
    params: account.address
      ? { swapper: account.address, chainId: MARGIN_CHAIN_ID, statuses: MARGIN_ACTIVE_POSITION_STATUSES }
      : undefined,
    refetchInterval: MARGIN_POSITIONS_REFETCH_MS,
    // A backgrounded tab is exactly when a position drifts toward liquidation unwatched: keep polling
    // so the row is current the moment it is looked at again, not one interval behind.
    refetchIntervalInBackground: true,
  })
  // Read only while the Closed tab is open, and not polled: every close path invalidates the positions
  // key, and reopening the tab refetches a stale entry.
  const terminalQuery = useMarginPositionsInfiniteQuery({
    params:
      account.address && tab === 'completed'
        ? { swapper: account.address, chainId: MARGIN_CHAIN_ID, statuses: MARGIN_TERMINAL_POSITION_STATUSES }
        : undefined,
  })
  const visibleQuery = tab === 'active' ? activeQuery : terminalQuery
  const { data, isLoading, isError, refetch } = visibleQuery

  // The server filters by status; the guards only narrow the row type. Terminal rows arrive newest first.
  const activePositions = useMemo(
    () => activeQuery.data?.pages.flatMap((page) => page.positions).filter(isMarginActivePosition),
    [activeQuery.data],
  )
  const historyRows = useMemo(
    () => terminalQuery.data?.pages.flatMap((page) => page.positions).filter(isMarginTerminalPosition) ?? [],
    [terminalQuery.data],
  )
  const loadMore = useEvent(({ onComplete }: { onComplete?: () => void } = {}) => {
    if (visibleQuery.hasNextPage && !visibleQuery.isFetchingNextPage) {
      void visibleQuery.fetchNextPage().finally(() => onComplete?.())
    } else {
      onComplete?.()
    }
  })
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: async () => {
      await visibleQuery.fetchNextPage()
    },
    hasNextPage: visibleQuery.hasNextPage,
    isFetching: visibleQuery.isFetchingNextPage,
  })
  const resolverPositions = useMemo(() => [...(activePositions ?? []), ...historyRows], [activePositions, historyRows])
  const resolveMarket = useResolveMarginMarket({ positions: resolverPositions })

  const activeRows = useMemo<MarginTableRow[]>(
    () =>
      buildMarginActiveRows({
        positions: activePositions,
        plan,
        isModalOpen,
        isExecuting,
        t,
      }),
    [activePositions, plan, isModalOpen, isExecuting, t],
  )

  // A row menu's modal request, keyed by positionId — the only per-position identifier that
  // is always present and never shared (two positions CAN share a leg's sub-account address). The modal
  // re-resolves the LATEST position object from query data each render so it stays fresh across polls; if
  // the position disappears (closed elsewhere) the modal closes itself.
  const [activeModal, setActiveModal] = useState<MarginModalRequest | null>(null)
  const onRequestModal = useEvent((request: MarginModalRequest) => setActiveModal(request))
  const closeActiveModal = useEvent(() => setActiveModal(null))

  // Position rows expand into the drawer; a plain row-body click toggles it. When expanded, the row +
  // drawer read as one bordered container.
  const renderDrawerRow = useCallback<RenderUnifiedExpandableRow<MarginTableRow>>(
    (row, { renderTableRow, isExpanded }) => {
      if (row.original.kind !== 'position') {
        return renderTableRow()
      }
      const { position } = row.original
      const onToggleRow = (): void => row.toggleExpanded()
      const drawerColumns: MarginDrawerColumn[] = row
        .getVisibleCells()
        .map((cell) => ({ id: cell.column.id, style: getColumnSizingStyles(cell.column) }))
      return (
        // Row card + Tailwind `group` anchor: MarginPositionActionsMenu's `…` reveal binds its
        // `group-hover:` to this literal `.group` (mycelium Flex emits it from the `group` prop).
        <MyceliumFlex
          group
          width="100%"
          borderRadius="$rounded16"
          borderWidth={isExpanded ? 1 : 0}
          borderColor="$surface3"
          backgroundColor={isExpanded ? '$surface1' : undefined}
          overflow="hidden"
        >
          <TouchableArea onPress={onToggleRow}>{renderTableRow()}</TouchableArea>
          <HeightAnimator open={isExpanded} unmountChildrenWhenCollapsed>
            <MarginPositionDrawer position={position} columns={drawerColumns} />
          </HeightAnimator>
        </MyceliumFlex>
      )
    },
    [],
  )

  const onRetry = useEvent(() => {
    void refetch()
  })
  const showActiveTab = useEvent(() => setTab('active'))
  const showCompletedTab = useEvent(() => setTab('completed'))

  // Skeleton only on initial load — background refetches stay silent.
  const showLoadingSkeleton = data === undefined && isLoading

  const activeColumns = useMemo(() => {
    const columnHelper = createColumnHelper<MarginTableRow>()
    return [
      columnHelper.display({
        id: MARGIN_ACTIVE_COLUMN.pair,
        // Room for the stacked pair logo beside a "cbBTC / USDC" label.
        size: 187,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <HeaderText label={t('margin.table.position')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
            {hasRow<MarginTableRow>(info) && (
              <PairCell row={info.row.original} currencyInfos={currencyInfos} resolveMarket={resolveMarket} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: MARGIN_ACTIVE_COLUMN.markEntry,
        size: 155,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <HeaderText label={t('margin.table.markEntry')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <MarkEntryCell position={info.row.original.position} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: MARGIN_ACTIVE_COLUMN.pnl,
        size: 105,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <HeaderText label={t('margin.table.pnl')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <PnlCell
                position={info.row.original.position}
                resolveMarket={resolveMarket}
                currencyInfos={currencyInfos}
                align="flex-start"
              />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: MARGIN_ACTIVE_COLUMN.liqPrice,
        size: 120,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.table.liqPrice')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <LiqPriceCell position={info.row.original.position} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: MARGIN_ACTIVE_COLUMN.size,
        size: 100,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.positions.size')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <SizeCell
                position={info.row.original.position}
                resolveMarket={resolveMarket}
                currencyInfos={currencyInfos}
              />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: MARGIN_ACTIVE_COLUMN.margin,
        // The drawer's one-line "Leverage at open" sits under this column and needs ~93px plus the cell's
        // padding.
        size: 120,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.table.margin')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <MarginEquityCell
                position={info.row.original.position}
                resolveMarket={resolveMarket}
                currencyInfos={currencyInfos}
              />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: MARGIN_ACTIVE_COLUMN.opened,
        size: 65,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.drawer.openedAt')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <Text variant="body3" color="$neutral1">
                {hasMarginOpenedAt(info.row.original.position)
                  ? formatAge({ openedAtSeconds: Number(info.row.original.position.openedAt) })
                  : '—'}
              </Text>
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: MARGIN_ACTIVE_COLUMN.utility,
        size: 90,
        meta: { overflowVisible: true },
        header: () => <HeaderCell />,
        cell: (info) => (
          <Cell loading={showLoadingSkeleton} overflow="visible">
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <Flex row width="100%" justifyContent="flex-end" alignItems="center" gap="$spacing4">
                {/* Hidden when the market can't be resolved: every item would render enabled and each
                    click would mount then unmount a modal in the same tick. */}
                {resolveMarketForPosition({ position: info.row.original.position, resolveMarket }) ? (
                  <MarginPositionActionsMenu position={info.row.original.position} onSelect={onRequestModal} />
                ) : null}
                <RotatableChevron
                  direction={info.row.getIsExpanded() ? 'up' : 'down'}
                  color="$neutral2"
                  size="$icon.20"
                />
              </Flex>
            )}
          </Cell>
        ),
      }),
    ]
  }, [t, showLoadingSkeleton, currencyInfos, resolveMarket, onRequestModal])

  const completedColumns = useMemo(() => {
    const columnHelper = createColumnHelper<MarginTerminalPosition>()
    return [
      columnHelper.display({
        id: 'pair',
        size: 240,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <HeaderText label={t('margin.table.pair')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
            {hasRow<MarginTerminalPosition>(info) && (
              <HistoryPairCell row={info.row.original} currencyInfos={currencyInfos} resolveMarket={resolveMarket} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'closedSize',
        size: 150,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.table.closedSize')} />
          </HeaderCell>
        ),
        cell: (info) => {
          if (!hasRow<MarginTerminalPosition>(info)) {
            return <Cell loading={showLoadingSkeleton} />
          }
          const row = info.row.original
          const market = resolveMarketForPosition({ position: row, resolveMarket })
          return (
            <Cell loading={showLoadingSkeleton}>
              <Text variant="body3" color="$neutral1">
                {marginAmountLabel({ raw: row.size, position: row, market, currencyInfos, formatNumberOrString })}
              </Text>
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'entryExit',
        size: 190,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.table.entryExit')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTerminalPosition>(info) && (
              <Text variant="body3" color="$neutral1">
                {marginEntryExitLabel({ row: info.row.original, formatNumberOrString })}
              </Text>
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'realizedPnl',
        size: 150,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.table.realizedPnl')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTerminalPosition>(info) && (
              <HistoryPnlCell row={info.row.original} resolveMarket={resolveMarket} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'closedAt',
        size: 120,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.table.closed')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTerminalPosition>(info) && (
              <Text variant="body3" color="$neutral1">
                {marginClosedDateLabel({ row: info.row.original, locale })}
              </Text>
            )}
          </Cell>
        ),
      }),
    ]
  }, [t, showLoadingSkeleton, currencyInfos, formatNumberOrString, resolveMarket, locale])

  // Clicking the in-flight row resumes the plan: reopens the review modal, and — since the row only
  // renders with the modal closed, where the loop parks before its next prompt — re-drives a parked
  // loop. On a still-running loop resumePlan is a lock-guarded no-op that just shows live progress.
  const rowWrapper = useCallback(
    (row: Row<MarginTableRow>, content: JSX.Element) => {
      if (row.original.kind === 'inFlight') {
        const { planId } = row.original
        const onResumeRow = (): void => {
          void resumePlan({ planId })
        }
        return (
          <TouchableArea onPress={onResumeRow} cursor="pointer">
            {content}
          </TouchableArea>
        )
      }
      return content
    },
    [resumePlan],
  )

  const activeRowId = useCallback((row: MarginTableRow): string => {
    switch (row.kind) {
      case 'inFlight':
        return `inflight-${row.planId}`
      case 'drawer':
        return `drawer-${row.position.positionId}`
      default:
        return `position-${row.position.positionId}`
    }
  }, [])
  // closeTxHash is now optional (a zero-debt close settles nothing on-chain) — positionId is the
  // stable, always-present key.
  const historyRowId = useCallback((row: MarginTerminalPosition): string => row.positionId, [])

  // Card layout's sheet. The id outlives a close so the sheet can slide out with its content; the
  // position is re-read from query data each render, and a position that is gone closes the sheet.
  const [sheetPositionId, setSheetPositionId] = useState<string | undefined>(undefined)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const openSheet = useEvent((positionId: string) => {
    setSheetPositionId(positionId)
    setIsSheetOpen(true)
  })
  const closeSheet = useEvent(() => setIsSheetOpen(false))

  // No wallet: render nothing in the positions section (no connect CTA here).
  if (!account.address) {
    return <></>
  }

  const showError = isError && data === undefined
  const isActiveEmpty = !showLoadingSkeleton && activeRows.length === 0
  const isCompletedEmpty = !showLoadingSkeleton && historyRows.length === 0
  const isCards = props.layout === 'cards'

  const renderPositionSheet = (): JSX.Element | null => {
    const position = sheetPositionId ? activePositions?.find((p) => p.positionId === sheetPositionId) : undefined
    if (props.layout !== 'cards' || !position) {
      return null
    }
    return props.renderPositionSheet({
      isOpen: isSheetOpen,
      onClose: closeSheet,
      position,
      market: resolveMarketForPosition({ position, resolveMarket }),
      figures: {
        pnl: (
          <PnlCell position={position} resolveMarket={resolveMarket} currencyInfos={currencyInfos} align="flex-start" />
        ),
        markEntry: <MarkEntryCell position={position} />,
        liqPrice: <LiqPriceCell position={position} align="flex-start" />,
        size: (
          <SizeCell
            position={position}
            resolveMarket={resolveMarket}
            currencyInfos={currencyInfos}
            align="flex-start"
          />
        ),
        margin: (
          <MarginEquityCell
            position={position}
            resolveMarket={resolveMarket}
            currencyInfos={currencyInfos}
            align="flex-start"
          />
        ),
      },
      onRequestModal,
    })
  }

  const renderCardsPageEnd = (): JSX.Element => (
    <>
      <Flex ref={sentinelRef} height={1} />
      {visibleQuery.isFetchingNextPage && (
        <Flex centered py="$spacing8">
          <SpinningLoader />
        </Flex>
      )}
    </>
  )

  const renderActiveCards = (): JSX.Element => {
    if (showLoadingSkeleton) {
      return <MarginPositionCardSkeletons count={LOADING_ROWS} />
    }
    return (
      <Flex gap="$spacing12" width="100%">
        {activeRows.map((row) => {
          const id = activeRowId(row)
          const identity = <PairCell row={row} currencyInfos={currencyInfos} resolveMarket={resolveMarket} />
          if (row.kind === 'inFlight') {
            // Same as the table's in-flight row: a tap resumes the plan.
            return (
              <MarginPositionCard
                key={id}
                identity={identity}
                onPress={() => void resumePlan({ planId: row.planId })}
              />
            )
          }
          const { position } = row
          const metrics: MarginPositionCardMetric[] = [
            {
              key: 'pnl',
              label: t('margin.table.pnl'),
              value: (
                <PnlCell
                  position={position}
                  resolveMarket={resolveMarket}
                  currencyInfos={currencyInfos}
                  align="flex-start"
                />
              ),
            },
            { key: 'markEntry', label: t('margin.table.markEntry'), value: <MarkEntryCell position={position} /> },
            {
              key: 'liqPrice',
              label: t('margin.table.liqPrice'),
              value: <LiqPriceCell position={position} align="flex-start" />,
            },
            {
              key: 'size',
              label: t('margin.positions.size'),
              value: (
                <SizeCell
                  position={position}
                  resolveMarket={resolveMarket}
                  currencyInfos={currencyInfos}
                  align="flex-start"
                />
              ),
            },
          ]
          return (
            <MarginPositionCard
              key={id}
              identity={identity}
              trailing={
                <>
                  <Text variant="body3" color="$neutral2">
                    {hasMarginOpenedAt(position) ? formatAge({ openedAtSeconds: Number(position.openedAt) }) : '—'}
                  </Text>
                  <RotatableChevron direction="right" color="$neutral2" size="$icon.20" />
                </>
              }
              metrics={metrics}
              onPress={() => openSheet(position.positionId)}
            />
          )
        })}
        {renderCardsPageEnd()}
      </Flex>
    )
  }

  const renderCompletedCards = (): JSX.Element => {
    if (showLoadingSkeleton) {
      return <MarginPositionCardSkeletons count={LOADING_ROWS} />
    }
    return (
      <Flex gap="$spacing12" width="100%">
        {historyRows.map((row) => {
          const market = resolveMarketForPosition({ position: row, resolveMarket })
          return (
            <MarginPositionCard
              key={historyRowId(row)}
              identity={<HistoryPairCell row={row} currencyInfos={currencyInfos} resolveMarket={resolveMarket} />}
              trailing={
                <Text variant="body3" color="$neutral2">
                  {marginClosedDateLabel({ row, locale })}
                </Text>
              }
              metrics={[
                {
                  key: 'realizedPnl',
                  label: t('margin.table.realizedPnl'),
                  value: <HistoryPnlCell row={row} resolveMarket={resolveMarket} />,
                },
                {
                  key: 'entryExit',
                  label: t('margin.table.entryExit'),
                  value: (
                    <Text variant="body3" color="$neutral1">
                      {marginEntryExitLabel({ row, formatNumberOrString })}
                    </Text>
                  ),
                },
                {
                  key: 'closedSize',
                  label: t('margin.table.closedSize'),
                  value: (
                    <Text variant="body3" color="$neutral1">
                      {marginAmountLabel({
                        raw: row.size,
                        position: row,
                        market,
                        currencyInfos,
                        formatNumberOrString,
                      })}
                    </Text>
                  ),
                },
              ]}
            />
          )
        })}
        {renderCardsPageEnd()}
      </Flex>
    )
  }

  return (
    <Flex gap="$spacing12" width="100%">
      <Flex row gap="$spacing16">
        <TouchableArea onPress={showActiveTab}>
          <Text variant="subheading2" color={tab === 'active' ? '$neutral1' : '$neutral2'}>
            {t('margin.table.tab.active')}
          </Text>
        </TouchableArea>
        <TouchableArea onPress={showCompletedTab}>
          <Text variant="subheading2" color={tab === 'completed' ? '$neutral1' : '$neutral2'}>
            {t('margin.table.closed')}
          </Text>
        </TouchableArea>
      </Flex>
      {showError ? (
        <Flex gap="$spacing8" p="$spacing12">
          <Text variant="body3" color="$neutral2">
            {t('margin.table.error')}
          </Text>
          <Flex row>
            <Button size="small" variant="branded" emphasis="secondary" onPress={onRetry}>
              {t('margin.table.retry')}
            </Button>
          </Flex>
        </Flex>
      ) : tab === 'active' ? (
        isActiveEmpty ? (
          <EmptyPositions
            headers={
              isCards
                ? undefined
                : [
                    { label: t('margin.table.position'), leftAlign: true },
                    { label: t('margin.table.markEntry'), leftAlign: true },
                    { label: t('margin.table.pnl'), leftAlign: true },
                    { label: t('margin.table.liqPrice') },
                    { label: t('margin.positions.size') },
                    { label: t('margin.table.margin') },
                    { label: t('margin.drawer.openedAt') },
                  ]
            }
            message={t('margin.table.emptyActive')}
          />
        ) : isCards ? (
          renderActiveCards()
        ) : (
          <Table
            columns={activeColumns}
            data={activeRows}
            loading={showLoadingSkeleton}
            error={false}
            getRowId={activeRowId}
            loadMore={activeQuery.hasNextPage ? loadMore : undefined}
            getSubRows={getMarginTableSubRows}
            renderUnifiedExpandableRow={renderDrawerRow}
            singleExpandedRow
            rowWrapper={rowWrapper}
            loadingRowsCount={LOADING_ROWS}
            rowHeight={MARGIN_TABLE_ROW_HEIGHT}
            compactRowHeight={MARGIN_TABLE_ROW_HEIGHT}
            maxHeight={tableMaxHeight}
          />
        )
      ) : isCompletedEmpty ? (
        <EmptyPositions
          headers={
            isCards
              ? undefined
              : [
                  { label: t('margin.table.pair'), leftAlign: true },
                  { label: t('margin.table.closedSize') },
                  { label: t('margin.table.entryExit') },
                  { label: t('margin.table.realizedPnl') },
                  { label: t('margin.table.closed') },
                ]
          }
          message={t('margin.table.emptyCompleted')}
        />
      ) : isCards ? (
        renderCompletedCards()
      ) : (
        <Table
          columns={completedColumns}
          data={historyRows}
          loading={showLoadingSkeleton}
          error={false}
          getRowId={historyRowId}
          loadMore={terminalQuery.hasNextPage ? loadMore : undefined}
          loadingRowsCount={LOADING_ROWS}
          rowHeight={MARGIN_TABLE_ROW_HEIGHT}
          compactRowHeight={MARGIN_TABLE_ROW_HEIGHT}
          maxHeight={tableMaxHeight}
        />
      )}
      {renderPositionSheet()}
      <MarginActionModals
        request={activeModal}
        positions={activePositions}
        resolveMarket={resolveMarket}
        onClose={closeActiveModal}
      />
    </Flex>
  )
}
