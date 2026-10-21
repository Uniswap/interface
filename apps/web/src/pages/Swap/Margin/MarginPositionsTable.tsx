import { createColumnHelper, type Row } from '@tanstack/react-table'
import { Flex as MyceliumFlex } from '@universe/mycelium'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { TFunction } from 'i18next'
import { memo, type ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, HeightAnimator } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SpinningLoader } from 'ui/src/loading/SpinningLoader'
import { iconSizes } from 'ui/src/theme'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import type {
  MarginActivePosition,
  MarginPlanIntent,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginPositionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
/* oxlint-disable max-lines */
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { HeaderCell } from '~/components/Table/styled'
import type { RenderUnifiedExpandableRow } from '~/components/Table/types'
import { hasRow } from '~/components/Table/utils/hasRow'
import { MARGIN_CHAIN_ID, MARGIN_POSITIONS_REFETCH_MS, type MarginMarket } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { MarginActionModals } from '~/pages/Swap/Margin/components/MarginActionModals'
import { MarginPendingSection } from '~/pages/Swap/Margin/components/MarginPendingSection'
import { MarginPositionActionsMenu } from '~/pages/Swap/Margin/components/MarginPositionActionsMenu'
import { MarginPositionDrawer } from '~/pages/Swap/Margin/components/MarginPositionDrawer'
import {
  MarginExplainerContent,
  MarginExplainerTooltip,
  useMarginPnlCopy,
} from '~/pages/Swap/Margin/components/shared/MarginExplainer'
import { MarginHealthPill } from '~/pages/Swap/Margin/components/shared/MarginHealthPill'
import { MarginLiquidationPill } from '~/pages/Swap/Margin/components/shared/MarginLiquidationPill'
import { shouldShowPointerBanner } from '~/pages/Swap/Margin/hooks/marginPendingPlans'
import { useMarginPlanExecution } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import { getPersistedMarginPlanId } from '~/pages/Swap/Margin/hooks/marginPlanPointer'
import { useExecuteMarginPlan } from '~/pages/Swap/Margin/hooks/useExecuteMarginPlan'
import { getMarginPairLogoProps, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { type MarginMarketResolver, useResolveMarginMarket } from '~/pages/Swap/Margin/hooks/useResolveMarginMarket'
import {
  buildMarginActiveRows,
  marginAccruedInterestPerDay,
  type MarginTableRow,
} from '~/pages/Swap/Margin/marginActiveRows'
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
} from '~/pages/Swap/Margin/marginFormat'
import {
  buildMarginBasisBreakdown,
  buildMarginPnlBreakdown,
  buildMarginRealizedLines,
  MARGIN_PNL_DEFINITION_LINES,
  marginPnlSuppression,
} from '~/pages/Swap/Margin/marginPnlExplainer'
import {
  hasMarginOpenedAt,
  hasMarginPositionBasis,
  isMarginActivePosition,
  marginPositionDebt,
  marginPositionTokens,
  marginPositionVenue,
} from '~/pages/Swap/Margin/marginPositionRow'
import { formatAge } from '~/pages/Swap/Margin/marginPositionsMath'
import {
  marginExposureLeg,
  marginFallbackPairLabel,
  marginPairLabel,
  marginPairLegs,
  marginUnwrapSymbol,
  resolveMarginFallbackSymbol,
} from '~/pages/Swap/Margin/marginTokenDisplay'
import {
  marginPositionMark,
  marginRawUsdToNumber,
  marginUsdBasis,
  marginUsdPnlNow,
} from '~/pages/Swap/Margin/marginUsdPnl'

const MARGIN_TABLE_ROW_HEIGHT = 72
const LOADING_ROWS = 3

type MarginTableTab = 'active' | 'completed'
// Which management modal an expanded-row button requests; positionId keys the (freshest) position object.
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

// The wire dropped collateralToken/debtToken off the position row itself — every resolveMarket(row)
// call site now goes through here instead of re-deriving venue terms at each one.
function resolveMarketForPosition({
  position,
  resolveMarket,
}: {
  position: MarginActivePosition | MarginTerminalPosition
  resolveMarket: MarginMarketResolver
}): MarginMarket | undefined {
  const { collateralToken, debtToken } = marginPositionTokens(position)
  return resolveMarket({
    collateralToken,
    debtToken,
    venue: marginPositionVenue(position),
    direction: position.direction,
  })
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
  const directionLabel = direction === 'SHORT' ? t('margin.side.short') : t('margin.side.long')
  // A still-open position that was liquidated is only partially liquidated (collateral remains).
  const liquidationBadge = getMarginLiquidationBadge({ liquidated: position.liquidated, status: 'open' })
  return (
    <PairIdentity
      market={market}
      fallbackTokens={marginPositionTokens(position)}
      currencyInfos={currencyInfos}
      // Direction + CURRENT leverage, in the direction color. Leverage at open lives in the drawer.
      subtitle={
        <Text variant="body4" color={directionStyle.color}>
          {`${directionLabel} ${formatLeverage(position.leverage !== undefined ? Number(position.leverage) : Number.POSITIVE_INFINITY)}`}
        </Text>
      }
      trailing={liquidationBadge ? <MarginLiquidationPill badge={liquidationBadge} /> : undefined}
    />
  )
})

