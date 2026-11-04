import { MARGIN_POSITION_ACTIVITY_WIRE_CLOSED } from 'uniswap/src/data/apiClients/tradingApi/__fixtures__/marginPositionActivityWire'
import {
  MARGIN_POSITIONS_WIRE_ACTIVE,
  MARGIN_POSITIONS_WIRE_TERMINAL,
} from 'uniswap/src/data/apiClients/tradingApi/__fixtures__/marginPositionsWire'
import {
  MARGIN_POSITIONS_WIRE_PNL_ACTIVE,
  MARGIN_POSITIONS_WIRE_PNL_DECREASED,
  MARGIN_POSITIONS_WIRE_PNL_TERMINAL,
} from 'uniswap/src/data/apiClients/tradingApi/__fixtures__/marginPositionsWirePnl'
import type {
  MarginActivePosition,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  type MarginPositionsWireResponse,
  type MarginPositionWire,
  toMarginPositionActivityView,
  toMarginPositionsView,
} from 'uniswap/src/data/apiClients/tradingApi/marginPositionsView'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'

function firstWireRow(rows: MarginPositionWire[]): MarginPositionWire {
  const [row] = rows
  if (!row) {
    throw new Error('fixture has no rows')
  }
  return row
}

function activeView(): MarginActivePosition {
  const [position] = toMarginPositionsView(MARGIN_POSITIONS_WIRE_ACTIVE).positions
  if (position?.status !== 'ACTIVE') {
    throw new Error('expected an ACTIVE row')
  }
  return position
}

function terminalViews(): MarginTerminalPosition[] {
  return toMarginPositionsView(MARGIN_POSITIONS_WIRE_TERMINAL).positions.flatMap((position) =>
    position.status === 'ACTIVE' ? [] : [position],
  )
}

describe('toMarginPositionsView', () => {
  it('folds an active row’s flat venue slot into its single leg, debt included', () => {
    expect(activeView().legs).toEqual([
      {
        venue: 'AAVE_V3',
        subId: '1',
        account: '0xDCa4deebCa94f6c281f814558a2E36CC9090d35d',
        debt: '1565183',
        borrowRate: '44809795200012592',
      },
    ])
  })

  it('keys an active row by its subId, the handle a quote takes back', () => {
    expect(activeView().positionId).toBe('1')
  })

  it('converts epoch-millisecond times to the view’s Unix seconds', () => {
    const active = activeView()
    expect(active.openedAt).toBe('1788149171')
    expect(terminalViews().map((row) => [row.openedAt, row.closedAt])).toEqual([
      ['1792171967', '1792172207'],
      ['1792080131', '1792090787'],
    ])
  })

  it('passes a row’s activityId through for the activity read', () => {
    const row = firstWireRow(MARGIN_POSITIONS_WIRE_ACTIVE.positions)
    const activityId = '0xe46e3d4677aa8b9e32efd10fff8e84d93bb414bd2d54f5bb19b9541beffe6e01'
    const [position] = toMarginPositionsView({
      ...MARGIN_POSITIONS_WIRE_ACTIVE,
      positions: [{ ...row, activityId }],
    }).positions
    expect(position?.activityId).toBe(activityId)
  })

  it('gives closed rows that share a subId distinct keys', () => {
    const rows = terminalViews()
    expect(rows.map((row) => row.legs[0]?.subId)).toEqual(['0', '0'])
    expect(new Set(rows.map((row) => row.positionId)).size).toBe(rows.length)
  })

  it('reports a closed row as owing nothing', () => {
    expect(terminalViews().map((row) => row.legs[0]?.debt)).toEqual(['0', '0'])
  })

  it('maps an absent open time to the view’s unattributable sentinel', () => {
    const { openedAt: _openedAt, ...unindexed } = firstWireRow(MARGIN_POSITIONS_WIRE_TERMINAL.positions)
    const [position] = toMarginPositionsView({ ...MARGIN_POSITIONS_WIRE_TERMINAL, positions: [unindexed] }).positions
    expect(position?.openedAt).toBe('0')
  })

  it('passes the response envelope through', () => {
    const view = toMarginPositionsView(MARGIN_POSITIONS_WIRE_TERMINAL)
    expect(view.requestId).toBe(MARGIN_POSITIONS_WIRE_TERMINAL.requestId)
    expect(view.pendingPlans).toEqual([])
    expect(view.nextCursor).toBeUndefined()
  })
})

