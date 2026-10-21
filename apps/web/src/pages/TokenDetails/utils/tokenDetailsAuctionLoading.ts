import { getValidAddress } from '@universe/chains'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionDisplayPhase, PoolAvailability } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import type { TokenDetailsAuctionDisplay } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'

export interface InitialAuctionLoading {
  pageKey: string
  pending: boolean | undefined
}

export interface AuctionPoolConfirmation {
  key: string
  confirmed: boolean
}

/**
 * Latches a confirmed pool for one auction. A background refetch can report the lookup as loading or
 * failed again, and a pool is never removed, so the first confirmation stands for the rest of the
 * visit. Without it the live banner unmounts mid-session and its impression fires a second time for
 * an auction the viewer never stopped seeing.
 */
export function resolveAuctionPoolConfirmation({
  previous,
  key,
  hasPool,
}: {
  previous: AuctionPoolConfirmation
  key: string
  hasPool: boolean
}): AuctionPoolConfirmation {
  if (previous.key !== key) {
    return { key, confirmed: hasPool }
  }
  return previous.confirmed || !hasPool ? previous : { key, confirmed: true }
}

/**
 * The auction-only layout needs a phase of Upcoming/Live AND a confirmed missing pool. True while
 * either signal is still in flight and the other has not already ruled that out, so a caller can
 * wait rather than paint a rendering it would have to replace. A chain-head error resolves the
 * phase to Unknown rather than leaving it Loading, so this cannot stay true forever.
 */
export function isAuctionOnlyStillResolving(
  display: Pick<TokenDetailsAuctionDisplay, 'phase' | 'poolAvailability'>,
): boolean {
  const mayResolveToAuctionOnly =
    (display.phase === AuctionDisplayPhase.Loading ||
      display.phase === AuctionDisplayPhase.Upcoming ||
      display.phase === AuctionDisplayPhase.Live) &&
    (display.poolAvailability === PoolAvailability.Loading || display.poolAvailability === PoolAvailability.NoPool)
  const stillResolving =
    display.phase === AuctionDisplayPhase.Loading || display.poolAvailability === PoolAvailability.Loading
  return mayResolveToAuctionOnly && stillResolving
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
    isAuctionOnlyStillResolving(display)

  // Once content is shown, never replace it with an initial skeleton.
  return current.pending === pending ? current : { pageKey, pending }
}
