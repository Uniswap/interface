import userEvent from '@testing-library/user-event'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { TestID } from '@universe/test'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import {
  type UseWalletPositionsBalanceResult,
  useWalletPositionsBalance,
} from 'uniswap/src/features/positions/hooks/useWalletPositionsBalance'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/assets/constants'
import { YourFeesModal } from '~/features/Liquidity/fees/YourFeesModal'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'
import { mocked } from '~/test-utils/mocked'
import { buildFeePosition, mockUseWalletPositions } from '~/test-utils/pools/feePositionFixtures'
import { render, screen } from '~/test-utils/render'

vi.mock('~/state/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/hooks')>()),
  useAppDispatch: vi.fn(),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: vi.fn(),
}))

vi.mock('uniswap/src/features/positions/hooks/useWalletPositions', () => ({
  useWalletPositions: vi.fn(),
}))

vi.mock('uniswap/src/features/positions/hooks/useWalletPositionsBalance', () => ({
  useWalletPositionsBalance: vi.fn(),
}))

// The real Modal is a Radix dialog / bottom sheet; render straight through like the other modal specs.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }) =>
    isModalOpen ? <div>{children}</div> : null,
}))

const dispatch = vi.fn()

function mockBalance(overrides: Partial<UseWalletPositionsBalanceResult>): void {
  mocked(useWalletPositionsBalance).mockReturnValue({
    totalLiquidityUsd: undefined,
    totalFeesUsd: undefined,
    isLoading: false,
    refetch: vi.fn(),
    ...overrides,
  })
}

function renderModal(props?: Partial<React.ComponentProps<typeof YourFeesModal>>): void {
  render(<YourFeesModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} {...props} />)
}

describe('YourFeesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useAppDispatch).mockReturnValue(dispatch)
    mocked(useLocalizationContext).mockReturnValue({
      convertFiatAmountFormatted: (value: number | string | undefined | null) => `$${Number(value ?? 0).toFixed(2)}`,
    } as unknown as ReturnType<typeof useLocalizationContext>)
    mockUseWalletPositions([])
    mockBalance({})
  })

  it('renders nothing while closed and fetches no positions', () => {
    renderModal({ isOpen: false })

    expect(screen.queryByTestId(TestID.YourFeesModal)).not.toBeInTheDocument()
    // Closed = disabled positions crawl: the hook must be called without an account.
    expect(mocked(useWalletPositions)).toHaveBeenCalledWith(expect.objectContaining({ account: '' }))
  })

  it('shows the balance-endpoint total as the hero figure', () => {
    mockBalance({ totalFeesUsd: 268.9 })
    mockUseWalletPositions([buildFeePosition({ poolId: 'a', uncollectedFeesUsd: 50 })])

    renderModal()

    expect(screen.getByTestId(TestID.YourFeesModalTotal)).toHaveTextContent('$268.90')
  })

  it('renders a row per collectable position, largest fees first', () => {
    mockBalance({ totalFeesUsd: 100 })
    mockUseWalletPositions([
      buildFeePosition({ poolId: 'small', uncollectedFeesUsd: 1 }),
      buildFeePosition({ poolId: 'big', uncollectedFeesUsd: 90 }),
      buildFeePosition({ poolId: 'v2-pair', uncollectedFeesUsd: 5, version: ProtocolVersion.V2 }),
      buildFeePosition({ poolId: 'zero', uncollectedFeesUsd: 0 }),
    ])

    renderModal()

    const rows = screen.getAllByTestId(TestID.PortfolioPoolsFeesRow)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('$90.00')
    expect(rows[1]).toHaveTextContent('$1.00')
  })

  it('collapses past four rows behind an expando', () => {
    mockBalance({ totalFeesUsd: 100 })
    mockUseWalletPositions(
      Array.from({ length: 7 }, (_, i) => buildFeePosition({ poolId: `pool-${i}`, uncollectedFeesUsd: 7 - i })),
    )

    renderModal()

    expect(screen.getAllByTestId(TestID.PortfolioPoolsFeesRow)).toHaveLength(4)
    expect(screen.getByText('3 more')).toBeInTheDocument()
  })

  it('hands a row off to the claim modal and closes itself', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const target = buildFeePosition({ poolId: 'target', uncollectedFeesUsd: 50 })
    mockBalance({ totalFeesUsd: 50 })
    mockUseWalletPositions([target])

    renderModal({ onClose })

    await user.click(screen.getByRole('button', { name: 'Collect' }))

    expect(onClose).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith(setOpenModal({ name: ModalName.ClaimFee, initialState: target }))
  })

  it('shows an error message when the positions fetch fails', () => {
    mockBalance({ totalFeesUsd: 1 })
    mockUseWalletPositions([], { error: new Error('boom') })

    renderModal()

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
