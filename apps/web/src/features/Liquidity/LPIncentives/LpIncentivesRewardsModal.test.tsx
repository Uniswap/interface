import userEvent from '@testing-library/user-event'
import { Token } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/assets/constants'
import { ETH_CURRENCY_INFO } from 'uniswap/src/test/fixtures/wallet/currencies'
import type {
  LpIncentiveRewardChainGroup,
  LpIncentiveRewards,
} from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import { useCollectLpRewards } from '~/features/Liquidity/LPIncentives/hooks/useCollectLpRewards'
import { useLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards'
import { LpIncentivesRewardsModal } from '~/features/Liquidity/LPIncentives/LpIncentivesRewardsModal'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards', () => ({
  useLpIncentiveRewards: vi.fn(),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: vi.fn(),
}))

// Returns undefined, matching what the real lookup does for these fixture addresses, so the rows
// keep falling back to `token.symbol` as they did. Mocked to assert the currency id it's handed.
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/useCurrencyInfo')>()),
  useCurrencyInfo: vi.fn(),
}))

vi.mock('~/features/Liquidity/LPIncentives/hooks/useCollectLpRewards', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Liquidity/LPIncentives/hooks/useCollectLpRewards')>()),
  useCollectLpRewards: vi.fn(),
}))

const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
// Digits only, so it's checksum-valid without resolving to a token in the list.
const UNNAMED = '0x0000000000000000000000000000000000001234'

const collect = vi.fn()
const clearError = vi.fn()

// Typed against the real row shape (a real `Token` message, no `as unknown as`) so a rename in
// buildLpIncentiveRewards breaks these fixtures instead of leaving them passing against a shape the
// hook no longer produces.
function row(
  chainId: UniverseChainId,
  address: string,
  usdValue?: number,
  symbol = 'TKN',
  isNative = false,
): LpIncentiveRewardChainGroup['rows'][number] {
  return {
    token: new Token({ chainId, address, decimals: 18, symbol, name: 'Token', isNative }),
    usdValue,
  }
}

function group(chainId: UniverseChainId, rows: LpIncentiveRewardChainGroup['rows']): LpIncentiveRewardChainGroup {
  return { chainId, rows, subtotalUsd: rows.reduce((sum, r) => sum + (r.usdValue ?? 0), 0) }
}

function mockRewards(overrides: Partial<LpIncentiveRewards>): void {
  mocked(useLpIncentiveRewards).mockReturnValue({
    totalUsd: 0,
    groups: [],
    rewardTokens: [],
    isLoading: false,
    isError: false,
    hasRewards: false,
    ...overrides,
  })
}

