import type {
  MarginActivePosition,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginMarket } from '~/constants/margin'
import { formatSignedFiat } from '~/pages/Swap/Margin/marginFormat'
import type { MarginUsdBasis, MarginUsdPnl } from '~/pages/Swap/Margin/marginUsdPnl'
import { marginPositionMark, marginUsdBasis, marginUsdBreakEvenPrice } from '~/pages/Swap/Margin/marginUsdPnl'

type MarginPnlMarket = Pick<MarginMarket, 'collateral' | 'debt'>

// Copy lives in MarginExplainer.tsx; this module only decides WHICH lines and rows a surface shows, so
// the whole decision surface is unit-testable without a render or a locale context.
export type MarginExplainerLineId =
  | 'lead'
  | 'basis'
  | 'frozen'
  | 'withdrawals'
  | 'moves'
  | 'excludes'
  | 'leverage'
  | 'roe'
  | 'exampleLong'
  | 'exampleShort'

export type MarginExplainerNoteId = 'floored'

export type MarginRealizedLineId = 'realizedLead' | 'realizedBasis' | 'liquidated' | 'partialLiq'

export type MarginExplainerRowId =
  | 'marginAtCost'
  | 'marginNow'
  | 'unrealized'
  | 'roe'
  | 'realized'
  | 'netDeposited'
  | 'breakEven'
  | 'proceeds'
  | 'estRealized'

export interface MarginExplainerRow {
  id: MarginExplainerRowId
  value: string
  tone?: 'positive' | 'negative'
}

export interface MarginExplainerBreakdown {
  rows: MarginExplainerRow[]
  notes: MarginExplainerNoteId[]
}

// marginUsdBasis collapses three different failures into one undefined. The cell needs to tell them
// apart to say anything useful, so re-derive the reason here rather than widen that module's return.
export type MarginPnlSuppression = 'untradable' | 'unvalued' | 'noPrice'

export function marginPnlSuppression({
  position,
  market,
}: {
  position: MarginActivePosition
  market: MarginPnlMarket
}): MarginPnlSuppression | undefined {
  // Untradable wins: a pair with no dollar leg also has no valuable basis, and that is the truer reason.
  if (position.isTradable === false) {
    return 'untradable'
  }
  // Mark BEFORE basis: a SHORT's basis needs the mark, so an absent one now suppresses the basis too.
  // Testing the basis first would report 'unvalued' for a position whose only problem is a missing
  // price, and send the user to the wrong explanation.
  if (marginPositionMark({ position }) === undefined) {
    return 'noPrice'
  }
  if (!marginUsdBasis({ position, market })) {
    return 'unvalued'
  }
  return undefined
}

// A constant, not a builder: the header ⓘ is the only surface that shows the full definition, and it
// shows the same card every time. Both worked examples render, each labelled with its direction, so a
// fixed trigger never varies with the table underneath it.
export const MARGIN_PNL_DEFINITION_LINES: MarginExplainerLineId[] = [
  'lead',
  'basis',
  'frozen',
  'withdrawals',
  'moves',
  'excludes',
  'leverage',
  'roe',
  'exampleLong',
  'exampleShort',
]

// The worked examples sit below a rule, apart from the definition they illustrate. Naming them here
// keeps "which lines are examples" beside the list that orders them.
export const MARGIN_PNL_EXAMPLE_LINES: MarginExplainerLineId[] = ['exampleLong', 'exampleShort']

function signedFiatRow({
  id,
  value,
  formatFiat,
}: {
  id: MarginExplainerRowId
  value: number
  formatFiat: (value: number) => string
}): MarginExplainerRow {
  return {
    id,
    value: formatSignedFiat({ value, format: formatFiat }),
    tone: value >= 0 ? 'positive' : 'negative',
  }
}

// The cell drops the sign because its ▲/▼ arrow carries it. A tooltip row has no arrow, and it sits
// directly beside a signed "Unrealized PnL -$4.12", so this keeps the sign: -16.48%, and ≤-100.00% on
// the floor, where the true loss is at least all of the margin.
function roeRow({ pnl }: { pnl: MarginUsdPnl }): MarginExplainerRow {
  const signed = `${pnl.pnlPct >= 0 ? '+' : '-'}${Math.abs(pnl.pnlPct).toFixed(2)}%`
  return {
    id: 'roe',
    value: pnl.floored ? `≤${signed}` : signed,
    tone: pnl.pnlUsd >= 0 ? 'positive' : 'negative',
  }
}

