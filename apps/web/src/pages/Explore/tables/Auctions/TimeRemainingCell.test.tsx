import { UniverseChainId } from '@universe/chains'
import { TimeRemainingCell } from '~/pages/Explore/tables/Auctions/TimeRemainingCell'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()
const mockUnderlyingTokenRead = vi.fn<() => { data: string | undefined; isLoading: boolean }>()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useReadContract: () => mockUnderlyingTokenRead(),
  }
})

const NOW_SECONDS = Math.floor(Date.now() / 1000)
const ONE_DAY_SECONDS = 24 * 60 * 60

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const IDOS_RECEIPT_ADDRESS = '0xb628B89067E8f7Dfc2cB528a72BcfF7d5cEDcE29'
const IDOS_TOKEN_ADDRESS = '0x68731d6f14b827bbcffbebb62b19daa18de1d79c'
const CAP_RECEIPT_ADDRESS = '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999'
const CAP_UNDERLYING_ADDRESS = '0x2222222222222222222222222222222222222222'
const AZTEC_TOKEN_ADDRESS = '0xA27EC0006e59f245217Ff08CD52A7E8b169E62D2'

// Live-auction countdown, e.g. "1d 0h 0m" or "23h 59m 59s" — exact digits depend on render timing.
const COUNTDOWN_REGEX = /\d+h \d+m/

function renderCell({
  startOffsetSeconds,
  endOffsetSeconds,
  preBidEndOffsetSeconds,
  isGraduated,
  totalBidVolume,
  requiredCurrencyRaised,
  isQuickLaunch,
  tokenAddress = TOKEN_ADDRESS,
  chainId = UniverseChainId.Mainnet,
}: {
  startOffsetSeconds: number
  endOffsetSeconds: number
  preBidEndOffsetSeconds?: number
  isGraduated?: boolean
  totalBidVolume?: string
  requiredCurrencyRaised?: string
  isQuickLaunch?: boolean
  tokenAddress?: string
  chainId?: UniverseChainId
}) {
  return render(
    <TimeRemainingCell
      startBlockTimestamp={BigInt(NOW_SECONDS + startOffsetSeconds)}
      endBlockTimestamp={BigInt(NOW_SECONDS + endOffsetSeconds)}
      preBidEndBlockTimestamp={
        preBidEndOffsetSeconds === undefined ? undefined : BigInt(NOW_SECONDS + preBidEndOffsetSeconds)
      }
      tokenAddress={tokenAddress}
      chainId={chainId}
      isGraduated={isGraduated}
      totalBidVolume={totalBidVolume}
      requiredCurrencyRaised={requiredCurrencyRaised}
      isQuickLaunch={isQuickLaunch}
    />,
  )
}

