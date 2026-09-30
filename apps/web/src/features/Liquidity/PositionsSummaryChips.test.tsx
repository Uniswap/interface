import userEvent from '@testing-library/user-event'
import { TestID } from '@universe/test'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  type UseWalletPositionsBalanceResult,
  useWalletPositionsBalance,
} from 'uniswap/src/features/positions/hooks/useWalletPositionsBalance'
import { NumberType } from 'utilities/src/format/types'
import { PositionsSummaryChips } from '~/features/Liquidity/PositionsSummaryChips'
import { usePendingLPTransactionsChangeListener } from '~/state/transactions/hooks'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/positions/hooks/useWalletPositionsBalance', () => ({
  useWalletPositionsBalance: vi.fn(),
}))

// The modal's data plumbing is covered by its own spec; here it only needs to reveal open/closed.
vi.mock('~/features/Liquidity/fees/YourFeesModal', () => ({
  YourFeesModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid={TestID.YourFeesModal} /> : null),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: vi.fn(),
}))

// The rewards chips are out of scope here; keep their queries from firing.
vi.mock('uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards', () => ({
  useGetPoolsRewards: () => ({ data: undefined, isLoading: false, error: undefined }),
}))

vi.mock('~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards', () => ({
  useLpIncentiveRewards: () => ({ totalUsd: 0, rewardTokens: [], hasRewards: false, isLoading: false, isError: false }),
}))

vi.mock('~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewardsUsdValue', () => ({
  useLpIncentiveRewardsUsdValue: () => ({ formattedUsdValue: undefined }),
}))

vi.mock('~/state/transactions/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/transactions/hooks')>()),
  usePendingLPTransactionsChangeListener: vi.fn(),
}))

const WALLET = '0x0000000000000000000000000000000000000123' as const

function mockBalance(overrides: Partial<UseWalletPositionsBalanceResult>): void {
  mocked(useWalletPositionsBalance).mockReturnValue({
    totalLiquidityUsd: undefined,
    totalFeesUsd: undefined,
    isLoading: false,
    refetch: vi.fn(),
    ...overrides,
  })
}

function renderChips(props?: Partial<React.ComponentProps<typeof PositionsSummaryChips>>): void {
  render(<PositionsSummaryChips walletAddress={WALLET} {...props} />)
}

function totalLiquidityText(): string | null {
  return screen.getByTestId(TestID.PositionsSummaryTotalLiquidity).textContent
}

beforeEach(() => {
  mocked(useLocalizationContext).mockReturnValue({
    // FiatTokenQuantity's sub-cent form is the only type-specific behavior the chip depends on.
    convertFiatAmountFormatted: (value: number, type: NumberType) =>
      type === NumberType.FiatTokenQuantity && value > 0 && value < 0.01 ? '<$0.01' : `$${Number(value).toFixed(2)}`,
  } as unknown as ReturnType<typeof useLocalizationContext>)
  mockBalance({})
})

describe('PositionsSummaryChips balance refresh', () => {
  it('subscribes the balance refetch to LP transaction changes', () => {
    const refetch = vi.fn()
    mockBalance({ refetch })

    renderChips()

    expect(mocked(usePendingLPTransactionsChangeListener)).toHaveBeenCalledWith(refetch)
  })
})

describe('PositionsSummaryChips total liquidity', () => {
  it('renders a real zero total as zero', () => {
    mockBalance({ totalLiquidityUsd: 0 })

    renderChips()

    expect(totalLiquidityText()).toBe('$0.00')
  })

  it('shows no figure at all while the request is in flight', () => {
    mockBalance({ isLoading: true })

    renderChips()

    // The original bug: an unsettled total rendering as a settled $0.00 under real position rows.
    expect(screen.queryByTestId(TestID.PositionsSummaryTotalLiquidity)).not.toBeInTheDocument()
  })

  it('shows a placeholder rather than $0.00 when the total is unknown', () => {
    mockBalance({ totalLiquidityUsd: undefined })

    renderChips()

    expect(totalLiquidityText()).toBe('-')
  })
})

// Same settled-vs-unknown semantics as the liquidity chip: both figures ride the same
// GetWalletPositionsBalance response.
describe('PositionsSummaryChips total fees', () => {
  function totalFeesText(): string | null {
    return screen.getByTestId(TestID.PositionsSummaryTotalFees).textContent
  }

  it('renders the server-reported fees total', () => {
    mockBalance({ totalFeesUsd: 12.34 })

    renderChips()

    expect(totalFeesText()).toBe('$12.34')
  })

  it('renders a real zero total as zero', () => {
    mockBalance({ totalFeesUsd: 0 })

    renderChips()

    expect(totalFeesText()).toBe('$0.00')
  })

  it('renders a sub-cent total as <$0.01 rather than a settled-looking $0.00', () => {
    mockBalance({ totalFeesUsd: 0.004 })

    renderChips()

    expect(totalFeesText()).toBe('<$0.01')
  })

  it('shows no figure at all while the request is in flight', () => {
    mockBalance({ isLoading: true })

    renderChips()

    expect(screen.queryByTestId(TestID.PositionsSummaryTotalFees)).not.toBeInTheDocument()
  })

  it('shows a placeholder rather than $0.00 when the total is unknown', () => {
    mockBalance({ totalFeesUsd: undefined })

    renderChips()

    expect(totalFeesText()).toBe('-')
  })
})

describe('PositionsSummaryChips fees collect', () => {
  it('opens the Your fees modal from the Collect button when the total is positive', async () => {
    const user = userEvent.setup()
    mockBalance({ totalFeesUsd: 12.34 })

    renderChips()

    expect(screen.queryByTestId(TestID.YourFeesModal)).not.toBeInTheDocument()
    await user.click(screen.getByTestId(TestID.PositionsSummaryCollectFees))
    expect(screen.getByTestId(TestID.YourFeesModal)).toBeInTheDocument()
  })

  it('keeps Collect disabled when the settled total is zero', () => {
    mockBalance({ totalFeesUsd: 0 })

    renderChips()

    expect(screen.getByTestId(TestID.PositionsSummaryCollectFees)).toBeDisabled()
    expect(screen.queryByTestId(TestID.YourFeesModal)).not.toBeInTheDocument()
  })

  it('keeps Collect disabled while the total is unknown', () => {
    mockBalance({ totalFeesUsd: undefined })

    renderChips()

    expect(screen.getByTestId(TestID.PositionsSummaryCollectFees)).toBeDisabled()
  })

  it('hides the Collect affordance and modal entirely when viewing an external wallet', () => {
    mockBalance({ totalFeesUsd: 12.34 })

    renderChips({ showActions: false })

    expect(screen.queryByTestId(TestID.PositionsSummaryCollectFees)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.YourFeesModal)).not.toBeInTheDocument()
  })
})
