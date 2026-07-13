import type { ReactNode } from 'react'
import type { PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import {
  BalanceBreakdownPopover,
  buildBalanceBreakdownRows,
} from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/BalanceBreakdownPopover'
import { BalanceBreakdownRow } from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/BalanceBreakdownRow'
import { render, screen } from '~/test-utils/render'

const TRIGGER_TEXT = 'Trigger child'

const tokensValue: PortfolioTotalValue = { balanceUSD: 8368.94, percentChange: -6.09, absoluteChangeUSD: -510 }
const poolsValue: PortfolioTotalValue = { balanceUSD: 7373.05, percentChange: 1.02, absoluteChangeUSD: 75 }

vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  const MockPopover = Object.assign(({ children }: { children: ReactNode }) => <>{children}</>, {
    Trigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    Content: ({ children }: { children: ReactNode }) => <>{children}</>,
  })

  return {
    ...actual,
    Popover: MockPopover,
    AdaptiveWebPopoverContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

function renderPopover(props: {
  tokens?: PortfolioTotalValue
  pools?: PortfolioTotalValue
  tokensPercentChange?: number
  poolsPercentChange?: number
  disabled?: boolean
}) {
  return render(
    <BalanceBreakdownPopover
      tokens={props.tokens}
      pools={props.pools}
      tokensPercentChange={props.tokensPercentChange}
      poolsPercentChange={props.poolsPercentChange}
      disabled={props.disabled}
    >
      <span>{TRIGGER_TEXT}</span>
    </BalanceBreakdownPopover>,
  )
}

describe('BalanceBreakdownPopover (visibility gate)', () => {
  it('renders only the children when tokens value is undefined', () => {
    renderPopover({ tokens: undefined, pools: poolsValue })

    expect(screen.getByText(TRIGGER_TEXT)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownPopover)).not.toBeInTheDocument()
  })

  it('renders only the children when pools value is undefined', () => {
    renderPopover({ tokens: tokensValue, pools: undefined })

    expect(screen.getByText(TRIGGER_TEXT)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownPopover)).not.toBeInTheDocument()
  })

  it('renders only the children when either side has a balance of 0', () => {
    renderPopover({
      tokens: { balanceUSD: 0, percentChange: 0, absoluteChangeUSD: 0 },
      pools: poolsValue,
    })

    expect(screen.getByText(TRIGGER_TEXT)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownPopover)).not.toBeInTheDocument()
  })

  it('renders only the children when either side has an undefined balanceUSD', () => {
    renderPopover({
      tokens: { balanceUSD: undefined, percentChange: 1, absoluteChangeUSD: undefined },
      pools: poolsValue,
    })

    expect(screen.getByText(TRIGGER_TEXT)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownPopover)).not.toBeInTheDocument()
  })

  it('wraps the children in a popover trigger when both sides are positive', () => {
    renderPopover({ tokens: tokensValue, pools: poolsValue })

    expect(screen.getByText(TRIGGER_TEXT)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.BalanceBreakdownPopover)).toBeInTheDocument()
  })

  it('renders only the children when disabled, even with both sides positive', () => {
    renderPopover({ tokens: tokensValue, pools: poolsValue, disabled: true })

    expect(screen.getByText(TRIGGER_TEXT)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownPopover)).not.toBeInTheDocument()
  })

  it('renders both balance rows through the popover content wiring', () => {
    renderPopover({ tokens: tokensValue, pools: poolsValue })

    expect(screen.getByTestId(TestID.BalanceBreakdownRowTokens)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.BalanceBreakdownRowPools)).toBeInTheDocument()
  })
})

describe(buildBalanceBreakdownRows, () => {
  const noPercents = { tokensPercentChange: undefined, poolsPercentChange: undefined }

  it('returns an empty list when tokens is undefined', () => {
    expect(buildBalanceBreakdownRows({ tokens: undefined, pools: poolsValue, ...noPercents })).toEqual([])
  })

  it('returns an empty list when pools is undefined', () => {
    expect(buildBalanceBreakdownRows({ tokens: tokensValue, pools: undefined, ...noPercents })).toEqual([])
  })

  it.each([
    { tokens: { balanceUSD: 0, percentChange: 0, absoluteChangeUSD: 0 }, pools: poolsValue, label: 'tokens=0' },
    { tokens: tokensValue, pools: { balanceUSD: 0, percentChange: 0, absoluteChangeUSD: 0 }, label: 'pools=0' },
    {
      tokens: { balanceUSD: undefined, percentChange: 1, absoluteChangeUSD: undefined },
      pools: poolsValue,
      label: 'tokens balanceUSD undefined',
    },
  ] as const)('returns an empty list when $label', ({ tokens, pools }) => {
    expect(buildBalanceBreakdownRows({ tokens, pools, ...noPercents })).toEqual([])
  })

  it('orders rows tokens-first when tokens balance > pools balance', () => {
    const rows = buildBalanceBreakdownRows({ tokens: tokensValue, pools: poolsValue, ...noPercents })

    expect(rows.map((r) => r.kind)).toEqual(['tokens', 'pools'])
  })

  it('orders rows pools-first when pools balance > tokens balance', () => {
    const rows = buildBalanceBreakdownRows({
      tokens: { balanceUSD: 100, percentChange: 0.5, absoluteChangeUSD: 1 },
      pools: { balanceUSD: 9999, percentChange: 12.5, absoluteChangeUSD: 1000 },
      ...noPercents,
    })

    expect(rows.map((r) => r.kind)).toEqual(['pools', 'tokens'])
  })

  it('uses the period percent change rather than the wallet-balance 24h value', () => {
    const [tokenRow] = buildBalanceBreakdownRows({
      tokens: tokensValue,
      pools: poolsValue,
      tokensPercentChange: 3.21,
      poolsPercentChange: -0.5,
    })

    expect(tokenRow).toEqual({ kind: 'tokens', valueUSD: 8368.94, percentChange: 3.21 })
  })
})

describe(BalanceBreakdownRow, () => {
  it('renders the tokens row with the formatted USD value, percent, and tokens-row testID', () => {
    render(<BalanceBreakdownRow kind="tokens" valueUSD={8368.94} percentChange={-6.09} />)

    expect(screen.getByTestId(TestID.BalanceBreakdownRowTokens)).toBeInTheDocument()
    expect(screen.getByLabelText('Token balance')).toBeInTheDocument()
    expect(screen.getByText(/8,368\.94/)).toBeInTheDocument()
    expect(screen.getByText(/6\.09/)).toBeInTheDocument()
  })

  it('renders the pools row with the formatted USD value, percent, and pools-row testID', () => {
    render(<BalanceBreakdownRow kind="pools" valueUSD={7373.05} percentChange={1.02} />)

    expect(screen.getByTestId(TestID.BalanceBreakdownRowPools)).toBeInTheDocument()
    expect(screen.getByLabelText('Pools balance')).toBeInTheDocument()
    expect(screen.getByText(/7,373\.05/)).toBeInTheDocument()
    expect(screen.getByText(/1\.02/)).toBeInTheDocument()
  })

  it('renders a placeholder percent when the change is undefined', () => {
    render(<BalanceBreakdownRow kind="tokens" valueUSD={100} percentChange={undefined} />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
