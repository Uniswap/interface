import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { UniverseChainId } from '@universe/chains'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { parseFiniteNumber } from 'utilities/src/primitives/number'
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
  /** The launching wallet and the chain its balance is read on, for the address hover card. */
  address: string | undefined
  chainId: UniverseChainId
}

export interface TokenProvenanceRaised {
  /** Raise in USD, before display-currency conversion; undefined when unavailable. */
  usd: number | undefined
  /** Every auction on the token ended without graduating, so the cell names the outcome instead of an amount. */
  failed: boolean
  /** How many auctions the amount covers, badged above one. Counts every auction, zero raises included. */
  count: number
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
 * What the token's auctions hold between them: one that ended and graduated keeps its raise, one that
 * ended without graduating refunds every bid and adds nothing, and one still running or not yet started
 * adds whatever bidders have committed so far. An unresolved phase, or an ended auction whose outcome or
 * raise cannot be read, leaves the total unknown rather than partial.
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
      total += parseFiniteNumber(auction.totalBidVolumeUsd) ?? 0
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
    if (result !== AuctionDisplayResult.Successful) {
      return undefined
    }
    // getRaisedUsd reports no amount for a zero raise, which here is a known zero to add, not a gap.
    if (currencyRaised.status === 'success' && safeBigInt(currencyRaised.currencyRaised) === 0n) {
      continue
    }
    const usd = getRaisedUsd(entry)
    if (usd === undefined) {
      return undefined
    }
    total += usd
  }
  return Number.isFinite(total) ? total : undefined
}

function getCreator({
  auction,
  chainId,
}: {
  auction: PlainMessage<Auction>
  chainId: UniverseChainId
}): TokenProvenanceCreator {
  // Carried whatever the cell ends up showing, so an X handle still opens the launching wallet.
  const wallet = { address: auction.creatorAddress || undefined, chainId }

  // getXProfileUrl validates the handle, so a malformed value falls back to the address instead of
  // linking an arbitrary x.com path under a verified mark.
  const xProfileUrl = auction.xHandle ? getXProfileUrl(auction.xHandle) : undefined
  if (xProfileUrl) {
    return {
      ...wallet,
      name: `@${auction.xHandle}`,
      href: xProfileUrl,
      verified: auction.xVerified === true,
      avatarUrl: auction.xProfileImageUrl || undefined,
    }
  }

  if (!auction.creatorAddress) {
    return { ...wallet, name: '--', href: undefined, verified: false, avatarUrl: undefined }
  }

  return {
    ...wallet,
    name: shortenAddress({ address: auction.creatorAddress, chars: 4 }),
    href: getExplorerLink({ chainId, data: auction.creatorAddress, type: ExplorerDataType.ADDRESS }),
    verified: false,
    avatarUrl: undefined,
  }
}

function didFail(entry: TokenProvenanceAuctionEntry): boolean {
  return (
    resolveAuctionResult({
      phase: entry.phase,
      currencyRaised: entry.currencyRaised,
      requiredCurrencyRaised: entry.auction.requiredCurrencyRaised,
    }) === AuctionDisplayResult.Failed
  )
}

/**
 * A token with several auctions keeps one history entry point open throughout rather than waiting for
 * the last of them to settle. A token with one auction has no history until that auction ends, and an
 * amount is the wrong summary of a lone auction that did not graduate — the outcome is.
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
    // Every auction refunding is the same outcome as one refunding, so it reads the same way.
    const failed = entries.every(didFail)
    return {
      usd: failed ? undefined : getTotalAuctionRaisedUsd(entries),
      failed,
      count: entries.length,
      destination,
    }
  }
  const only = entries.find((entry) => entry.phase === AuctionDisplayPhase.Ended)
  if (!only) {
    return undefined
  }
  const failed = didFail(only)
  return {
    usd: failed ? undefined : getTotalAuctionRaisedUsd([only]),
    failed,
    count: 1,
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
