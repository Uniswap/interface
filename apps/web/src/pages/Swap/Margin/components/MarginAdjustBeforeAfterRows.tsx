import { Flex, Skeleton } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import type { MarginActivePosition, MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { MarginBeforeAfterRow } from '~/pages/Swap/Margin/components/shared/MarginBeforeAfterRow'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { MarginHealthValue } from '~/pages/Swap/Margin/components/shared/MarginHealthValue'
import {
  formatLeverageX,
  formatLiqDistanceSuffix,
  liqDistanceSignedPct,
  projectedDebtAmount,
  rawToNumber,
  scaledE18ToNumber,
  usablePriceX18,
} from '~/pages/Swap/Margin/marginFormat'
import { marginPositionDebt } from '~/pages/Swap/Margin/marginPositionRow'

// Leverage and Liquidates-at are the pair that carries the meaning of a funding-only change; Size
// moves too, but as a consequence. 'liquidationSecond' sits them adjacent for Add/Withdraw margin.
export type MarginBeforeAfterRowOrder = 'default' | 'liquidationSecond'

// Absent leverage means there is no finite one to report (equity at or below zero) — on the projection
// exactly as on the row it is composed against.
function leverageOf(leverage: string | undefined): number {
  return leverage === undefined ? Number.POSITIVE_INFINITY : Number(leverage)
}

// Borrowing: the position's live debt against the debt this action projects. The quote publishes no
// debt figure — projectedDebtAmount recovers it — and where it cannot, the current debt IS the
// projection: the keys that report no size are the equity-only ones, which hold debt constant.
// Lives behind Show more, so it is exported for the modals to hand to MarginAdjustShowMoreSection.
export function MarginBorrowingRow({
  quote,
  position,
  debtDecimals,
  debtDisplaySymbol,
  logos,
}: {
  quote: MarginQuoteResponse
  position: MarginActivePosition
  debtDecimals: number
  debtDisplaySymbol: string
  // The debt leg's own logo, so this row reads like the Size row rather than the one bare amount.
  logos?: { url?: string; symbol: string }
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const format = (amount: number): string =>
    `${formatNumberOrString({ value: amount, type: NumberType.TokenNonTx })} ${debtDisplaySymbol}`

  const before = format(rawToNumber({ raw: marginPositionDebt(position), decimals: debtDecimals }))
  const projected = projectedDebtAmount({ quote, mark: scaledE18ToNumber(position.oraclePrice) })
  return (
    <MarginBeforeAfterRow
      label={t('margin.size.borrowing')}
      before={before}
      after={projected === undefined ? before : format(projected)}
      logos={logos}
    />
  )
}

// The action's before→after preview. The wire ships no before/after pair — `quote.display` is the
// projection alone — so "before" is the position row the table already holds, and each row is a pair
// composed here. A projected field the action does not report leaves that row at its current value.
export function MarginAdjustBeforeAfterRows({
  markIsStale,
  quote,
  position,
  sizeLogos,
  hasLeverageControl = false,
  rowOrder = 'default',
}: {
  quote: MarginQuoteResponse
  position: MarginActivePosition
  // The exposure leg's logo AND symbol — a short's is its debt leg, never the collateral's. Its symbol
  // labels the Size row's amount too (the quote's exposureToken carries decimals but no symbol).
  sizeLogos: { url?: string; symbol: string }
  // True where the modal already carries a leverage slider: the target sits on the control and the
  // current figure in the pair heading, so a third rendering here is the one nobody can place.
  hasLeverageControl?: boolean
  // Freshness of the position's polled mark, from the modal that owns the data reads. The liquidation
  // distance divides a fresh quote price by it, so an aged mark silently overstates the buffer.
  markIsStale: boolean
  rowOrder?: MarginBeforeAfterRowOrder
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  // Both sizes are EXPOSURE-leg units: the amount off the quote's exposureToken decimals, the symbol
  // off sizeLogos (a short's exposure is its debt leg, never the collateral's).
  const formatSize = (raw: string): string =>
    `${formatNumberOrString({
      value: rawToNumber({ raw, decimals: quote.exposureToken.decimals }),
      type: NumberType.TokenNonTx,
    })} ${sizeLogos.symbol}`
  const sizeBefore = formatSize(position.size)
  const sizeRow = (
    <MarginBeforeAfterRow
      key="size"
      label={t('margin.size.label')}
      before={sizeBefore}
      after={quote.display.size === undefined ? sizeBefore : formatSize(quote.display.size)}
      logos={sizeLogos}
    />
  )

  // Through the guarded reader: the backend reports liquidationPrice 0 for a DEBT-FREE position (and
  // for any position at the absent-price sentinel), which the bare decode renders as "$0.00" — a
  // liquidation an inch below zero, printed one row above the "Healthy" this same card correctly
  // substitutes for the matching health sentinel. Every other surface already gates this field.
  const formatPrice = (priceX18: string | undefined): string => {
    const usable = usablePriceX18(priceX18)
    return usable === undefined
      ? '—'
      : formatNumberOrString({ value: scaledE18ToNumber(usable), type: NumberType.FiatTokenPrice })
  }
  // No fallback to the position's own price: an equity-only add or withdraw ALWAYS moves the
  // liquidation price, so echoing the current one as the projection reads as "unchanged" — a stated
  // figure that is wrong. Degrade to before-only, the way the health row already does on the same
  // absence.
  // usablePriceX18, not `!== undefined`: '0' is a truthy string, so the sentinel would take the
  // before/after branch and render an after side of "$0.00" as though it were a projection.
  const liquidationAfterX18 = usablePriceX18(quote.display.liquidationPrice)
  // The suffix rides on the after side, so it measures a FRESH quote price against the position's own
  // polled mark — the quote carries none for a manage action. That epoch mix is only honest while the
  // mark is current: 6% behind, a 5x long reads "22% away" against a live ~16%. Withheld rather than
  // captioned, unlike the impact row: the price still renders without it, so this figure HAS a fallback
  // and takes the bounded treatment the exception was carved out of.
  const liqDistancePct =
    liquidationAfterX18 === undefined || markIsStale
      ? undefined
      : liqDistanceSignedPct({
          liqPrice: scaledE18ToNumber(liquidationAfterX18),
          mark: scaledE18ToNumber(position.oraclePrice),
        })
  const liquidationRow =
    liquidationAfterX18 === undefined ? (
      // Before-only: a projection we do not have must not be echoed back as the current price.
      <MarginDetailRow
        key="liquidation"
        label={t('margin.size.liquidatesAt')}
        value={formatPrice(position.liquidationPrice)}
      />
    ) : (
      <MarginBeforeAfterRow
        key="liquidation"
        label={t('margin.size.liquidatesAt')}
        before={formatPrice(position.liquidationPrice)}
        after={formatPrice(liquidationAfterX18)}
        suffix={liqDistancePct !== undefined ? formatLiqDistanceSuffix(liqDistancePct) : undefined}
      />
    )

  // A debt-free position reports the wire's "0" health sentinel, which would paint a false "At risk".
  const hasDebt = BigInt(marginPositionDebt(position)) !== 0n
  const healthBefore = hasDebt ? scaledE18ToNumber(position.healthFactor) : Number.POSITIVE_INFINITY
  // Same sentinel on the projection, gated the same way the before side is: a full deleverage projects
  // zero debt, so the wire's "0" would paint a de-risking action as moving into danger. Substituting on
  // "0" ALONE would be the opposite inversion — a venue reporting "0" for any other reason (x18
  // rounding, an insolvent projection) would render ∞/healthy.
  // The equity-only keys (Add/Withdraw margin) report no debt at all, so an undefined projection means
  // "debt unchanged": on a debt-free position that is still zero, and without this arm the sentinel
  // would render the very inversion the before side already guards against.
  const projectedDebt = projectedDebtAmount({ quote, mark: scaledE18ToNumber(position.oraclePrice) })
  const projectsZeroDebt = projectedDebt === 0 || (projectedDebt === undefined && !hasDebt)
  const healthAfter =
    quote.display.healthFactor === undefined
      ? undefined
      : BigInt(quote.display.healthFactor) === 0n && projectsZeroDebt
        ? Number.POSITIVE_INFINITY
        : scaledE18ToNumber(quote.display.healthFactor)
  const healthLabel = t('margin.risk.health')

  return (
    <Flex gap="$spacing12">
      {hasLeverageControl ? null : (
        <MarginBeforeAfterRow
          label={t('margin.manage.leverage')}
          before={formatLeverageX(leverageOf(position.leverage))}
          after={formatLeverageX(leverageOf(quote.display.leverage))}
        />
      )}
      {rowOrder === 'liquidationSecond' ? [liquidationRow, sizeRow] : [sizeRow, liquidationRow]}
      <MarginDetailRow
        label={healthLabel}
        value={
          healthAfter === undefined ? (
            <MarginHealthValue before={healthBefore} />
          ) : (
            <MarginHealthValue label={healthLabel} before={healthBefore} after={healthAfter} />
          )
        }
      />
    </Flex>
  )
}

// Fixed-height placeholder for the modal's first paint (no quote yet, nothing to latch onto): same row
// count/gap as the real block above so first paint doesn't grow the modal once the quote lands.
export function MarginAdjustBeforeAfterRowsSkeleton({ rowCount }: { rowCount: number }): JSX.Element {
  return (
    <Flex gap="$spacing12" testID={TestID.MarginAdjustBeforeAfterSkeleton}>
      {Array.from({ length: rowCount }, (_, i) => (
        <Flex key={i} row justifyContent="space-between" alignItems="center" gap="$spacing12">
          <Skeleton>
            <Flex width={64} height={18} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
          <Skeleton>
            <Flex width={120} height={18} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
        </Flex>
      ))}
    </Flex>
  )
}

// Picks between the real rows (dimmed while stale/errored), the first-load skeleton, and nothing —
// pulled out of the modal so its branching doesn't count against that already-large function.
export function MarginAdjustBeforeAfterSection({
  markIsStale,
  displayQuote,
  position,
  showInitialSkeleton,
  dim,
  sizeLogos,
  hasLeverageControl = false,
  rowOrder,
}: {
  displayQuote: MarginQuoteResponse | undefined
  position: MarginActivePosition
  showInitialSkeleton: boolean
  dim: boolean
  sizeLogos: { url?: string; symbol: string }
  hasLeverageControl?: boolean
  markIsStale: boolean
  rowOrder?: MarginBeforeAfterRowOrder
}): JSX.Element | null {
  if (displayQuote) {
    return (
      <Flex opacity={dim ? 0.5 : 1} testID={TestID.MarginAdjustBeforeAfterBlock}>
        <MarginAdjustBeforeAfterRows
          markIsStale={markIsStale}
          quote={displayQuote}
          position={position}
          sizeLogos={sizeLogos}
          hasLeverageControl={hasLeverageControl}
          rowOrder={rowOrder}
        />
      </Flex>
    )
  }
  if (showInitialSkeleton) {
    // Size, Liquidates at, Health — plus Leverage wherever no control already shows it.
    return <MarginAdjustBeforeAfterRowsSkeleton rowCount={hasLeverageControl ? 3 : 4} />
  }
  return null
}
