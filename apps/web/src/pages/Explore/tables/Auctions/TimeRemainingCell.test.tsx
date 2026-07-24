import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TimeRemainingCell } from '~/pages/Explore/tables/Auctions/TimeRemainingCell'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const NOW_SECONDS = Math.floor(Date.now() / 1000)
const ONE_DAY_SECONDS = 24 * 60 * 60

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'

// Live-auction countdown, e.g. "1d 0h 0m" or "23h 59m 59s" — exact digits depend on render timing.
const COUNTDOWN_REGEX = /\d+h \d+m/

function renderCell({
  startOffsetSeconds,
  endOffsetSeconds,
  preBidEndOffsetSeconds,
  totalBidVolume,
  requiredCurrencyRaised,
  isQuickLaunch,
}: {
  startOffsetSeconds: number
  endOffsetSeconds: number
  preBidEndOffsetSeconds?: number
  totalBidVolume?: string
  requiredCurrencyRaised?: string
  isQuickLaunch?: boolean
}) {
  return render(
    <TimeRemainingCell
      startBlockTimestamp={BigInt(NOW_SECONDS + startOffsetSeconds)}
      endBlockTimestamp={BigInt(NOW_SECONDS + endOffsetSeconds)}
      preBidEndBlockTimestamp={
        preBidEndOffsetSeconds === undefined ? undefined : BigInt(NOW_SECONDS + preBidEndOffsetSeconds)
      }
      tokenAddress={TOKEN_ADDRESS}
      chainId={UniverseChainId.Mainnet}
      totalBidVolume={totalBidVolume}
      requiredCurrencyRaised={requiredCurrencyRaised}
      isQuickLaunch={isQuickLaunch}
    />,
  )
}

describe('TimeRemainingCell', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
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
    expect(mockNavigate.mock.calls[0]?.[0]).toContain(TOKEN_ADDRESS)
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
