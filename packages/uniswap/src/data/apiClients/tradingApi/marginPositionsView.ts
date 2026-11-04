import type {
  MarginActivePosition,
  MarginPosition,
  MarginPositionActivity,
  MarginPositionsResponse,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'

// Adapts the /margin/positions wire (one row per position, its venue slot flat on the row, epoch-MILLISECOND
// timestamps) into the FE view the terminal reads (a single-entry `legs`, an opaque `positionId`, Unix-SECOND
// timestamps). Kept at the client boundary so the position consumers stay on one shape.

// The (subId, venue) slot a row is. A subId answers on one venue at a time, so this is the position.
interface MarginPositionSlotWire {
  subId: string
  venue: MarginVenue
  account: string
  // Epoch milliseconds; absent when the store has not indexed the position.
  openedAt?: string
}

type MarginActivePositionWire = Omit<
  MarginActivePosition,
  'positionId' | 'legs' | 'openedAt' | 'costBasisUsd' | 'realizedPnlUsd'
> &
  MarginPositionSlotWire & {
    // Raw debt-token units owed now.
    debtAmount: string
    // Raw debt-token units: the basis of the equity still in the position, each deposit valued at the
    // venue mark at its event. Absent when a deposit or return could not be priced.
    costBasisInDebt?: string
    // Raw debt-token units, signed: what withdrawals so far fetched above the basis they removed.
    realizedPnlToDateInDebt?: string
  }

type MarginTerminalPositionWire = Omit<
  MarginTerminalPosition,
  'positionId' | 'legs' | 'openedAt' | 'closedAt' | 'realizedPnlUsd'
> &
  MarginPositionSlotWire & {
    // Epoch milliseconds.
    closedAt: string
    // Raw debt-token units, signed: collateral returned minus deposited, each valued at the venue mark at
    // its event. Absent when any of them could not be priced.
    realizedPnlInDebt?: string
  }

export type MarginPositionWire = MarginActivePositionWire | MarginTerminalPositionWire

export type MarginPositionsWireResponse = Omit<MarginPositionsResponse, 'positions'> & {
  positions: MarginPositionWire[]
}

const MILLIS_PER_SECOND = 1000

// "0" is the view's sentinel for an unattributable time, which consumers render as nothing.
function millisToSeconds(millis: string | undefined): string {
  const value = Number(millis)
  return Number.isFinite(value) && value > 0 ? String(Math.floor(value / MILLIS_PER_SECOND)) : '0'
}

// The view's *Usd figures are raw units of the stable leg. On a LONG that is the debt token, so a
// debt-denominated figure IS the USD figure, decimals included. A SHORT borrows the volatile token, and
// its figures were valued at a mark per deposit and return that the row does not carry, so there is no
// exact USD conversion: the row omits them and its PnL cells report nothing.
function debtFigureAsUsd({
  direction,
  raw,
}: {
  direction: MarginDirection
  raw: string | undefined
}): string | undefined {
  return direction === MarginDirection.LONG ? raw : undefined
}

function toActivePosition(wire: MarginActivePositionWire): MarginActivePosition {
  const { subId, venue, account, debtAmount, openedAt, costBasisInDebt, realizedPnlToDateInDebt, ...row } = wire
  const costBasisUsd = debtFigureAsUsd({ direction: row.direction, raw: costBasisInDebt })
  const realizedPnlUsd = debtFigureAsUsd({ direction: row.direction, raw: realizedPnlToDateInDebt })
  return {
    ...row,
    ...(costBasisUsd !== undefined && { costBasisUsd }),
    ...(realizedPnlUsd !== undefined && { realizedPnlUsd }),
    // A quote's positionId action key takes the subId back.
    positionId: subId,
    openedAt: millisToSeconds(openedAt),
    legs: [
      { venue, subId, account, debt: debtAmount, ...(row.borrowRate !== undefined && { borrowRate: row.borrowRate }) },
    ],
  }
}

function toTerminalPosition(wire: MarginTerminalPositionWire): MarginTerminalPosition {
  const { subId, venue, account, openedAt, closedAt, realizedPnlInDebt, ...row } = wire
  const realizedPnlUsd = debtFigureAsUsd({ direction: row.direction, raw: realizedPnlInDebt })
  return {
    ...row,
    ...(realizedPnlUsd !== undefined && { realizedPnlUsd }),
    // Closed rows reuse a subId across venues and across reopen epochs, and are never quoted against, so
    // the row key adds the venue and the close time.
    positionId: `${venue}:${subId}:${closedAt}`,
    openedAt: millisToSeconds(openedAt),
    closedAt: millisToSeconds(closedAt),
    legs: [{ venue, subId, account, debt: '0' }],
  }
}

function toMarginPosition(wire: MarginPositionWire): MarginPosition {
  return wire.status === 'ACTIVE' ? toActivePosition(wire) : toTerminalPosition(wire)
}

export function toMarginPositionsView({
  positions,
  ...response
}: MarginPositionsWireResponse): MarginPositionsResponse {
  return { ...response, positions: positions.map(toMarginPosition) }
}

type MarginPositionActivityWire = Omit<MarginPositionActivity, 'timestamp'> & {
  // Epoch milliseconds.
  at: string
}

// One page of GET /margin/positions/activity.
export interface MarginPositionActivityWireResponse {
  requestId: string
  activity: MarginPositionActivityWire[]
  // Absent on the last page.
  nextCursor?: string
}

// Joins a lifecycle's pages, oldest first, onto the positions view's Unix-SECOND timestamps.
export function toMarginPositionActivityView(pages: MarginPositionActivityWireResponse[]): MarginPositionActivity[] {
  return pages.flatMap((page) =>
    page.activity.map(({ at, ...event }) => ({ ...event, timestamp: millisToSeconds(at) })),
  )
}
