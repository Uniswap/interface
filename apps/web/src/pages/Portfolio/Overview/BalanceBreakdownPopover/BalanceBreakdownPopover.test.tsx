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
const earnValue: PortfolioTotalValue = { balanceUSD: 3259.01, percentChange: 2.2, absoluteChangeUSD: 70 }

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
  earn?: PortfolioTotalValue
  tokensPercentChange?: number
  poolsPercentChange?: number
  earnPercentChange?: number
  disabled?: boolean
}) {
  return render(
    <BalanceBreakdownPopover
      tokens={props.tokens}
      pools={props.pools}
      earn={props.earn}
      tokensPercentChange={props.tokensPercentChange}
      poolsPercentChange={props.poolsPercentChange}
      earnPercentChange={props.earnPercentChange}
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

  it('renders all positive balance rows through the popover content wiring', () => {
    renderPopover({ tokens: tokensValue, pools: poolsValue, earn: earnValue })

    expect(screen.getByTestId(TestID.BalanceBreakdownRowTokens)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.BalanceBreakdownRowEarn)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.BalanceBreakdownRowPools)).toBeInTheDocument()
  })
})

describe(buildBalanceBreakdownRows, () => {
  const noPercents = { tokensPercentChange: undefined, poolsPercentChange: undefined, earnPercentChange: undefined }

  it('returns an empty list when only one category is positive', () => {
    expect(buildBalanceBreakdownRows({ tokens: undefined, pools: poolsValue, earn: undefined, ...noPercents })).toEqual(
      [],
    )
    expect(
      buildBalanceBreakdownRows({ tokens: tokensValue, pools: undefined, earn: undefined, ...noPercents }),
    ).toEqual([])
  })

  it.each([
    {
      tokens: { balanceUSD: 0, percentChange: 0, absoluteChangeUSD: 0 },
      pools: poolsValue,
      label: 'tokens=0 leaves only pools',
    },
    {
      tokens: tokensValue,
      pools: { balanceUSD: 0, percentChange: 0, absoluteChangeUSD: 0 },
      label: 'pools=0 leaves only tokens',
    },
    {
      tokens: { balanceUSD: undefined, percentChange: 1, absoluteChangeUSD: undefined },
      pools: poolsValue,
      label: 'tokens balanceUSD undefined leaves only pools',
    },
  ] as const)('returns an empty list when $label (earn absent)', ({ tokens, pools }) => {
    expect(buildBalanceBreakdownRows({ tokens, pools, earn: undefined, ...noPercents })).toEqual([])
  })

  it('orders rows tokens → earn → pools regardless of value', () => {
    const rows = buildBalanceBreakdownRows({ tokens: tokensValue, pools: poolsValue, earn: earnValue, ...noPercents })

    expect(rows.map((r) => r.kind)).toEqual(['tokens', 'earn', 'pools'])
  })

  it('keeps the fixed order even when pools balance exceeds tokens balance', () => {
    const rows = buildBalanceBreakdownRows({
      tokens: { balanceUSD: 100, percentChange: 0.5, absoluteChangeUSD: 1 },
      pools: { balanceUSD: 9999, percentChange: 12.5, absoluteChangeUSD: 1000 },
      earn: undefined,
      ...noPercents,
    })

    expect(rows.map((r) => r.kind)).toEqual(['tokens', 'pools'])
  })

  it('omits earn when its balance is not positive', () => {
    const rows = buildBalanceBreakdownRows({
      tokens: tokensValue,
      pools: poolsValue,
      earn: { balanceUSD: 0, percentChange: 0, absoluteChangeUSD: 0 },
      ...noPercents,
    })

    expect(rows.map((r) => r.kind)).toEqual(['tokens', 'pools'])
  })

  it('uses the period percent change rather than the wallet-balance 24h value', () => {
    const [tokenRow] = buildBalanceBreakdownRows({
      tokens: tokensValue,
      pools: poolsValue,
      earn: undefined,
      tokensPercentChange: 3.21,
      poolsPercentChange: -0.5,
      earnPercentChange: undefined,
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

  it('renders the earn row with the formatted USD value, percent, and earn-row testID', () => {
    render(<BalanceBreakdownRow kind="earn" valueUSD={3259.01} percentChange={2.2} />)

    expect(screen.getByTestId(TestID.BalanceBreakdownRowEarn)).toBeInTheDocument()
    expect(screen.getByLabelText('Earning balance')).toBeInTheDocument()
    expect(screen.getByText(/3,259\.01/)).toBeInTheDocument()
    expect(screen.getByText(/2\.2/)).toBeInTheDocument()
  })

  it('renders a placeholder percent when the change is undefined', () => {
    render(<BalanceBreakdownRow kind="tokens" valueUSD={100} percentChange={undefined} />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
