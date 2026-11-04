import type { MarginTerminalPosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { formatSignedFiat } from '~/features/margin/utils/marginFormat'

// Copy lives in MarginExplainer.tsx; this module only decides WHICH lines and rows a surface shows, so
// the whole decision surface is unit-testable without a render or a locale context.
export type MarginExplainerLineId = 'lead' | 'basis' | 'frozen' | 'roe'

export type MarginRealizedLineId = 'realizedLead' | 'realizedBasis' | 'liquidated' | 'partialLiq'

export type MarginExplainerRowId = 'marginAtCost' | 'proceeds' | 'estRealized'

export interface MarginExplainerRow {
  id: MarginExplainerRowId
  value: string
  tone?: 'positive' | 'negative'
}

export interface MarginExplainerBreakdown {
  rows: MarginExplainerRow[]
}

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
  }
}
