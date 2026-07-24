import { areAllBidsClaimed } from '~/features/Toucan/Auction/Bids/utils/areAllBidsClaimed'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

export function useBidFormState() {
  const { userBids, userBidsInitialized, progress } = useAuctionStore((state) => ({
    userBids: state.userBids,
    userBidsInitialized: state.userBidsInitialized,
    progress: state.progress,
  }))

  const hasUserBids = userBids.length >= 1
  const isGraduated = progress.isGraduated
  const allBidsClaimed = areAllBidsClaimed(userBids, isGraduated)
  const isAuctionEnded = progress.state === AuctionProgressState.ENDED
  const isAuctionInProgress = progress.state === AuctionProgressState.IN_PROGRESS

  return {
    canPlaceBid: isAuctionInProgress,
    showMobileWithdrawButton: isAuctionEnded && hasUserBids && !allBidsClaimed,
    showAuctionGraduated: isAuctionEnded && isGraduated && hasUserBids,
    hasUserBids,
    allBidsClaimed,
    isAuctionEnded,
    isGraduated,
    isLoading: !userBidsInitialized,
  }
}
