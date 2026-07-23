import { renderHook } from '@testing-library/react'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionCreatorInfo } from '~/features/Toucan/Auction/hooks/useAuctionCreatorInfo'
import { mocked } from '~/test-utils/mocked'

const mockStoreState = {
  auctionDetails: null as { creatorAddress?: string; tokensRecipient?: string } | null,
}

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn(),
}))

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

const CREATOR = '0x00004c4ccc709Ef590F7C81102C0689F0263D4e9'
const RECIPIENT = '0x298eA05D0356B2Ae5cCAa3169E471783ee9EA000'
const OTHER_WALLET = '0x1111111111111111111111111111111111111111'

describe('useAuctionCreatorInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.auctionDetails = { creatorAddress: CREATOR, tokensRecipient: RECIPIENT }
  })

  it('flags the connected wallet as tokensRecipient (case-insensitive)', () => {
    mocked(useActiveAddress).mockReturnValue(RECIPIENT.toLowerCase())

    const { result } = renderHook(() => useAuctionCreatorInfo())

    expect(result.current).toEqual({
      creatorAddress: CREATOR,
      tokensRecipient: RECIPIENT,
      isConnectedTokensRecipient: true,
    })
  })

  it('is not tokensRecipient for a different connected wallet', () => {
    mocked(useActiveAddress).mockReturnValue(OTHER_WALLET)

    const { result } = renderHook(() => useAuctionCreatorInfo())

    expect(result.current).toEqual({
      creatorAddress: CREATOR,
      tokensRecipient: RECIPIENT,
      isConnectedTokensRecipient: false,
    })
  })

  it('is not tokensRecipient when no wallet is connected', () => {
    mocked(useActiveAddress).mockReturnValue(undefined)

    const { result } = renderHook(() => useAuctionCreatorInfo())

    expect(result.current).toEqual({
      creatorAddress: CREATOR,
      tokensRecipient: RECIPIENT,
      isConnectedTokensRecipient: false,
    })
  })

  it('is not tokensRecipient when the auction has no tokens_recipient', () => {
    mocked(useActiveAddress).mockReturnValue(RECIPIENT)
    mockStoreState.auctionDetails = { creatorAddress: CREATOR }

    const { result } = renderHook(() => useAuctionCreatorInfo())

    expect(result.current).toEqual({
      creatorAddress: CREATOR,
      tokensRecipient: undefined,
      isConnectedTokensRecipient: false,
    })
  })
})