// The size cell's whole label, for either tab. With a resolved market it reads the exposure leg; with
// none it falls back to the wire's own `exposureToken`, whose decimals are always present — rendering
// the raw integer instead would misstate the size by orders of magnitude. The fallback symbol is
// best-effort: a token outside the markets registry has none, and the
// pair column beside this one already carries the fallback label.
function marginSizeLabel({
  position,
  market,
  currencyInfos,
  formatNumberOrString,
}: {
  position: MarginActivePosition | MarginTerminalPosition
  market: MarginMarket | undefined
  currencyInfos: Map<string, CurrencyInfo>
  formatNumberOrString: ReturnType<typeof useLocalizationContext>['formatNumberOrString']
}): string {
  const leg = market ? marginExposureLeg({ market, direction: position.direction }) : undefined
  if (leg) {
    const amount = formatNumberOrString({
      value: rawToNumber({ raw: position.size, decimals: leg.decimals }),
      type: NumberType.TokenNonTx,
    })
    return `${amount} ${marginUnwrapSymbol(leg)}`
  }
  const amount = formatNumberOrString({
    value: rawToNumber({ raw: position.size, decimals: position.exposureToken.decimals }),
    type: NumberType.TokenNonTx,
  })
  const symbol = resolveMarginFallbackSymbol({ address: position.exposureToken.address, currencyInfos })
  return symbol ? `${amount} ${symbol}` : amount
}

