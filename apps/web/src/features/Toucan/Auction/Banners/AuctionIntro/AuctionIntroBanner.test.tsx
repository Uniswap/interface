import { useFeatureFlag } from '@universe/gating'
import { AuctionIntroBanner } from '~/features/Toucan/Auction/Banners/AuctionIntro/AuctionIntroBanner'
import { useAuctionIntroBannerData } from '~/features/Toucan/Auction/Banners/AuctionIntro/useAuctionIntroBannerData'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/features/Toucan/Auction/Banners/AuctionIntro/useAuctionIntroBannerData', () => ({
  useAuctionIntroBannerData: vi.fn(),
}))

describe('AuctionIntroBanner', () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    vi.mocked(useAuctionIntroBannerData).mockReturnValue({
      shouldShowBanner: true,
      variant: 'in-progress',
      durationRemaining: '3h 59m',
      durationLabel: 'Auction ends in',
      oneLineCountdown: '3h 59m remaining',
      tokenAccentColor: '#7482FF',
      backgroundGradientStyle: {},
      isColorLoading: false,
    })
  })

  it('shows the live countdown on one line and opens timeline details', () => {
    const onLearnMorePress = vi.fn()
    render(<AuctionIntroBanner onLearnMorePress={onLearnMorePress} />)

    expect(screen.getByText('3h 59m remaining')).toBeInTheDocument()
    expect(screen.queryByText('Auction ends in')).toBeNull()
    fireEvent.click(screen.getByText('Timeline & details'))
    expect(onLearnMorePress).toHaveBeenCalledOnce()
  })

  it('falls back to the label until the end countdown resolves', () => {
    vi.mocked(useAuctionIntroBannerData).mockReturnValue({
      shouldShowBanner: true,
      variant: 'in-progress',
      durationRemaining: undefined,
      durationLabel: 'Auction ends in',
      oneLineCountdown: 'Auction ends in',
      tokenAccentColor: '#7482FF',
      backgroundGradientStyle: {},
      isColorLoading: false,
    })
    render(<AuctionIntroBanner onLearnMorePress={vi.fn()} />)

    expect(screen.getByText('Auction ends in')).toBeInTheDocument()
  })

  it('preserves the original countdown copy with provenance disabled', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    render(<AuctionIntroBanner onLearnMorePress={vi.fn()} />)

    expect(screen.getByText('Auction ends in')).toBeInTheDocument()
    expect(screen.getByText('3h 59m')).toBeInTheDocument()
    expect(screen.getByText('See full details')).toBeInTheDocument()
  })

  it('shows the upcoming countdown on one line', () => {
    vi.mocked(useAuctionIntroBannerData).mockReturnValue({
      shouldShowBanner: true,
      variant: 'not-started',
      durationRemaining: '3h 59m',
      durationLabel: 'Auction starts in',
      oneLineCountdown: 'Auction starts in 3h 59m',
      tokenAccentColor: '#7482FF',
      backgroundGradientStyle: {},
      isColorLoading: false,
    })
    render(<AuctionIntroBanner onLearnMorePress={vi.fn()} />)

    expect(screen.getByText('Auction starts in 3h 59m')).toBeInTheDocument()
    expect(screen.queryByText('Auction starts in')).toBeNull()
    expect(screen.queryByText('3h 59m')).toBeNull()
  })

  it('falls back to the label until the start countdown resolves', () => {
    vi.mocked(useAuctionIntroBannerData).mockReturnValue({
      shouldShowBanner: true,
      variant: 'not-started',
      durationRemaining: undefined,
      durationLabel: 'Auction starts in',
      oneLineCountdown: 'Auction starts in',
      tokenAccentColor: '#7482FF',
      backgroundGradientStyle: {},
      isColorLoading: false,
    })
    render(<AuctionIntroBanner onLearnMorePress={vi.fn()} />)

    expect(screen.getByText('Auction starts in')).toBeInTheDocument()
  })

  it('keeps the stacked label for a presale countdown', () => {
    vi.mocked(useAuctionIntroBannerData).mockReturnValue({
      shouldShowBanner: true,
      variant: 'in-progress',
      durationRemaining: '3h 59m',
      durationLabel: 'General sale starts in',
      oneLineCountdown: undefined,
      tokenAccentColor: '#7482FF',
      backgroundGradientStyle: {},
      isColorLoading: false,
    })
    render(<AuctionIntroBanner onLearnMorePress={vi.fn()} />)

    expect(screen.getByText('General sale starts in')).toBeInTheDocument()
    expect(screen.getByText('3h 59m')).toBeInTheDocument()
    expect(screen.queryByText('3h 59m remaining')).toBeNull()
  })
})
