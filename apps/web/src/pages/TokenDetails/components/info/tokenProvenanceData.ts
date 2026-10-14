import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { UniverseChainId } from '@universe/chains'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { isCcaAuction } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { getRaisedUsd } from '~/features/Toucan/Auction/utils/getRaisedUsd'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  type CurrencyRaisedState,
  resolveAuctionResult,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'
import { getXProfileUrl } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { type AuctionDestination, getAuctionDestination } from '~/features/Toucan/utils/auctionDestination'

export interface TokenProvenanceCreator {
  name: string
  href: string | undefined
  verified: boolean
  avatarUrl: string | undefined
}

export interface TokenProvenanceRaised {
  /** Raise in USD, before display-currency conversion; undefined when unavailable. */
  usd: number | undefined
  /** Where "Details" goes; undefined when the caller opens the auction selector instead, or no auction has a page. */
  destination: AuctionDestination | undefined
}

export interface TokenProvenanceData {
  creator: TokenProvenanceCreator
  /** Single-auction history appears after ending; multi-auction history stays reachable throughout. */
  raised: TokenProvenanceRaised | undefined
}

/** One auction on the token, with the phase and raise the page has resolved for it. */
export interface TokenProvenanceAuctionEntry {
  auction: PlainMessage<Auction>
  phase: AuctionDisplayPhase
  currencyRaised: CurrencyRaisedState
}

/**
 * The raise kept by the auctions that ended and graduated. A failed auction refunds its raise, so it adds
 * nothing; an upcoming or live one is not summed; an unresolved phase, or an ended one with an unresolved
 * outcome, leaves the total unknown rather than partial.
 */
export function getTotalAuctionRaisedUsd(entries: TokenProvenanceAuctionEntry[]): number | undefined {
  let total = 0
  for (const entry of entries) {
    const { auction, phase, currencyRaised } = entry
    // An unresolved phase is not the same as nothing to add: skipping it would render the remaining
    // siblings as a definitive total.
    if (phase === AuctionDisplayPhase.Unknown || phase === AuctionDisplayPhase.Loading) {
      return undefined
    }
    if (phase !== AuctionDisplayPhase.Ended) {
      continue
    }
    if (currencyRaised.status === 'success' && safeBigInt(currencyRaised.currencyRaised) === 0n) {
      continue
    }
    const result = resolveAuctionResult({
      phase,
      currencyRaised,
      requiredCurrencyRaised: auction.requiredCurrencyRaised,
    })
    if (result === AuctionDisplayResult.Failed) {
      continue
    }
    const usd = result === AuctionDisplayResult.Successful ? getRaisedUsd(entry) : undefined
    if (usd === undefined) {
      return undefined
    }
    total += usd
  }
  // Matches getRaisedUsd: a settled zero is not an amount to show, however many auctions summed to it.
  return Number.isFinite(total) && total > 0 ? total : undefined
}

function getCreator({
  auction,
  chainId,
}: {
  auction: PlainMessage<Auction>
  chainId: UniverseChainId
}): TokenProvenanceCreator {
  // getXProfileUrl validates the handle, so a malformed value falls back to the address instead of
  // linking an arbitrary x.com path under a verified mark.
  const xProfileUrl = auction.xHandle ? getXProfileUrl(auction.xHandle) : undefined
  if (xProfileUrl) {
    return {
      name: `@${auction.xHandle}`,
      href: xProfileUrl,
      verified: auction.xVerified === true,
      avatarUrl: auction.xProfileImageUrl || undefined,
    }
  }

  if (!auction.creatorAddress) {
    return { name: '--', href: undefined, verified: false, avatarUrl: undefined }
  }

  return {
    name: shortenAddress({ address: auction.creatorAddress, chars: 4 }),
    href: getExplorerLink({ chainId, data: auction.creatorAddress, type: ExplorerDataType.ADDRESS }),
    verified: false,
    avatarUrl: undefined,
  }
}

/**
 * Only a settled auction has a final raise, so a live one is never summed: its checkpoint still moves
 * and the whole raise returns to bidders if it fails. A token with several auctions keeps one history
 * entry point open throughout rather than waiting for the last of them.
 */
function getRaised({
  entries,
  chainId,
}: {
  entries: TokenProvenanceAuctionEntry[]
  chainId: UniverseChainId
}): TokenProvenanceRaised | undefined {
  if (entries.length > 1) {
    // Every auction is summed, but only a CCA auction has a page to open: several hand "Details" to the
    // selector, exactly one is linked directly, and none leaves the amount on its own.
    const linkable = entries.filter((entry) => isCcaAuction({ auction: entry.auction }))
    const onlyLinkable = linkable.length === 1 ? linkable[0] : undefined
    const destination = onlyLinkable ? getAuctionDestination({ auction: onlyLinkable.auction, chainId }) : undefined
    return { usd: getTotalAuctionRaisedUsd(entries), destination }
  }
  const only = entries.find((entry) => entry.phase === AuctionDisplayPhase.Ended)
  if (!only) {
    return undefined
  }
  return {
    usd: getTotalAuctionRaisedUsd([only]),
    destination: getAuctionDestination({ auction: only.auction, chainId }),
  }
}

export function getTokenProvenanceData({
  auction,
  chainId,
  entries,
}: {
  auction: PlainMessage<Auction>
  chainId: UniverseChainId
  /** Every auction the page resolved for this token, whatever its launch method, the provenance auction included. */
  entries: TokenProvenanceAuctionEntry[]
}): TokenProvenanceData {
  return {
    creator: getCreator({ auction, chainId }),
    raised: getRaised({ entries, chainId }),
  }
}
