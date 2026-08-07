import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCreatorSweepDisplay } from '~/features/Toucan/Auction/CreatorActions/getCreatorSweepDisplay'
import { getMigrateCtaState } from '~/features/Toucan/Auction/CreatorActions/getMigrateCtaState'
import { usePostAuctionPanelState } from '~/features/Toucan/Auction/hooks/usePostAuctionPanelState'
import { AuctionOutcome } from '~/features/Toucan/Auction/store/types'

const mockBidFormState = { showAuctionGraduated: false }
const mockCreatorInfo = { isConnectedTokensRecipient: false }
const mockSweepState = { hasSwept: false as boolean | undefined, remainingSupplyRaw: undefined as bigint | undefined }
const mockStoreState = {
  auctionDetails: { totalSupply: '1000' } as Record<string, unknown> | null,
  currentBlockNumber: 200 as number | undefined,
}
let mockOutcome = AuctionOutcome.GRADUATED

vi.mock('~/features/Toucan/Auction/hooks/useBidFormState', () => ({
  useBidFormState: () => mockBidFormState,
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionCreatorInfo', () => ({
  useAuctionCreatorInfo: () => mockCreatorInfo,
}))
vi.mock('~/features/Toucan/Auction/hooks/useSweepUnsoldTokensState', () => ({
  useSweepUnsoldTokensState: () => mockSweepState,
}))
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
  useAuctionOutcome: () => mockOutcome,
}))
vi.mock('~/features/Toucan/Auction/CreatorActions/getCreatorSweepDisplay', () => ({
  getCreatorSweepDisplay: vi.fn(),
}))
vi.mock('~/features/Toucan/Auction/CreatorActions/getMigrateCtaState', () => ({
  getMigrateCtaState: vi.fn(),
}))

describe('usePostAuctionPanelState', () => {
  beforeEach(() => {
    mockBidFormState.showAuctionGraduated = false
    mockCreatorInfo.isConnectedTokensRecipient = false
    mockSweepState.hasSwept = false
    mockSweepState.remainingSupplyRaw = undefined
    mockStoreState.auctionDetails = { totalSupply: '1000' }
    mockStoreState.currentBlockNumber = 200
    mockOutcome = AuctionOutcome.GRADUATED
    // Default: no post-auction content for this viewer.
    vi.mocked(getCreatorSweepDisplay).mockReturnValue(null)
    vi.mocked(getMigrateCtaState).mockReturnValue({ visible: false, enabled: false, showComplete: false })
  })

  it('ended with no action: no panel content and no visible creator/migrate action', () => {
    const { result } = renderHook(() => usePostAuctionPanelState())

    expect(result.current).toEqual({ postAuctionActionVisible: false, hasPanelContent: false })
  })

  it('ended + creator sweep card visible: has panel content', () => {
    vi.mocked(getCreatorSweepDisplay).mockReturnValue({ variant: 'failed', amountRaw: 1000n, isSwept: false })

    const { result } = renderHook(() => usePostAuctionPanelState())

    expect(result.current).toEqual({ postAuctionActionVisible: true, hasPanelContent: true })
  })

  it('ended + migrate CTA visible: has panel content', () => {
    vi.mocked(getMigrateCtaState).mockReturnValue({ visible: true, enabled: true, showComplete: false })

    const { result } = renderHook(() => usePostAuctionPanelState())

    expect(result.current).toEqual({ postAuctionActionVisible: true, hasPanelContent: true })
  })

  it('ended + graduated success card: has panel content but no creator/migrate action', () => {
    mockBidFormState.showAuctionGraduated = true

    const { result } = renderHook(() => usePostAuctionPanelState())

    expect(result.current).toEqual({ postAuctionActionVisible: false, hasPanelContent: true })
  })

  it('live / not ended: no panel content', () => {
    mockOutcome = AuctionOutcome.ACTIVE

    const { result } = renderHook(() => usePostAuctionPanelState())

    expect(result.current).toEqual({ postAuctionActionVisible: false, hasPanelContent: false })
  })
})
