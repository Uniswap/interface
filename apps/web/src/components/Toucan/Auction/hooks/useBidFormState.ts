import { areAllBidsClaimed } from '~/components/Toucan/Auction/Bids/utils/areAllBidsClaimed'
import { AuctionProgressState, BidInfoTab } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'

function getDefaultTab({
  hasUserBids,
  isAuctionEnded,
  isGraduated,
  allBidsClaimed,
}: {
  hasUserBids: boolean
  isAuctionEnded: boolean
  isGraduated: boolean
  allBidsClaimed: boolean
}): BidInfoTab {
  if (hasUserBids) {
    if (allBidsClaimed) {
      return BidInfoTab.MY_BIDS
    }
    if (isAuctionEnded && isGraduated) {
      return BidInfoTab.AUCTION_GRADUATED
    }
    return BidInfoTab.MY_BIDS
  }

  return BidInfoTab.PLACE_A_BID
}

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

  const defaultTab = getDefaultTab({ hasUserBids, isAuctionEnded, isGraduated, allBidsClaimed })
  const showAuctionGraduated = defaultTab === BidInfoTab.AUCTION_GRADUATED

  return {
    defaultTab,
    canPlaceBid: isAuctionInProgress,
    showAuctionGraduated,
    showMyBidsButton: hasUserBids || showAuctionGraduated,
    showMobileWithdrawButton: isAuctionEnded && hasUserBids && !allBidsClaimed,
    hasUserBids,
    allBidsClaimed,
    isAuctionEnded,
    isGraduated,
    isLoading: !userBidsInitialized,
  }
}
