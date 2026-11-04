import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { logger } from 'utilities/src/logger/logger'
import { useNavigateToAuctionDetails } from '~/hooks/useNavigateToAuctionDetails'
import { POPUP_MEDIUM_DISMISS_MS } from '~/utils/popups/constants'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

const AUCTION = {
  chainId: UniverseChainId.Base,
  auctionAddress: '0x1111111111111111111111111111111111111111',
}

describe('useNavigateToAuctionDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(popupRegistry, 'addPopup').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the auction without an error notification', () => {
    const { result } = renderHook(() => useNavigateToAuctionDetails())

    act(() => result.current(AUCTION))

    expect(mockNavigate).toHaveBeenCalledWith(`/explore/auctions/base/${AUCTION.auctionAddress}`)
    expect(logger.warn).not.toHaveBeenCalled()
    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })

  it.each([
    { ...AUCTION, chainId: 0 },
    { ...AUCTION, chainId: UniverseChainId.Solana },
    { ...AUCTION, auctionAddress: '' },
  ])('notifies instead of navigating for invalid auction input: %j', (auction) => {
    const { result } = renderHook(() => useNavigateToAuctionDetails())

    act(() => result.current(auction))

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      'useNavigateToAuctionDetails',
      'navigateToAuctionDetails',
      'Cannot navigate to auction details',
      auction,
    )
    expect(popupRegistry.addPopup).toHaveBeenCalledWith(
      { type: PopupType.Error, error: 'Unable to open auction' },
      'auction-navigation-error',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })
})
