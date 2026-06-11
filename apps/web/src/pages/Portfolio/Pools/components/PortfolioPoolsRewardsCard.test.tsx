import userEvent from '@testing-library/user-event'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useGetPoolsRewards } from 'uniswap/src/data/rest/getPoolsRewards'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { useLpIncentives } from '~/features/Liquidity/hooks/useLpIncentives'
import { PortfolioPoolsRewardsCard } from '~/pages/Portfolio/Pools/components/PortfolioPoolsRewardsCard'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/data/rest/getPoolsRewards', () => ({
  useGetPoolsRewards: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: vi.fn(),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: vi.fn(),
}))

vi.mock('~/features/Liquidity/hooks/useLpIncentives', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Liquidity/hooks/useLpIncentives')>()),
  useLpIncentives: vi.fn(),
}))

vi.mock('~/features/Liquidity/LPIncentives/LpIncentiveClaimModal', () => ({
  LpIncentiveClaimModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="claim-modal-open" /> : null),
}))

const openModal = vi.fn()
const closeModal = vi.fn()
const setTokenRewards = vi.fn()
const onTransactionSuccess = vi.fn()

const ONE_UNI = (BigInt(10) ** BigInt(18)).toString()
const POINT_ZERO_ZERO_ZERO_ONE_UNI = (BigInt(10) ** BigInt(14)).toString() // 0.0001 UNI, below 0.001 threshold

function mockRewards(
  data: { totalUnclaimedAmountUni: string } | undefined,
  opts: { isLoading?: boolean; error?: Error } = {},
): void {
  mocked(useGetPoolsRewards).mockReturnValue({
    data,
    isLoading: opts.isLoading ?? false,
    error: opts.error ?? null,
  } as unknown as ReturnType<typeof useGetPoolsRewards>)
}

function mockLpIncentives(overrides: Partial<ReturnType<typeof useLpIncentives>> = {}): void {
  mocked(useLpIncentives).mockReturnValue({
    isPendingTransaction: false,
    isModalOpen: false,
    tokenRewards: '0',
    openModal,
    closeModal,
    setTokenRewards,
    onTransactionSuccess,
    hasCollectedRewards: false,
    ...overrides,
  })
}

function mockUsd(rawUsdc: string | null): void {
  mocked(useUSDCValue).mockReturnValue(rawUsdc === null ? null : CurrencyAmount.fromRawAmount(USDC_MAINNET, rawUsdc))
}

describe('PortfolioPoolsRewardsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLpIncentives()
    mockRewards({ totalUnclaimedAmountUni: '0' })
    mockUsd('0') // $0.00 by default
    mocked(useLocalizationContext).mockReturnValue({
      convertFiatAmountFormatted: (value: number | string | undefined | null) => `$${Number(value ?? 0).toFixed(2)}`,
    } as unknown as ReturnType<typeof useLocalizationContext>)
  })

  it('renders nothing without a wallet address', () => {
    render(<PortfolioPoolsRewardsCard walletAddress={undefined} />)

    expect(screen.queryByText('Rewards')).not.toBeInTheDocument()
  })

  it('shows a skeleton in the amount slot while loading', () => {
    mockRewards(undefined, { isLoading: true })

    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('Rewards')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })

  it('renders the zero state without a Collect button', () => {
    mockRewards({ totalUnclaimedAmountUni: POINT_ZERO_ZERO_ZERO_ONE_UNI })

    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('Rewards')).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })

  it('shows a disabled Collect button and a dash when the rewards API errors', () => {
    mockRewards(undefined, { error: new Error('boom') })

    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collect' })).toBeDisabled()
  })

  it('renders the populated USD state and opens the claim modal when Collect is clicked', async () => {
    const user = userEvent.setup()
    mockRewards({ totalUnclaimedAmountUni: ONE_UNI })
    mockUsd('45660000') // 45.66 USDC (6 decimals)

    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('$45.66')).toBeInTheDocument()
    const collectButton = screen.getByRole('button', { name: 'Collect' })
    expect(collectButton).toBeEnabled()

    await user.click(collectButton)

    expect(openModal).toHaveBeenCalledTimes(1)
  })

  it('shows a skeleton when rewards exist but USD price has not loaded yet', () => {
    mockRewards({ totalUnclaimedAmountUni: ONE_UNI })
    mockUsd(null)

    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
    expect(screen.queryByText(/^\$/)).not.toBeInTheDocument()
  })

  it('renders the claim modal when isModalOpen is true', () => {
    mockRewards({ totalUnclaimedAmountUni: ONE_UNI })
    mockUsd('45660000')
    mockLpIncentives({ isModalOpen: true, tokenRewards: ONE_UNI })

    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByTestId('claim-modal-open')).toBeInTheDocument()
  })

  it('hides the Collect button when viewing an external wallet, but still shows the USD value', () => {
    mockRewards({ totalUnclaimedAmountUni: ONE_UNI })
    mockUsd('45660000')

    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} isExternalWallet />)

    expect(screen.getByText('$45.66')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })
})