describe('LpIncentivesRewardsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useCurrencyInfo).mockReturnValue(undefined)
    mocked(useLocalizationContext).mockReturnValue({
      convertFiatAmountFormatted: (value: number | string) => `$${Number(value).toFixed(2)}`,
    } as unknown as ReturnType<typeof useLocalizationContext>)
    mocked(useCollectLpRewards).mockReturnValue({
      collect,
      activeKey: undefined,
      isClaiming: false,
      error: undefined,
      clearError,
    })
  })

  it('renders the empty state when there are no rewards', () => {
    mockRewards({ hasRewards: false, totalUsd: 0 })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)
    expect(screen.getByText('Your rewards')).toBeInTheDocument()
    expect(screen.getByText('You have no rewards to collect')).toBeInTheDocument()
  })

  // A failed fetch means the balance is unknown. Telling a wallet that has rewards it has none —
  // under an authoritative "$0.00" — is the failure mode being guarded here.
  it('renders an unavailable state instead of the empty state when the rewards fetch failed', () => {
    mockRewards({ isError: true, hasRewards: false, totalUsd: 0 })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('Your rewards are unavailable right now')).toBeInTheDocument()
    expect(screen.queryByText('You have no rewards to collect')).not.toBeInTheDocument()
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
    expect(screen.queryByText('Rewards earned')).not.toBeInTheDocument()
  })

  it('hides the total while rewards are loading rather than flashing $0.00', () => {
    mockRewards({ isLoading: true, hasRewards: false, totalUsd: 0 })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
    expect(screen.queryByText('You have no rewards to collect')).not.toBeInTheDocument()
  })

  it('labels the total as rewards earned, not fees earned', () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 62.34,
      groups: [group(UniverseChainId.Mainnet, [row(UniverseChainId.Mainnet, UNI, 62.34)])],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('Rewards earned')).toBeInTheDocument()
    expect(screen.queryByText('Total fees earned')).not.toBeInTheDocument()
  })

  it('renders per-chain groups, USD values, and collect buttons when rewards exist', () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 173.82,
      groups: [
        group(UniverseChainId.Mainnet, [
          row(UniverseChainId.Mainnet, UNI, 62.34),
          row(UniverseChainId.Mainnet, USDC_MAINNET, 30.0),
        ]),
        group(UniverseChainId.Base, [row(UniverseChainId.Base, USDC_BASE, 81.48)]),
      ],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('$173.82')).toBeInTheDocument()
    expect(screen.getByText('$62.34')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
    expect(screen.getByText('$81.48')).toBeInTheDocument()
    // Only the multi-token Mainnet group gets a "Collect all"; the single-token Base group does not.
    expect(screen.getAllByText('Collect all')).toHaveLength(1)
    expect(screen.getAllByText('Collect')).toHaveLength(3)
    expect(screen.queryByText('You have no rewards to collect')).not.toBeInTheDocument()
  })

  // An unpriced reward is a real balance, so it stays claimable; "$0.00" would misreport it.
  it('names the token instead of a USD value for an unpriced reward, and keeps it collectable', async () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 30,
      groups: [
        group(UniverseChainId.Mainnet, [
          row(UniverseChainId.Mainnet, USDC_MAINNET, 30.0),
          row(UniverseChainId.Mainnet, UNI, undefined, 'UNI'),
        ]),
      ],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('UNI')).toBeInTheDocument()
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument()

    // The unpriced row's own Collect claims just that token.
    await userEvent.click(screen.getAllByText('Collect')[1])
    expect(collect).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet, tokenAddresses: [UNI] })
  })

  // The liquidity service reports a native reward token at the zero address. Handing that straight
  // to buildCurrencyId produced an id no token-list entry matches, so the row's logo came out blank.
  it('resolves a native reward token to the chain native id, not the served zero address', () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 12,
      groups: [group(UniverseChainId.Mainnet, [row(UniverseChainId.Mainnet, ZERO_ADDRESS, 12, 'ETH', true)])],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    const [currencyId] = mocked(useCurrencyInfo).mock.calls[0]
    expect(currencyId?.toLowerCase()).toBe(`${UniverseChainId.Mainnet}-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`)
  })

  // The claim contract is handed whatever address the backend served, so resolving the display id
  // must not rewrite what gets collected.
  it('still collects a native reward at its served address', async () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 12,
      groups: [group(UniverseChainId.Mainnet, [row(UniverseChainId.Mainnet, ZERO_ADDRESS, 12, 'ETH', true)])],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    await userEvent.click(screen.getByText('Collect'))
    expect(collect).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet, tokenAddresses: [ZERO_ADDRESS] })
  })

  // The row prefers the listed symbol so a stale served one can't outrank the token list — and so
  // the modal and PoolAprTooltip name the same served token identically.
  it('names an unpriced reward from the token list ahead of the served symbol', () => {
    mocked(useCurrencyInfo).mockReturnValue(ETH_CURRENCY_INFO)
    mockRewards({
      hasRewards: true,
      totalUsd: 0,
      groups: [group(UniverseChainId.Mainnet, [row(UniverseChainId.Mainnet, ZERO_ADDRESS, undefined, 'WETH', true)])],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.queryByText('WETH')).not.toBeInTheDocument()
  })

  // `token.symbol` is a protobuf string field, so an unlisted token the backend couldn't name
  // arrives as '' — a `??` fallback would leave the row blank beside a live Collect button.
  it('falls back to a placeholder when an unpriced reward has no symbol at all', async () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 0,
      groups: [group(UniverseChainId.Mainnet, [row(UniverseChainId.Mainnet, UNNAMED, undefined, '')])],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByText('—')).toBeInTheDocument()

    // Still claimable — an unnameable reward is still a real balance.
    await userEvent.click(screen.getByText('Collect'))
    expect(collect).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet, tokenAddresses: [UNNAMED] })
  })

  it("includes an unpriced reward in the chain's Collect all", async () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 30,
      groups: [
        group(UniverseChainId.Mainnet, [
          row(UniverseChainId.Mainnet, USDC_MAINNET, 30.0),
          row(UniverseChainId.Mainnet, UNI, undefined, 'UNI'),
        ]),
      ],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    await userEvent.click(screen.getByText('Collect all'))
    expect(collect).toHaveBeenCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddresses: [USDC_MAINNET, UNI],
    })
  })

  it('does not render Collect all for a single-token chain', () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 62.34,
      groups: [group(UniverseChainId.Mainnet, [row(UniverseChainId.Mainnet, UNI, 62.34)])],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.queryByText('Collect all')).not.toBeInTheDocument()
    expect(screen.getAllByText('Collect')).toHaveLength(1)
  })

  it('does not show the empty state while loading', () => {
    mockRewards({ isLoading: true, hasRewards: false })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)
    expect(screen.getByText('Your rewards')).toBeInTheDocument()
    expect(screen.queryByText('You have no rewards to collect')).not.toBeInTheDocument()
  })

  it('collects a single reward token when its Collect button is clicked', async () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 62.34,
      groups: [group(UniverseChainId.Mainnet, [row(UniverseChainId.Mainnet, UNI, 62.34)])],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    await userEvent.click(screen.getByText('Collect'))
    expect(collect).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet, tokenAddresses: [UNI] })
  })

  it('collects every token on a chain when Collect all is clicked', async () => {
    mockRewards({
      hasRewards: true,
      totalUsd: 92.34,
      groups: [
        group(UniverseChainId.Mainnet, [
          row(UniverseChainId.Mainnet, UNI, 62.34),
          row(UniverseChainId.Mainnet, USDC_MAINNET, 30.0),
        ]),
      ],
    })
    render(<LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)

    await userEvent.click(screen.getByText('Collect all'))
    expect(collect).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet, tokenAddresses: [UNI, USDC_MAINNET] })
  })

  it('clears a stale claim error when the modal is closed', () => {
    mockRewards({ hasRewards: false, totalUsd: 0 })
    const { rerender } = render(
      <LpIncentivesRewardsModal isOpen onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />,
    )
    expect(clearError).not.toHaveBeenCalled()

    rerender(<LpIncentivesRewardsModal isOpen={false} onClose={vi.fn()} walletAddress={SAMPLE_SEED_ADDRESS_1} />)
    expect(clearError).toHaveBeenCalled()
  })
})
