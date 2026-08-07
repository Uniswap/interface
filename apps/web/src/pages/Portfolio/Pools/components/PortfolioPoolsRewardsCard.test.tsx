import userEvent from '@testing-library/user-event'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useGetPoolsRewards } from 'uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { useLpIncentives } from '~/features/Liquidity/hooks/useLpIncentives'
import type { LpIncentiveRewards } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import { useLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards'
import { PortfolioPoolsRewardsCard } from '~/pages/Portfolio/Pools/components/PortfolioPoolsRewardsCard'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards', () => ({
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

vi.mock('~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards', () => ({
  useLpIncentiveRewards: vi.fn(),
}))

vi.mock('~/features/Liquidity/LPIncentives/LpIncentivesRewardsModal', () => ({
  LpIncentivesRewardsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="rewards-modal-open" /> : null,
}))

vi.mock('~/features/Liquidity/LPIncentives/LpIncentiveRewardLogos', () => ({
  LpIncentiveRewardLogos: () => <div data-testid="reward-logos" />,
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
    // The card reads both paths so its hook order is stable; the multi-token one is inert with the
    // flag off (default false in setupTests) but still has to return a shape.
    mocked(useLpIncentiveRewards).mockReturnValue({
      totalUsd: 0,
      groups: [],
      rewardTokens: [],
      isLoading: false,
      isError: false,
      hasRewards: false,
    })
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

// multi_token_lp_incentives replaces the UNI amount with an aggregate USD total across every reward
// denomination and swaps the UNI-only claim modal for the wallet-level rewards modal. The frame,
// zero state and external-wallet handling are shared with the UNI-only path above.
describe('PortfolioPoolsRewardsCard — multi_token_lp_incentives', () => {
  function groupFixture(chainId: number, address: string, usd: number): LpIncentiveRewards['groups'][number] {
    return {
      chainId,
      rows: [
        {
          token: { chainId, address, decimals: 18, symbol: 'TKN', name: 'Token' },
          usdValue: usd,
        } as unknown as LpIncentiveRewards['groups'][number]['rows'][number],
      ],
      subtotalUsd: usd,
    }
  }

  function mockMultiTokenRewards(overrides: Partial<LpIncentiveRewards>): void {
    const groups = overrides.groups ?? []
    mocked(useLpIncentiveRewards).mockReturnValue({
      totalUsd: 0,
      hasRewards: false,
      isLoading: false,
      isError: false,
      ...overrides,
      groups,
      rewardTokens:
        overrides.rewardTokens ??
        groups.flatMap((group) =>
          group.rows.map((row) => ({ chainId: row.token.chainId, address: row.token.address })),
        ),
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.MultiTokenLpIncentives)
    mocked(useLocalizationContext).mockReturnValue({
      convertFiatAmountFormatted: (value: number | string) => `$${Number(value).toFixed(2)}`,
    } as unknown as ReturnType<typeof useLocalizationContext>)
    mocked(useLpIncentives).mockReturnValue({
      isModalOpen: false,
      isPendingTransaction: false,
      tokenRewards: '0',
      openModal,
      closeModal,
      setTokenRewards,
      onTransactionSuccess,
      hasCollectedRewards: false,
    } as unknown as ReturnType<typeof useLpIncentives>)
    mocked(useGetPoolsRewards).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGetPoolsRewards>)
    mocked(useUSDCValue).mockReturnValue(null)
  })

  it('renders nothing without a wallet address', () => {
    mockMultiTokenRewards({ hasRewards: false, totalUsd: 0 })
    render(<PortfolioPoolsRewardsCard walletAddress={undefined} />)
    expect(screen.queryByText('Rewards')).not.toBeInTheDocument()
  })

  it('hides the Collect button in the zero state', () => {
    mockMultiTokenRewards({ hasRewards: false, totalUsd: 0 })
    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)
    expect(screen.queryByText('Collect')).not.toBeInTheDocument()
  })

  it('shows reward logos and opens the rewards modal when Collect is clicked', async () => {
    mockMultiTokenRewards({ hasRewards: true, totalUsd: 143.82, groups: [groupFixture(1, '0x1f98', 143.82)] })
    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByTestId('reward-logos')).toBeInTheDocument()
    expect(screen.queryByTestId('rewards-modal-open')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Collect'))
    expect(screen.getByTestId('rewards-modal-open')).toBeInTheDocument()
  })

  it('renders the unknown-balance placeholder instead of $0.00 when the fetch fails', () => {
    mockMultiTokenRewards({ hasRewards: false, totalUsd: 0, isError: true })
    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
    // Unknown isn't zero, so the Collect button stays — disabled, with nothing known to collect.
    expect(screen.getByRole('button', { name: 'Collect' })).toBeDisabled()
  })

  it('hides the Collect button when viewing an external wallet', () => {
    mockMultiTokenRewards({ hasRewards: true, totalUsd: 10, groups: [groupFixture(1, '0x1f98', 10)] })
    render(<PortfolioPoolsRewardsCard walletAddress={SAMPLE_SEED_ADDRESS_1} isExternalWallet />)
    expect(screen.queryByText('Collect')).not.toBeInTheDocument()
  })
})