const SizeCell = memo(function SizeCell({
  position,
  resolveMarket,
  currencyInfos,
}: {
  position: MarginActivePosition
  resolveMarket: MarginMarketResolver
  currencyInfos: Map<string, CurrencyInfo>
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const market = resolveMarketForPosition({ position, resolveMarket })
  return (
    <Text variant="body3" color="$neutral1">
      {marginSizeLabel({ position, market, currencyInfos, formatNumberOrString })}
    </Text>
  )
})

const EntryPriceCell = memo(function EntryPriceCell({ position }: { position: MarginActivePosition }): JSX.Element {
  const copy = useMarginPnlCopy()
  const { formatNumberOrString } = useLocalizationContext()
  if (!hasMarginPositionBasis(position)) {
    return (
      <Text variant="body3" color="$neutral1">
        —
      </Text>
    )
  }
  const entryPrice = scaledE18ToNumber(position.entryPrice)
  return (
    <MarginExplainerTooltip
      content={
        <Text variant="body4" color="$neutral2" maxWidth={326}>
          {copy.entryPrice}
        </Text>
      }
    >
      <Text variant="body3" color="$neutral1" testID={TestID.MarginEntryPriceTrigger}>
        {formatNumberOrString({ value: entryPrice, type: NumberType.FiatTokenPrice })}
      </Text>
    </MarginExplainerTooltip>
  )
})

const CurrentLiqPriceCell = memo(function CurrentLiqPriceCell({
  position,
}: {
  position: MarginActivePosition
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  // An untradable pair has no single USD leg, so both prices are quoted against a leg that is not USD.
  if (position.isTradable === false) {
    return (
      <Text variant="body3" color="$neutral1">
        —
      </Text>
    )
  }
  // Backend reports HF = 0 / liq price = 0 for a debt-free position; render mark only, no liq line.
  const hasDebt = BigInt(marginPositionDebt(position)) !== 0n
  // '0' on either price is the wire's "no figure", not a price of zero — the same sentinel PnlCell and
  // MarginEquityCell suppress on (marginPnlSuppression's `noPrice`). Rendering $0.00 here would sit a
  // zero mark beside their dashes and read as an asset worth nothing.
  const mark = marginPositionMark({ position })
  const liqPriceRaw = scaledE18ToNumber(position.liquidationPrice)
  const liqPrice = liqPriceRaw > 0 ? liqPriceRaw : undefined
  const healthStatus = hasDebt ? getMarginHealthStatus(scaledE18ToNumber(position.healthFactor)) : undefined
  // Signed distance from mark to liq (negative for a long: price must fall to liquidate).
  const distancePct =
    hasDebt && mark !== undefined && liqPrice !== undefined ? liqDistanceSignedPct({ liqPrice, mark }) : undefined
  // Healthy liq prices read neutral (no color); caution/atRisk keep the tier color + get an inline pill.
  const isElevatedRisk = healthStatus !== undefined && healthStatus.key !== 'healthy'
  const liqColor = isElevatedRisk ? healthStatus.color : '$neutral2'
  return (
    <Flex alignItems="flex-end">
      <Text variant="body3" color="$neutral1">
        {mark === undefined ? '—' : formatNumberOrString({ value: mark, type: NumberType.FiatTokenPrice })}
      </Text>
      {hasDebt ? (
        <Flex row alignItems="center" gap="$spacing6">
          {isElevatedRisk ? <MarginHealthPill healthFactor={scaledE18ToNumber(position.healthFactor)} /> : null}
          <Text variant="body4" color={liqColor}>
            {liqPrice === undefined ? '—' : formatNumberOrString({ value: liqPrice, type: NumberType.FiatTokenPrice })}
            {distancePct !== undefined ? ` ${formatLiqDistanceSuffix(distancePct)}` : ''}
          </Text>
        </Flex>
      ) : (
        <Text variant="body4" color="$neutral2">
          —
        </Text>
      )}
    </Flex>
  )
})

const PnlCell = memo(function PnlCell({
  position,
  resolveMarket,
}: {
  position: MarginActivePosition
  resolveMarket: MarginMarketResolver
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const market = resolveMarketForPosition({ position, resolveMarket })
  const fiat = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatStandard })
  // No market means no decimals, no direction and no symbol — there is nothing honest to explain, so
  // this is the one dash that stays bare.
  if (!market) {
    return (
      <Text variant="body3" color="$neutral1">
        —
      </Text>
    )
  }
  const basis = marginUsdBasis({ position, market })
  const pnl = marginUsdPnlNow({ position, market })
  if (!basis || !pnl) {
    const suppression = marginPnlSuppression({ position, market })
    // The reason plus ONE definition line. The full nine-line block on a cell showing a single dash —
    // including a worked example for a position that has no numbers — is the wrong trade; the header
    // info icon is one hover away for anyone who wants it.
    return (
      <MarginExplainerTooltip content={<MarginExplainerContent suppression={suppression} lines={['lead']} />}>
        <Text variant="body3" color="$neutral1" testID={TestID.MarginPnlSuppressed}>
          —
        </Text>
      </MarginExplainerTooltip>
    )
  }
  const positive = pnl.pnlUsd >= 0
  const color = positive ? '$statusSuccess' : '$statusCritical'
  // The arrow carries the sign, so the percent shows its magnitude — and on the floor it reads "≥",
  // because past the liquidation price the loss is at least all of the margin.
  const rate = `${positive ? '▲' : '▼'} ${pnl.floored ? '≥' : ''}${Math.abs(pnl.pnlPct).toFixed(2)}%`
  const breakdown = buildMarginPnlBreakdown({ basis, pnl, formatFiat: fiat })
  return (
    <MarginExplainerTooltip
      content={<MarginExplainerContent lead="unrealizedLead" rows={breakdown.rows} notes={breakdown.notes} />}
    >
      <Flex alignItems="flex-end" testID={TestID.MarginPnlTrigger}>
        <Text variant="body3" color={color}>
          {formatSignedFiat({ value: pnl.pnlUsd, format: fiat })}
        </Text>
        <Text variant="body4" color={color}>
          {rate}
        </Text>
      </Flex>
    </MarginExplainerTooltip>
  )
})

function HeaderText({ label }: { label: string }): JSX.Element {
  return (
    <Text variant="body3" color="$neutral2">
      {label}
    </Text>
  )
}

// The definition tier: identical on every render — a fixed trigger should not change its content with
// the table underneath it. Both worked examples are in the card, each labelled with its direction, so
// the reader picks rather than the code guessing.
function PnlHeaderLabel(): JSX.Element {
  const { t } = useTranslation()
  const copy = useMarginPnlCopy()
  return (
    <MarginExplainerTooltip content={<MarginExplainerContent lines={MARGIN_PNL_DEFINITION_LINES} />}>
      <Flex row alignItems="center" gap="$spacing4" testID={TestID.MarginPnlHeaderInfo}>
        <Text variant="body3" color="$neutral2">
          {t('margin.table.pnlRoe')}
        </Text>
        <InfoCircleFilled size="$icon.16" color="$neutral3" aria-label={copy.aboutPnl} />
      </Flex>
    </MarginExplainerTooltip>
  )
}

// The margin still in the position, at cost: the USD the owner actually put in, net of anything they
// have taken back out. costBasis.equityContributed (the pre-valuation token-count fallback) has no
// wire replacement, so an unvalued position now renders a dash here instead.
const MarginEquityCell = memo(function MarginEquityCell({
  position,
  resolveMarket,
}: {
  position: MarginActivePosition
  resolveMarket: MarginMarketResolver
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const market = resolveMarketForPosition({ position, resolveMarket })
  if (!market) {
    return (
      <Text variant="body3" color="$neutral1">
        —
      </Text>
    )
  }
  const fiat = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatStandard })
  const basis = marginUsdBasis({ position, market })
  const pnl = marginUsdPnlNow({ position, market })
  if (!basis || !pnl) {
    return (
      <Text variant="body3" color="$neutral1">
        —
      </Text>
    )
  }
  const label = fiat(basis.costBasisUsd)
  const accrual = marginAccruedInterestPerDay({
    position,
    debtDecimals: market.debt.decimals,
    direction: basis.direction,
    nowMs: Date.now(),
  })
  const breakdown = buildMarginBasisBreakdown({ basis, pnl, formatFiat: fiat })
  const accruedLine =
    accrual === undefined
      ? undefined
      : t('margin.position.accruedPerDay', {
          accrued: `${formatNumberOrString({ value: accrual.accrued, type: NumberType.TokenNonTx })} ${marginUnwrapSymbol(market.debt)}`,
          perDay: formatNumberOrString({ value: accrual.perDayUsd, type: NumberType.FiatTokenPrice }),
        })
  return (
    <MarginExplainerTooltip
      content={
        <Flex gap="$gap8" width="100%">
          <MarginExplainerContent lead="basisLead" rows={breakdown.rows} />
          {accruedLine ? (
            <Text variant="body4" color="$neutral2">
              {accruedLine}
            </Text>
          ) : null}
        </Flex>
      }
    >
      <Text variant="body3" color="$neutral1" testID={TestID.MarginEquityTrigger}>
        {label}
      </Text>
    </MarginExplainerTooltip>
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
  const directionLabel = direction === 'SHORT' ? t('margin.side.short') : t('margin.side.long')
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

// Empty tab: a column-header echo row + a rounded-outline box with the centered empty message. The
// Table renders nothing when empty, so this stands in for both the active and closed tabs.
function EmptyPositions({
  headers,
  message,
}: {
  headers: { label: string; leftAlign?: boolean }[]
  message: string
}): JSX.Element {
  return (
    <Flex gap="$spacing8" width="100%">
      <Flex row px="$spacing16" py="$spacing12" gap="$spacing12" borderRadius="$rounded12" backgroundColor="$surface2">
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
      <Flex centered py="$spacing24" borderRadius="$rounded16" borderWidth={1} borderColor="$surface3">
        <Text variant="body3" color="$neutral2">
          {message}
        </Text>
      </Flex>
    </Flex>
  )
}

export function MarginPositionsTable(): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const { formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const currencyInfos = useMarginCurrencyInfos()
  const [tab, setTab] = useState<MarginTableTab>('active')

  const plan = useMarginPlanExecution((s) => s.plan)
  const isModalOpen = useMarginPlanExecution((s) => s.isModalOpen)
  const isExecuting = useMarginPlanExecution((s) => s.isExecuting)
  const { resumePlan } = useExecuteMarginPlan()

  const { data, isLoading, isError, refetch } = useMarginPositionsQuery({
    params: account.address ? { swapper: account.address, chainId: MARGIN_CHAIN_ID } : undefined,
    refetchInterval: MARGIN_POSITIONS_REFETCH_MS,
    // A backgrounded tab is exactly when a position drifts toward liquidation unwatched: keep polling
    // so the row is current the moment it is looked at again, not one interval behind.
    refetchIntervalInBackground: true,
  })
  // Terminal history is folded into positions[] now — one array covers every row's tokens.
  const resolveMarket = useResolveMarginMarket({ positions: data?.positions })

  // Active-only and terminal-only views of positions[] — the wire folds both into one array now,
  // where the old wire kept them in separate positions/history arrays.
  const activePositions = useMemo(() => data?.positions.filter(isMarginActivePosition), [data])
  const historyRows = useMemo<MarginTerminalPosition[]>(
    () =>
      (data?.positions ?? [])
        .filter((position): position is MarginTerminalPosition => position.status !== 'ACTIVE')
        .sort((a, b) => Number(b.closedAt) - Number(a.closedAt)),
    [data],
  )

  const activeRows = useMemo<MarginTableRow[]>(
    () =>
      buildMarginActiveRows({
        positions: data?.positions,
        plan,
        isModalOpen,
        isExecuting,
        t,
      }),
    [data, plan, isModalOpen, isExecuting, t],
  )

  // An expanded-row button's modal request, keyed by positionId — the only per-position identifier that
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
            <MarginPositionDrawer position={position} onRequestModal={onRequestModal} />
          </HeightAnimator>
        </MyceliumFlex>
      )
    },
    [onRequestModal],
  )

  const onRetry = useEvent(() => {
    void refetch()
  })
  const showActiveTab = useEvent(() => setTab('active'))
  const showCompletedTab = useEvent(() => setTab('completed'))

  // A plain localStorage read in the render body, so the banner's visibility rides on a value React
  // does not track. It converges because every pointer write and clear is paired with a change this
  // component already subscribes to — the execution store's `plan`/`isModalOpen`/`isExecuting`, or the
  // positions invalidation the cancel mutation fires. A future write path that touches none of those
  // would leave the banner stale, which is why the pairing is written down here rather than left to be
  // rediscovered. The predicate below is not a substitute: it re-reads the same untracked value.
  const persistedPlan = account.address ? getPersistedMarginPlanId(account.address) : undefined
  const onResume = useEvent(() => {
    if (persistedPlan) {
      void resumePlan({ planId: persistedPlan.planId })
    }
  })

  // Skeleton only on initial load — background refetches stay silent.
  const showLoadingSkeleton = data === undefined && isLoading

  const activeColumns = useMemo(() => {
    const columnHelper = createColumnHelper<MarginTableRow>()
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
            {hasRow<MarginTableRow>(info) && (
              <PairCell row={info.row.original} currencyInfos={currencyInfos} resolveMarket={resolveMarket} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'margin',
        size: 130,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.table.margin')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <MarginEquityCell position={info.row.original.position} resolveMarket={resolveMarket} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'size',
        size: 130,
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
        id: 'entryPrice',
        size: 120,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.risk.entryPrice')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <EntryPriceCell position={info.row.original.position} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'currentLiqPrice',
        size: 180,
        header: () => (
          <HeaderCell>
            <HeaderText label={t('margin.table.currentLiqPrice')} />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <CurrentLiqPriceCell position={info.row.original.position} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'pnlRoe',
        size: 160,
        header: () => (
          <HeaderCell>
            <PnlHeaderLabel />
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showLoadingSkeleton}>
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <PnlCell position={info.row.original.position} resolveMarket={resolveMarket} />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'opened',
        size: 90,
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
        id: 'utility',
        size: 130,
        meta: { overflowVisible: true },
        header: () => <HeaderCell />,
        cell: (info) => (
          <Cell loading={showLoadingSkeleton} overflow="visible">
            {hasRow<MarginTableRow>(info) && info.row.original.kind === 'position' && (
              <Flex row width="100%" justifyContent="flex-end" alignItems="center" gap="$spacing4">
                {/* Hidden when the market can't be resolved: every item would render enabled and each
                    click would mount then unmount a modal in the same tick. */}
                {resolveMarketForPosition({ position: info.row.original.position, resolveMarket }) ? (
                  <MarginPositionActionsMenu
                    position={info.row.original.position}
                    mountKey="row"
                    onSelect={onRequestModal}
                  />
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
    // 0 is the wire's absent sentinel (no stamped mark, or a zero-debt close that sold nothing).
    const formatPrice = (x18: string | undefined): string => {
      const price = x18 === undefined ? 0 : scaledE18ToNumber(x18)
      return price > 0 ? formatNumberOrString({ value: price, type: NumberType.FiatTokenPrice }) : '—'
    }
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
                {marginSizeLabel({ position: row, market, currencyInfos, formatNumberOrString })}
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
                {/* Same gate the realized-PnL and current-price cells use: an untradable pair has no
                    single USD leg, so both figures are quoted against something that is not dollars
                    and must not reach a fiat formatter. */}
                {info.row.original.isTradable === false
                  ? '—'
                  : `${formatPrice(info.row.original.entryPrice)} → ${formatPrice(info.row.original.exitPrice)}`}
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
                {new Date(Number(info.row.original.closedAt) * 1000).toLocaleDateString(locale)}
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

  // No wallet: render nothing in the positions section (no connect CTA here).
  if (!account.address) {
    return <></>
  }

  const showError = isError && data === undefined
  const isActiveEmpty = !showLoadingSkeleton && activeRows.length === 0
  const isCompletedEmpty = !showLoadingSkeleton && historyRows.length === 0

  return (
    <Flex gap="$spacing12" width="100%">
      <MarginPendingSection />
      {persistedPlan &&
      shouldShowPointerBanner({ pointer: persistedPlan, storePlan: plan, isModalOpen, isExecuting }) ? (
        <TouchableArea onPress={onResume}>
          <Flex
            row
            alignItems="center"
            justifyContent="space-between"
            px="$spacing12"
            py="$spacing8"
            borderRadius="$rounded12"
            backgroundColor="$surface2"
          >
            <Text variant="body3" color="$neutral1">
              {t('margin.table.resume')}
            </Text>
            <Text variant="buttonLabel4" color="$accent1">
              {t('common.button.continue')}
            </Text>
          </Flex>
        </TouchableArea>
      ) : null}
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
            headers={[
              { label: t('margin.table.pair'), leftAlign: true },
              { label: t('margin.table.margin') },
              { label: t('margin.positions.size') },
              { label: t('margin.risk.entryPrice') },
              { label: t('margin.table.currentLiqPrice') },
              { label: t('margin.table.pnlRoe') },
              { label: t('margin.drawer.openedAt') },
            ]}
            message={t('margin.table.emptyActive')}
          />
        ) : (
          <Table
            columns={activeColumns}
            data={activeRows}
            loading={showLoadingSkeleton}
            error={false}
            getRowId={activeRowId}
            getSubRows={getMarginTableSubRows}
            renderUnifiedExpandableRow={renderDrawerRow}
            singleExpandedRow
            rowWrapper={rowWrapper}
            loadingRowsCount={LOADING_ROWS}
            rowHeight={MARGIN_TABLE_ROW_HEIGHT}
            compactRowHeight={MARGIN_TABLE_ROW_HEIGHT}
          />
        )
      ) : isCompletedEmpty ? (
        <EmptyPositions
          headers={[
            { label: t('margin.table.pair'), leftAlign: true },
            { label: t('margin.table.closedSize') },
            { label: t('margin.table.entryExit') },
            { label: t('margin.table.realizedPnl') },
            { label: t('margin.table.closed') },
          ]}
          message={t('margin.table.emptyCompleted')}
        />
      ) : (
        <Table
          columns={completedColumns}
          data={historyRows}
          loading={showLoadingSkeleton}
          error={false}
          getRowId={historyRowId}
          loadingRowsCount={LOADING_ROWS}
          rowHeight={MARGIN_TABLE_ROW_HEIGHT}
          compactRowHeight={MARGIN_TABLE_ROW_HEIGHT}
        />
      )}
      <MarginActionModals
        request={activeModal}
        positions={activePositions}
        resolveMarket={resolveMarket}
        onClose={closeActiveModal}
      />
    </Flex>
  )
}