describe('toMarginPositionsView PnL set', () => {
  function activeRows(response: MarginPositionsWireResponse): MarginActivePosition[] {
    return toMarginPositionsView(response).positions.flatMap((position) =>
      position.status === 'ACTIVE' ? [position] : [],
    )
  }

  it('serves a LONG’s debt-denominated basis as its USD basis, raw units unchanged', () => {
    const wireBases = MARGIN_POSITIONS_WIRE_PNL_ACTIVE.positions.map((row) =>
      'costBasisInDebt' in row ? row.costBasisInDebt : undefined,
    )
    expect(wireBases.every((basis) => basis !== undefined)).toBe(true)
    expect(activeRows(MARGIN_POSITIONS_WIRE_PNL_ACTIVE).map((row) => row.costBasisUsd)).toEqual(wireBases)
  })

  it('serves realized-to-date as the active row’s realized USD, a withdrawal’s gain included', () => {
    const wireRealized = MARGIN_POSITIONS_WIRE_PNL_DECREASED.positions.map((row) =>
      'realizedPnlToDateInDebt' in row ? row.realizedPnlToDateInDebt : undefined,
    )
    expect(wireRealized.some((realized) => realized !== '0')).toBe(true)
    expect(activeRows(MARGIN_POSITIONS_WIRE_PNL_DECREASED).map((row) => row.realizedPnlUsd)).toEqual(wireRealized)
  })

  it('serves a closed LONG’s debt-denominated realized PnL as its realized USD', () => {
    const wireRealized = MARGIN_POSITIONS_WIRE_PNL_TERMINAL.positions.map((row) =>
      'realizedPnlInDebt' in row ? row.realizedPnlInDebt : undefined,
    )
    expect(wireRealized.every((realized) => realized !== undefined)).toBe(true)
    expect(
      toMarginPositionsView(MARGIN_POSITIONS_WIRE_PNL_TERMINAL).positions.map((row) => row.realizedPnlUsd),
    ).toEqual(wireRealized)
  })

  it('leaves the USD basis absent when the row carries no debt-denominated one', () => {
    const row = firstWireRow(MARGIN_POSITIONS_WIRE_PNL_ACTIVE.positions)
    if (row.status !== 'ACTIVE') {
      throw new Error('expected an ACTIVE row')
    }
    const { costBasisInDebt: _costBasisInDebt, ...unpriced } = row
    const [position] = activeRows({ ...MARGIN_POSITIONS_WIRE_PNL_ACTIVE, positions: [unpriced] })
    expect(position).toBeDefined()
    expect(position && 'costBasisUsd' in position).toBe(false)
  })

  // No served SHORT is on record, so this is a real LONG row with its direction flipped: what it
  // pins is that a volatile-debt figure is never passed off as dollars, not any SHORT value.
  it('omits the USD figures on a SHORT, whose debt token is not the stable leg', () => {
    const shorts = MARGIN_POSITIONS_WIRE_PNL_DECREASED.positions.map((row) => ({
      ...row,
      direction: MarginDirection.SHORT,
    }))
    const rows = activeRows({ ...MARGIN_POSITIONS_WIRE_PNL_DECREASED, positions: shorts })
    expect(rows.map((row) => [row.costBasisUsd, row.realizedPnlUsd])).toEqual([
      [undefined, undefined],
      [undefined, undefined],
      [undefined, undefined],
    ])
  })

  it('does not leak the debt-denominated wire keys into the view', () => {
    const [active] = activeRows(MARGIN_POSITIONS_WIRE_PNL_DECREASED)
    const [terminal] = toMarginPositionsView(MARGIN_POSITIONS_WIRE_PNL_TERMINAL).positions
    expect(active && ('costBasisInDebt' in active || 'realizedPnlToDateInDebt' in active)).toBe(false)
    expect(terminal && 'realizedPnlInDebt' in terminal).toBe(false)
  })
})

describe('toMarginPositionActivityView', () => {
  it('converts each event’s epoch-millisecond time to Unix seconds, keeping its amounts', () => {
    const [close] = toMarginPositionActivityView([MARGIN_POSITION_ACTIVITY_WIRE_CLOSED]).slice(-1)
    expect(close).toEqual({
      kind: 'MARGIN_ACTIVITY_KIND_CLOSE',
      txHash: '0x3be9e214f9cd82ad93b327fe11c8dea141150bdf5868192135e284813cc320f4',
      timestamp: '1792513559',
      collateralSold: '1116244859241097',
      debtRepaid: '2710660',
      equityWithdrawn: '1961559120732432',
      price: '2428620367000000000000',
      collateralAfter: '0',
      debtAfter: '0',
      entryPrice: '2512997358000000000000',
    })
  })

  it('joins a lifecycle served over two pages back into one list, oldest first', () => {
    const { activity } = MARGIN_POSITION_ACTIVITY_WIRE_CLOSED
    const firstPage = { ...MARGIN_POSITION_ACTIVITY_WIRE_CLOSED, activity: activity.slice(0, 2), nextCursor: 'opaque' }
    const lastPage = { ...MARGIN_POSITION_ACTIVITY_WIRE_CLOSED, activity: activity.slice(2) }
    expect(toMarginPositionActivityView([firstPage, lastPage])).toEqual(
      toMarginPositionActivityView([MARGIN_POSITION_ACTIVITY_WIRE_CLOSED]),
    )
    expect(toMarginPositionActivityView([firstPage, lastPage]).map((event) => event.kind)).toEqual([
      'MARGIN_ACTIVITY_KIND_OPEN',
      'MARGIN_ACTIVITY_KIND_INCREASE',
      'MARGIN_ACTIVITY_KIND_ADD_EQUITY',
      'MARGIN_ACTIVITY_KIND_CLOSE',
    ])
  })
})