function costAndNowRows({
  basis,
  pnl,
  formatFiat,
}: {
  basis: MarginUsdBasis
  pnl: MarginUsdPnl
  formatFiat: (value: number) => string
}): MarginExplainerRow[] {
  return [
    { id: 'marginAtCost', value: formatFiat(basis.costBasisUsd) },
    { id: 'marginNow', value: formatFiat(pnl.equityUsd) },
    signedFiatRow({ id: 'unrealized', value: pnl.pnlUsd, formatFiat }),
  ]
}

export function buildMarginPnlBreakdown({
  basis,
  pnl,
  formatFiat,
}: {
  basis: MarginUsdBasis
  pnl: MarginUsdPnl
  formatFiat: (value: number) => string
}): MarginExplainerBreakdown {
  const rows = [...costAndNowRows({ basis, pnl, formatFiat }), roeRow({ pnl })]
  // A zero realized figure is not a fact worth a row — omit it rather than render a meaningless +$0.00.
  if (basis.realizedPnlUsd !== undefined && basis.realizedPnlUsd !== 0) {
    rows.push(signedFiatRow({ id: 'realized', value: basis.realizedPnlUsd, formatFiat }))
  }
  return { rows, notes: pnl.floored ? ['floored'] : [] }
}

// The Margin column explains what the column's own number is, so it stops at the subtraction.
export function buildMarginBasisBreakdown({
  basis,
  pnl,
  formatFiat,
}: {
  basis: MarginUsdBasis
  pnl: MarginUsdPnl
  formatFiat: (value: number) => string
}): MarginExplainerBreakdown {
  return { rows: costAndNowRows({ basis, pnl, formatFiat }), notes: [] }
}

export function buildMarginRealizedLines({
  row,
}: {
  row: Pick<MarginTerminalPosition, 'status'>
}): MarginRealizedLineId[] {
  // A full liquidation realizes exactly minus the remaining basis, so "what you got out" is not true
  // of it — replace that line rather than append to it. PARTIALLY_LIQUIDATED is a user-closed position
  // that had already survived a partial liquidation, so it keeps the normal basis line and appends.
  if (row.status === 'LIQUIDATED') {
    return ['realizedLead', 'liquidated']
  }
  const lines: MarginRealizedLineId[] = ['realizedLead', 'realizedBasis']
  if (row.status === 'PARTIALLY_LIQUIDATED') {
    lines.push('partialLiq')
  }
  return lines
}

export function buildMarginEstPnlBreakdown({
  costBasisUsd,
  proceedsUsd,
  estPnlUsd,
  formatFiat,
}: {
  costBasisUsd: number
  proceedsUsd: number
  estPnlUsd: number
  formatFiat: (value: number) => string
}): MarginExplainerBreakdown {
  return {
    rows: [
      { id: 'marginAtCost', value: formatFiat(costBasisUsd) },
      { id: 'proceeds', value: formatFiat(proceedsUsd) },
      signedFiatRow({ id: 'estRealized', value: estPnlUsd, formatFiat }),
    ],
    notes: [],
  }
}

export function buildMarginDrawerPnlRows({
  basis,
  pnl,
  formatFiat,
  formatPrice,
}: {
  basis: MarginUsdBasis
  pnl: MarginUsdPnl
  formatFiat: (value: number) => string
  formatPrice: (value: number) => string
}): MarginExplainerRow[] {
  const rows = costAndNowRows({ basis, pnl, formatFiat })
  // Net deposited and realized only mean something once equity has actually moved out.
  if (basis.realizedPnlUsd !== undefined && basis.realizedPnlUsd !== 0) {
    if (basis.netContributedUsd !== undefined) {
      rows.push({ id: 'netDeposited', value: formatFiat(basis.netContributedUsd) })
    }
    rows.push(signedFiatRow({ id: 'realized', value: basis.realizedPnlUsd, formatFiat }))
  }
  const breakEven = marginUsdBreakEvenPrice({ basis })
  if (breakEven !== undefined) {
    rows.push({ id: 'breakEven', value: formatPrice(breakEven) })
  }
  return rows
}