describe('TimeRemainingCell', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockUnderlyingTokenRead.mockReset()
    mockUnderlyingTokenRead.mockReturnValue({ data: undefined, isLoading: false })
  })

  it('shows Starting soon with a countdown before the auction starts', () => {
    renderCell({ startOffsetSeconds: ONE_DAY_SECONDS, endOffsetSeconds: 2 * ONE_DAY_SECONDS })

    expect(screen.getByText('Starting soon')).toBeInTheDocument()
    expect(screen.queryByText('Swap')).not.toBeInTheDocument()
  })

  it('shows Pre-bid while the auction is live but token emission has not begun', () => {
    renderCell({
      startOffsetSeconds: -ONE_DAY_SECONDS,
      endOffsetSeconds: 2 * ONE_DAY_SECONDS,
      preBidEndOffsetSeconds: ONE_DAY_SECONDS,
    })

    expect(screen.getByText('Pre-bid')).toBeInTheDocument()
    expect(screen.queryByText('Swap')).not.toBeInTheDocument()
  })

  it('shows the countdown without a Bidding label once the pre-bid window has passed', () => {
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: ONE_DAY_SECONDS,
      preBidEndOffsetSeconds: -ONE_DAY_SECONDS,
    })

    expect(screen.queryByText('Bidding')).not.toBeInTheDocument()
    expect(screen.getByText(COUNTDOWN_REGEX)).toBeInTheDocument()
  })

  it('shows the countdown without a Bidding label while the auction is live', () => {
    renderCell({ startOffsetSeconds: -ONE_DAY_SECONDS, endOffsetSeconds: ONE_DAY_SECONDS })

    expect(screen.queryByText('Bidding')).not.toBeInTheDocument()
    expect(screen.getByText(COUNTDOWN_REGEX)).toBeInTheDocument()
    expect(screen.queryByText('Swap')).not.toBeInTheDocument()
  })

  it('shows Launched with recency and a quick-swap CTA once a launched auction ends', () => {
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      totalBidVolume: '1000',
      requiredCurrencyRaised: '500',
    })

    expect(screen.getByText('Launched')).toBeInTheDocument()
    expect(screen.getByText('1d ago')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Swap'))
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(`/explore/tokens/ethereum/${TOKEN_ADDRESS}`)
  })

  it('swaps an ended IDOS auction through the tradable IDOS token on Arbitrum', () => {
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      totalBidVolume: '1000',
      requiredCurrencyRaised: '500',
      tokenAddress: IDOS_RECEIPT_ADDRESS,
      chainId: UniverseChainId.ArbitrumOne,
    })

    fireEvent.click(screen.getByText('Swap'))

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith(`/explore/tokens/arbitrum/${IDOS_TOKEN_ADDRESS}`)
  })

  it('keeps the same address on Ethereum outside the Arbitrum IDOS trading override', () => {
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      totalBidVolume: '1000',
      requiredCurrencyRaised: '500',
      tokenAddress: IDOS_RECEIPT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
    })

    fireEvent.click(screen.getByText('Swap'))

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith(`/explore/tokens/ethereum/${IDOS_RECEIPT_ADDRESS}`)
  })

  it('swaps an ended CAP auction through the underlying token returned by its receipt contract', () => {
    mockUnderlyingTokenRead.mockReturnValue({ data: CAP_UNDERLYING_ADDRESS, isLoading: false })
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      totalBidVolume: '1000',
      requiredCurrencyRaised: '500',
      tokenAddress: CAP_RECEIPT_ADDRESS,
    })

    fireEvent.click(screen.getByText('Swap'))

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith(`/explore/tokens/ethereum/${CAP_UNDERLYING_ADDRESS}`)
  })

  it.each([
    { state: 'loading', isLoading: true },
    { state: 'failed', isLoading: false },
  ])('hides Swap while the CAP underlying-token read is $state', ({ isLoading }) => {
    mockUnderlyingTokenRead.mockReturnValue({ data: undefined, isLoading })
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      totalBidVolume: '1000',
      requiredCurrencyRaised: '500',
      tokenAddress: CAP_RECEIPT_ADDRESS,
    })

    expect(screen.getByText('Launched')).toBeInTheDocument()
    expect(screen.queryByText('Swap')).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('hides Swap when the CAP receipt returns the zero address as its underlying token', () => {
    mockUnderlyingTokenRead.mockReturnValue({
      data: '0x0000000000000000000000000000000000000000',
      isLoading: false,
    })
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      totalBidVolume: '1000',
      requiredCurrencyRaised: '500',
      tokenAddress: CAP_RECEIPT_ADDRESS,
    })

    expect(screen.getByText('Launched')).toBeInTheDocument()
    expect(screen.queryByText('Swap')).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('keeps the backend-resolved AZTEC token as the swap destination', () => {
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      totalBidVolume: '1000',
      requiredCurrencyRaised: '500',
      tokenAddress: AZTEC_TOKEN_ADDRESS,
    })

    fireEvent.click(screen.getByText('Swap'))

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith(`/explore/tokens/ethereum/${AZTEC_TOKEN_ADDRESS}`)
  })

  it('shows Failed without a swap CTA when the auction ended below its launch threshold', () => {
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      totalBidVolume: '100',
      requiredCurrencyRaised: '500',
    })

    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.queryByText('Swap')).not.toBeInTheDocument()
  })

  it('shows Failed when the served verdict says the auction did not graduate despite enough committed volume', () => {
    renderCell({
      startOffsetSeconds: -2 * ONE_DAY_SECONDS,
      endOffsetSeconds: -ONE_DAY_SECONDS,
      isGraduated: false,
      totalBidVolume: '1000',
      requiredCurrencyRaised: '500',
    })

    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.queryByText('Swap')).not.toBeInTheDocument()
  })

  describe('quick launch (flag-gated)', () => {
    it('shows the countdown without a Bidding label while a quick-launch auction is live', () => {
      renderCell({ startOffsetSeconds: -ONE_DAY_SECONDS, endOffsetSeconds: ONE_DAY_SECONDS, isQuickLaunch: true })

      expect(screen.queryByText('Bidding')).not.toBeInTheDocument()
      expect(screen.getByText(COUNTDOWN_REGEX)).toBeInTheDocument()
      expect(screen.queryByText('Live on Uniswap')).not.toBeInTheDocument()
    })

    it('shows Live on Uniswap with the liquidity-locked badge once a quick launch completes', () => {
      renderCell({
        startOffsetSeconds: -2 * ONE_DAY_SECONDS,
        endOffsetSeconds: -ONE_DAY_SECONDS,
        totalBidVolume: '1000',
        requiredCurrencyRaised: '500',
        isQuickLaunch: true,
      })

      expect(screen.getByText('Live on Uniswap')).toBeInTheDocument()
      expect(screen.getByText('Liquidity locked forever')).toBeInTheDocument()
      // The quick-swap hover CTA is preserved for launched quick launches.
      fireEvent.click(screen.getByText('Swap'))
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('keeps the Failed state (no badge) when a quick launch misses its threshold', () => {
      renderCell({
        startOffsetSeconds: -2 * ONE_DAY_SECONDS,
        endOffsetSeconds: -ONE_DAY_SECONDS,
        totalBidVolume: '100',
        requiredCurrencyRaised: '500',
        isQuickLaunch: true,
      })

      expect(screen.getByText('Failed')).toBeInTheDocument()
      expect(screen.queryByText('Liquidity locked forever')).not.toBeInTheDocument()
      expect(screen.queryByText('Swap')).not.toBeInTheDocument()
    })
  })
})
