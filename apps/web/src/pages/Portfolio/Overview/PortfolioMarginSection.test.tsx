import { TestID } from '@universe/test'
import type {
  MarginActivePosition,
  MarginPendingPlan,
  MarginPositionsResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PortfolioMarginSection } from '~/pages/Portfolio/Overview/PortfolioMarginSection'
import { render, screen } from '~/test-utils/render'

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: { current: { data: undefined as MarginPositionsResponse | undefined, isLoading: false } },
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery')>()),
  useMarginPositionsQuery: () => mockQuery.current,
}))

vi.mock('~/features/margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

vi.mock('~/features/margin/hooks/useResolveMarginMarket', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/margin/hooks/useResolveMarginMarket')>()),
  useResolveMarginMarket: () => () => undefined,
}))

const ACCOUNT = '0x000000000000000000000000000000000000000A'
const WETH = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1, decimals: 18 }
const USDC = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1, decimals: 6 }

function position(positionId: string, openedAt: string): MarginActivePosition {
  return {
    status: 'ACTIVE',
    positionId,
    direction: MarginDirection.LONG,
    exposureToken: WETH,
    counterToken: USDC,
    size: '1000000000000000000',
    entryPrice: '2000000000000000000000',
    openedAt,
    legs: [{ venue: 'MORPHO', subId: positionId, account: ACCOUNT, debt: '500000000' }],
    isTradable: true,
    equity: '1000000000000000000',
    oraclePrice: '2000000000000000000000',
    liquidationPrice: '1000000000000000000000',
    buffer: '500000000000000000',
    healthFactor: '1500000000000000000',
    maxWithdrawable: '400000000000000000',
    leverage: '1.5',
    unrealizedPnl: '10000000000000000',
  }
}

const PENDING: MarginPendingPlan = {
  planId: 'plan-1',
  createdAt: String(Date.now() - 12 * 60 * 1000),
  marketKey: 'k',
  venue: 'MORPHO',
  collateralToken: WETH.address,
  debtToken: USDC.address,
  currentStep: 0,
  stepCount: 2,
  cancellable: true,
}

function setData({
  positions = [],
  pendingPlans = [],
}: {
  positions?: MarginActivePosition[]
  pendingPlans?: MarginPendingPlan[]
}): void {
  mockQuery.current = { data: { requestId: 'r', positions, pendingPlans }, isLoading: false }
}

afterEach(() => {
  mockQuery.current = { data: undefined, isLoading: false }
})

describe('PortfolioMarginSection', () => {
  it('renders nothing without open positions', () => {
    setData({})
    render(<PortfolioMarginSection account={ACCOUNT} isReadOnly={false} />)
    expect(screen.queryByTestId(TestID.PortfolioOverviewMarginSection)).not.toBeInTheDocument()
  })

  it('renders nothing when the only margin activity is an incomplete open', () => {
    setData({ pendingPlans: [PENDING] })
    render(<PortfolioMarginSection account={ACCOUNT} isReadOnly={false} />)
    expect(screen.queryByTestId(TestID.PortfolioOverviewMarginSection)).not.toBeInTheDocument()
  })

  it('counts only open positions in the header', () => {
    setData({ positions: [position('1', '1700000000'), position('2', '1700000100')], pendingPlans: [PENDING] })
    render(<PortfolioMarginSection account={ACCOUNT} isReadOnly={false} />)
    expect(screen.getByText('2 open margin positions')).toBeInTheDocument()
    expect(screen.getAllByTestId(TestID.PortfolioOverviewMarginPositionRow)).toHaveLength(2)
  })

  it('caps positions at the five most recent', () => {
    const positions = ['1', '2', '3', '4', '5', '6', '7'].map((id) => position(id, String(1700000000 + Number(id))))
    setData({ positions })
    render(<PortfolioMarginSection account={ACCOUNT} isReadOnly={false} />)
    expect(screen.getAllByTestId(TestID.PortfolioOverviewMarginPositionRow)).toHaveLength(5)
    expect(screen.getByText('7 open margin positions')).toBeInTheDocument()
  })

  it('shows direction and current leverage on a position', () => {
    setData({ positions: [position('1', '1700000000')] })
    render(<PortfolioMarginSection account={ACCOUNT} isReadOnly={false} />)
    expect(screen.getByText(/^Long \S+x$/)).toBeInTheDocument()
  })

  // A short's PnL is in its collateral, the stable counter token: 76 USDC, not 7.6e-11 of the WETH it borrowed.
  it("reads a short's unrealized PnL in its collateral token", () => {
    setData({
      positions: [
        {
          ...position('1', '1700000000'),
          direction: MarginDirection.SHORT,
          equity: '2076000000',
          unrealizedPnl: '76000000',
          roe: '38000000000000000',
        },
      ],
    })
    render(<PortfolioMarginSection account={ACCOUNT} isReadOnly={false} />)
    expect(screen.getByText('+76.00')).toBeInTheDocument()
    expect(screen.getByText('▲ 3.80%')).toBeInTheDocument()
  })

  it('links to /margin, except on a read-only portfolio', () => {
    setData({ positions: [position('1', '1700000000')] })
    const { unmount } = render(<PortfolioMarginSection account={ACCOUNT} isReadOnly={false} />)
    expect(screen.getByTestId(TestID.PortfolioOverviewViewAllMargin)).toBeInTheDocument()
    unmount()

    render(<PortfolioMarginSection account={ACCOUNT} isReadOnly />)
    expect(screen.queryByTestId(TestID.PortfolioOverviewViewAllMargin)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioOverviewMarginPositionRow)).not.toBeInTheDocument()
  })
})
