import { getValidAddress } from '@universe/chains'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionDisplayPhase, PoolAvailability } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import type { TokenDetailsAuctionDisplay } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'

export interface InitialAuctionLoading {
  pageKey: string
  pending: boolean | undefined
}

export function resolveInitialAuctionLoading({
  previous,
  pageKey,
  isPageReady,
  isOnline,
  display,
}: {
  previous: InitialAuctionLoading
  pageKey: string
  isPageReady: boolean
  isOnline: boolean
  display: Pick<TokenDetailsAuctionDisplay, 'auction' | 'chainId' | 'launchMethod' | 'phase' | 'poolAvailability'>
}): InitialAuctionLoading {
  const current = previous.pageKey === pageKey ? previous : { pageKey, pending: undefined }
  if (!isPageReady || current.pending === false) {
    return current
  }

  const pending =
    isOnline &&
    display.launchMethod === LaunchProvenanceMethod.CustomAuction &&
    display.auction !== undefined &&
    display.chainId !== undefined &&
    getValidAddress({ address: display.auction.tokenAddress, chainId: display.chainId }) !== null &&
    (display.phase === AuctionDisplayPhase.Upcoming || display.phase === AuctionDisplayPhase.Live) &&
    display.poolAvailability === PoolAvailability.Loading

  // Once content is shown, never replace it with an initial skeleton.
  return current.pending === pending ? current : { pageKey, pending }
}
