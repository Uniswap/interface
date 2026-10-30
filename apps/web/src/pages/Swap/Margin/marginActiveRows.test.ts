import type { TFunction } from 'i18next'
import type { MarginActivePosition, MarginPlanResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { buildMarginActiveRows, marginAccruedInterestPerDay } from '~/pages/Swap/Margin/marginActiveRows'

const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${params.current}/${params.total}` : key) as unknown as TFunction

// Real, 42-char addresses — normalizeTokenAddressForCache only case-folds a valid EVM address; a
// shorter placeholder string round-trips unchanged, which would silently defeat the case-insensitive
// suppression match this file's tests exercise.
const COLLATERAL = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const DEBT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

function makePlan(overrides: Partial<MarginPlanResponse> = {}): MarginPlanResponse {
  return {
    requestId: 'req-1',
    planId: 'plan-1',
    swapper: '0xswapper',
    intent: 'OPEN',
    marketKey: 'mk',
    collateralToken: COLLATERAL.toLowerCase(),
    debtToken: DEBT.toLowerCase(),
    subId: '7',
    status: 'AWAITING_ACTION',
    currentStepIndex: 0,
    steps: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

// LONG so marginPositionTokens reads collateralToken/debtToken straight off exposureToken/counterToken.
function makePosition({
  subId = '7',
  collateralToken = COLLATERAL,
  debtToken = DEBT,
}: {
  subId?: string
  collateralToken?: string
  debtToken?: string
} = {}): MarginActivePosition {
  return {
    status: 'ACTIVE',
    positionId: 'pos-1',
    direction: MarginDirection.LONG,
    exposureToken: { address: collateralToken, chainId: 1, decimals: 18 },
    counterToken: { address: debtToken, chainId: 1, decimals: 6 },
    size: '1',
    entryPrice: '0',
    openedAt: '0',
    legs: [{ venue: 'MORPHO', subId, account: '0xaccount', debt: '1' }],
    isTradable: true,
    equity: '1',
    oraclePrice: '0',
    liquidationPrice: '0',
    buffer: '0',
    healthFactor: '0',
    maxWithdrawable: '0',
  }
}

function kinds(rows: ReturnType<typeof buildMarginActiveRows>): string[] {
  return rows.map((row) => row.kind)
}

describe('buildMarginActiveRows', () => {
  it('never emits an in-flight row for an OPEN plan, modal open or closed', () => {
    for (const isModalOpen of [true, false]) {
      const rows = buildMarginActiveRows({ plan: makePlan(), isModalOpen, isExecuting: true, t })
      expect(kinds(rows)).not.toContain('inFlight')
    }
  })

  it('emits the in-flight row for a non-OPEN plan only while the modal is closed', () => {
    const plan = makePlan({ intent: 'CLOSE' })
    expect(kinds(buildMarginActiveRows({ plan, isModalOpen: false, isExecuting: true, t }))).toContain('inFlight')
    expect(kinds(buildMarginActiveRows({ plan, isModalOpen: true, isExecuting: true, t }))).not.toContain('inFlight')
  })

  it('emits no in-flight row for a terminal plan', () => {
    const plan = makePlan({ intent: 'CLOSE', status: 'COMPLETED' })
    expect(kinds(buildMarginActiveRows({ plan, isModalOpen: false, isExecuting: false, t }))).toEqual([])
  })

  it('labels the in-flight row with the first incomplete step', () => {
    const plan = makePlan({
      intent: 'CLOSE',
      steps: [
        {
          stepIndex: 0,
          stepType: 'MARGIN_CLOSE',
          method: 'SEND_TX',
          payloadType: 'TX',
          payload: {},
          status: 'COMPLETE',
        },
        {
          stepIndex: 1,
          stepType: 'MARGIN_CLOSE',
          method: 'SEND_TX',
          payloadType: 'TX',
          payload: {},
          status: 'AWAITING_ACTION',
        },
      ] as MarginPlanResponse['steps'],
    })
    const rows = buildMarginActiveRows({ plan, isModalOpen: false, isExecuting: false, t })
    expect(rows[0]).toMatchObject({ kind: 'inFlight', stepLabel: 'margin.table.stepProgress:2/2' })
  })

  it('suppresses matching server rows while the modal shows the OPEN plan (parked or executing)', () => {
    const rows = buildMarginActiveRows({
      positions: [makePosition()],
      plan: makePlan(),
      isModalOpen: true,
      isExecuting: false,
      t,
    })
    expect(rows).toEqual([])
  })

  it('suppresses matching server rows while the executor drives the OPEN plan with the modal closed', () => {
    const rows = buildMarginActiveRows({
      positions: [makePosition()],
      plan: makePlan(),
      isModalOpen: false,
      isExecuting: true,
      t,
    })
    expect(rows).toEqual([])
  })

  it('lets server rows take over once the OPEN plan is parked with the modal closed', () => {
    const rows = buildMarginActiveRows({
      positions: [makePosition()],
      plan: makePlan(),
      isModalOpen: false,
      isExecuting: false,
      t,
    })
    expect(kinds(rows)).toEqual(['position'])
  })

  it('never suppresses rows for a different subId', () => {
    const rows = buildMarginActiveRows({
      positions: [makePosition({ subId: '8' })],
      plan: makePlan(),
      isModalOpen: true,
      isExecuting: true,
      t,
    })
    expect(kinds(rows)).toEqual(['position'])
  })

  it('never suppresses server rows for a non-OPEN plan', () => {
    const rows = buildMarginActiveRows({
      positions: [makePosition()],
      plan: makePlan({ intent: 'CLOSE' }),
      isModalOpen: true,
      isExecuting: true,
      t,
    })
    expect(kinds(rows)).toEqual(['position'])
  })

  it('matches tokens case-insensitively when suppressing', () => {
    const rows = buildMarginActiveRows({
      positions: [makePosition({ collateralToken: COLLATERAL.toUpperCase().replace('0X', '0x') })],
      plan: makePlan(),
      isModalOpen: true,
      isExecuting: false,
      t,
    })
    expect(rows).toEqual([])
  })

  it('returns only server rows when the store is idle', () => {
    const rows = buildMarginActiveRows({
      positions: [makePosition()],
      plan: undefined,
      isModalOpen: false,
      isExecuting: false,
      t,
    })
    expect(kinds(rows)).toEqual(['position'])
  })
})

describe('marginAccruedInterestPerDay', () => {
  const DAY_MS = 86_400_000
  // Opened 10 days before `NOW`, carrying 5 USDC of accrued interest against a $2,000 mark.
  const OPENED_AT = '1700000000'
  const NOW = Number(OPENED_AT) * 1000 + 10 * DAY_MS

  function accruing(overrides: Partial<MarginActivePosition> = {}): MarginActivePosition {
    return {
      ...makePosition(),
      openedAt: OPENED_AT,
      accruedInterest: '5000000',
      oraclePrice: `${2000n * 10n ** 18n}`,
      ...overrides,
    }
  }

  it('divides the accrual by the position age', () => {
    const result = marginAccruedInterestPerDay({
      position: accruing(),
      debtDecimals: 6,
      direction: MarginDirection.LONG,
      nowMs: NOW,
    })
    expect(result).toEqual({ accrued: 5, perDayUsd: 0.5 })
  })

  // The debt leg is the VOLATILE one for a short, so its accrual is worth mark× more in USD. Reporting
  // the raw token figure would understate a short's carry by the whole price of the asset.
  it('values a short accrual at the mark before reporting it in USD', () => {
    const result = marginAccruedInterestPerDay({
      position: accruing(),
      debtDecimals: 6,
      direction: MarginDirection.SHORT,
      nowMs: NOW,
    })
    expect(result).toEqual({ accrued: 5, perDayUsd: 1000 })
  })

  // The '0' openedAt sentinel would make the age ~55 years and the daily rate ~0, understating the
  // carry by orders of magnitude — report nothing instead.
  it('reports nothing without a real openedAt', () => {
    expect(
      marginAccruedInterestPerDay({
        position: accruing({ openedAt: '0' }),
        debtDecimals: 6,
        direction: MarginDirection.LONG,
        nowMs: NOW,
      }),
    ).toBeUndefined()
  })

  it('reports nothing when the wire stamped no accrual at all', () => {
    expect(
      marginAccruedInterestPerDay({
        position: accruing({ accruedInterest: undefined }),
        debtDecimals: 6,
        direction: MarginDirection.LONG,
        nowMs: NOW,
      }),
    ).toBeUndefined()
  })

  // Same second as the open: there is no age to divide by, and a division by zero would report
  // Infinity/day on the freshest possible row.
  it('reports the whole accrual as the daily rate on a position with no age yet', () => {
    const result = marginAccruedInterestPerDay({
      position: accruing(),
      debtDecimals: 6,
      direction: MarginDirection.LONG,
      nowMs: Number(OPENED_AT) * 1000,
    })
    expect(result).toEqual({ accrued: 5, perDayUsd: 5 })
  })
})
