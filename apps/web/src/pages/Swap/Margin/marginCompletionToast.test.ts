import type { TFunction } from 'i18next'
import type {
  MarginActivePosition,
  MarginPlanResponse,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { shortenAddress } from 'utilities/src/addresses'
import { describe, expect, it } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import type { MarginMarketResolver } from '~/pages/Swap/Margin/hooks/useResolveMarginMarket'
import { buildCompletionToastMessage, findOpenedLeverageForPlan } from '~/pages/Swap/Margin/marginCompletionToast'

// Passthrough stub — asserts on the i18n key (and its interpolations) rather than translated copy,
// same approach as marginQuoteError.test.ts.
const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}|${Object.values(params).join(',')}` : key) as unknown as TFunction

const formatNumberOrString = (({ value }: { value?: string | number }) => String(value)) as never

// Real WETH/USDC addresses so marginMarketDirection resolves the toast's LONG/SHORT branch.
const COLLATERAL = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const DEBT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const MARKET = {
  key: 'mk',
  asset: 'ETH',
  name: 'Ethereum',
  displaySymbol: 'ETH',
  collateral: { address: COLLATERAL, symbol: 'WETH', decimals: 18 },
  debt: { address: DEBT, symbol: 'USDC', decimals: 6 },
  venue: 'MORPHO',
  lltvWad: '0',
  shouldUseNativeEquity: false,
} as unknown as MarginMarket

const resolveMarket: MarginMarketResolver = () => MARKET

function makePlan(overrides: Partial<MarginPlanResponse> = {}): MarginPlanResponse {
  return {
    requestId: 'req-1',
    planId: 'plan-1',
    swapper: '0xswapper',
    intent: 'ADJUST',
    marketKey: 'mk',
    collateralToken: COLLATERAL,
    debtToken: DEBT,
    subId: '7',
    status: 'COMPLETED',
    currentStepIndex: 0,
    steps: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

// Empty by default — no test in this file (other than the unresolved-market OPEN test below)
// reaches the fallback pair label, since `resolveMarket` always resolves MARKET.
const defaultCurrencyInfos = new Map()

function build({
  plan,
  history = [],
  action,
  leverage = 2,
  currencyInfos = defaultCurrencyInfos,
  resolveMarketOverride = resolveMarket,
}: {
  plan: MarginPlanResponse
  history?: MarginTerminalPosition[]
  action?: Parameters<typeof buildCompletionToastMessage>[0]['action']
  leverage?: number
  currencyInfos?: Map<string, CurrencyInfo>
  resolveMarketOverride?: MarginMarketResolver
}): string {
  return buildCompletionToastMessage({
    plan,
    history,
    action,
    leverage,
    t,
    formatNumberOrString,
    resolveMarket: resolveMarketOverride,
    currencyInfos,
  })
}

describe('buildCompletionToastMessage', () => {
  it('reports add margin with its own completion copy', () => {
    expect(build({ plan: makePlan(), action: 'add' })).toBe('margin.toast.marginAdded')
  })

  it('reports withdraw margin with its own completion copy', () => {
    expect(build({ plan: makePlan(), action: 'withdraw' })).toBe('margin.toast.marginWithdrawn')
  })

  it('reports change leverage with its own completion copy', () => {
    expect(build({ plan: makePlan(), action: 'leverage' })).toBe('margin.toast.leverageUpdated')
  })

  it('reports the advanced modal as a position adjustment', () => {
    expect(build({ plan: makePlan(), action: 'adjust' })).toBe('margin.toast.positionAdjusted')
  })

  // A plan resumed after a reload has no originating action on the store.
  it('falls back to the generic adjustment sentence with no action', () => {
    expect(build({ plan: makePlan() })).toBe('margin.toast.positionAdjusted')
  })

  it('never reports an ADJUST run with the modal title', () => {
    for (const action of ['add', 'withdraw', 'leverage', 'adjust', undefined] as const) {
      expect(build({ plan: makePlan(), action })).not.toBe('margin.plan.title.adjust')
    }
  })

  it('keeps the open plan size + leverage interpolation', () => {
    const plan = makePlan({
      intent: 'OPEN',
      steps: [{ stepIndex: 0, stepType: 'MARGIN_OPEN', tokenOutAmount: `${2n * 10n ** 18n}` }],
    } as unknown as Partial<MarginPlanResponse>)
    expect(build({ plan })).toBe('margin.toast.openedLong|2 ETH,2x')
    // A second leverage value: without it, "interpolates the leverage" and "hardcodes 2x" are
    // indistinguishable.
    expect(build({ plan, leverage: 4.5 })).toBe('margin.toast.openedLong|2 ETH,4.5x')
    // The wire's openedLeverage is a raw ratio: without rounding it renders sixty digits of drift.
    expect(build({ plan, leverage: 3.278688524590164 })).toBe('margin.toast.openedLong|2 ETH,3.3x')
  })

  // Direction comes off the plan's own wire tokens, not the resolved market — a hardcoded key would
  // pass a single-direction test, so both directions are asserted explicitly.
  it('uses the long toast key for a long open (collateral is the volatile leg)', () => {
    const plan = makePlan({
      intent: 'OPEN',
      collateralToken: COLLATERAL,
      debtToken: DEBT,
      steps: [{ stepIndex: 0, stepType: 'MARGIN_OPEN', tokenOutAmount: `${2n * 10n ** 18n}` }],
    } as unknown as Partial<MarginPlanResponse>)
    expect(build({ plan })).toBe('margin.toast.openedLong|2 ETH,2x')
  })

  it('falls back to a normalised pair, never the raw wire marketKey, when the open market cannot resolve', () => {
    const plan = makePlan({
      intent: 'OPEN',
      collateralToken: COLLATERAL,
      debtToken: DEBT,
      steps: [{ stepIndex: 0, stepType: 'MARGIN_OPEN', tokenOutAmount: `${2n * 10n ** 18n}` }],
    } as unknown as Partial<MarginPlanResponse>)
    const message = build({ plan, resolveMarketOverride: () => undefined })
    expect(message).not.toContain(plan.marketKey)
    expect(message).toBe(
      `margin.toast.openedLong|${shortenAddress({ address: COLLATERAL })} / ${shortenAddress({ address: DEBT })},2x`,
    )
  })

  it('uses the short toast key for a short open (debt is the volatile leg)', () => {
    const plan = makePlan({
      intent: 'OPEN',
      collateralToken: DEBT,
      debtToken: COLLATERAL,
      steps: [{ stepIndex: 0, stepType: 'MARGIN_OPEN', tokenOutAmount: `${2n * 10n ** 18n}` }],
    } as unknown as Partial<MarginPlanResponse>)
    expect(build({ plan })).toBe('margin.toast.openedShort|2 ETH,2x')
  })

  // Pins the wire contract against a plausible-looking "route this through marginExposureLeg like the
  // table cells do" change: the backend sets MARGIN_OPEN's tokenOut to the market's COLLATERAL token
  // and tokenOutAmount to collateralToBuy + equity, for BOTH directions. A short market's collateral
  // is the stable leg, so sizing off the exposure leg would divide a 6-decimal amount by 18 and report
  // ~1e-12 of the real figure.
  it('sizes an open off the collateral leg even on a short market, matching the wire', () => {
    const shortMarket = {
      ...MARKET,
      displaySymbol: 'USDC',
      collateral: { address: DEBT, symbol: 'USDC', decimals: 6 },
      debt: { address: COLLATERAL, symbol: 'WETH', decimals: 18 },
    } as typeof MARKET
    const plan = makePlan({
      intent: 'OPEN',
      collateralToken: DEBT,
      debtToken: COLLATERAL,
      steps: [{ stepIndex: 0, stepType: 'MARGIN_OPEN', tokenOutAmount: `${4000n * 10n ** 6n}` }],
    } as unknown as Partial<MarginPlanResponse>)
    expect(build({ plan, resolveMarketOverride: () => shortMarket })).toBe('margin.toast.openedShort|4000 USDC,2x')
  })

  // The toast and the history row must quote the same number, so both read realizedPnlUsd. The old
  // collateral-token realizedPnl stays on the wire and is deliberately NOT what this interpolates.
  const closedRow = (overrides: Partial<MarginTerminalPosition> = {}): MarginTerminalPosition => ({
    status: 'COMPLETED',
    positionId: 'pos-1',
    direction: MarginDirection.LONG,
    exposureToken: { address: COLLATERAL, chainId: 1, decimals: 18 },
    counterToken: { address: DEBT, chainId: 1, decimals: 6 },
    size: '0',
    entryPrice: '0',
    openedAt: '0',
    legs: [{ venue: 'MORPHO', subId: '7', account: '0xaccount', debt: '0' }],
    isTradable: true,
    closedAt: '1',
    realizedPnl: `${10n ** 18n}`,
    realizedPnlUsd: `${1234n * 10n ** 6n}`,
    closeTxHash: '0xhash',
    ...overrides,
  })

  it('interpolates the close realized PnL in USD, from the stable leg decimals', () => {
    const plan = makePlan({ intent: 'CLOSE' })
    expect(build({ plan, history: [closedRow()] })).toBe('margin.toast.closed|+1234')
  })

  it('signs a losing close', () => {
    const plan = makePlan({ intent: 'CLOSE' })
    expect(build({ plan, history: [closedRow({ realizedPnlUsd: `-${1234n * 10n ** 6n}` })] })).toBe(
      'margin.toast.closed|-1234',
    )
  })

  it('renders an em dash when the exit could not be valued', () => {
    const plan = makePlan({ intent: 'CLOSE' })
    expect(build({ plan, history: [closedRow({ realizedPnlUsd: undefined })] })).toBe('margin.toast.closed|—')
  })

  it('renders an em dash for an untradable pair rather than a figure priced off a non-USD leg', () => {
    const plan = makePlan({ intent: 'CLOSE' })
    expect(build({ plan, history: [closedRow({ isTradable: false })] })).toBe('margin.toast.closed|—')
  })
})

// The toast used to interpolate the live form slider, which a retry-open (fixed 2x) and any edit made
// between plan creation and completion both contradict.
describe('findOpenedLeverageForPlan', () => {
  const position = (overrides: Partial<MarginActivePosition> = {}): MarginActivePosition => ({
    status: 'ACTIVE',
    positionId: 'pos-1',
    direction: MarginDirection.LONG,
    exposureToken: { address: COLLATERAL, chainId: 1, decimals: 18 },
    counterToken: { address: DEBT, chainId: 1, decimals: 6 },
    size: '0',
    entryPrice: '0',
    openedAt: '0',
    legs: [{ venue: 'MORPHO', subId: '7', account: '0xaccount', debt: '0' }],
    isTradable: true,
    equity: '0',
    oraclePrice: '0',
    liquidationPrice: '0',
    buffer: '0',
    healthFactor: '0',
    maxWithdrawable: '0',
    openedLeverage: '3',
    ...overrides,
  })

  it('reads the opened leverage off the position the plan created', () => {
    const plan = makePlan({ intent: 'OPEN' })
    expect(findOpenedLeverageForPlan({ plan, positions: [position()] })).toBeCloseTo(3, 6)
  })

  it('ignores a position on another subId', () => {
    const plan = makePlan({ intent: 'OPEN', subId: '9' })
    expect(findOpenedLeverageForPlan({ plan, positions: [position()] })).toBeUndefined()
  })

  it('is undefined when the position is not indexed yet, so the caller can fall back', () => {
    const plan = makePlan({ intent: 'OPEN' })
    expect(findOpenedLeverageForPlan({ plan, positions: [] })).toBeUndefined()
    expect(findOpenedLeverageForPlan({ plan, positions: [position({ openedLeverage: undefined })] })).toBeUndefined()
  })

  it('is undefined for the 0 the indexer stamps when it never recorded a ratio', () => {
    const plan = makePlan({ intent: 'OPEN' })
    const unstamped = position({ openedLeverage: '0' })
    expect(findOpenedLeverageForPlan({ plan, positions: [unstamped] })).toBeUndefined()
  })
})
