import { getBlockTimeSeconds } from '@uniswap/liquidity-launcher-sdk'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'

/** 1B tokens at the factory's 18 decimals. */
const QUICK_LAUNCH_TOTAL_SUPPLY_RAW = 10n ** 27n

/** The preset's duration options (see QuickLaunchDuration), with tolerance for block-time rounding. */
const QUICK_LAUNCH_DURATION_PRESETS_SECONDS = [1800, 3600, 14400]
const DURATION_TOLERANCE = 0.1

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/** Structural on purpose: satisfied by both EnrichedAuction's message and the detail page's AuctionDetails. */
export type QuickLaunchAuctionData = Pick<
  NonNullable<EnrichedAuction['auction']>,
  'chainId' | 'currency' | 'endBlock' | 'startBlock' | 'tokenTotalSupply' | 'totalSupply'
>

/**
 * Is this auction a quick launch? No first-class marker exists on data.v1.Auction yet, so this
 * matches the preset's fingerprint (native raise + exactly 1B raw supply + a preset-length block
 * window). All three criteria are creator-chosen, so the fingerprint is attacker-craftable at
 * auction creation — it must never be the sole gate for suppressing protection signals; the
 * first-class marker is the real gate.
 *
 * TODO(quick-launch marker): once `is_quick_launch` ships end to end (CreateAuctionRequest
 * metadata -> factory extraData -> data-api), check it first and keep this fingerprint only as a
 * fallback for pre-marker launches.
 */
export function isQuickLaunchAuction(enriched: EnrichedAuction): boolean {
  const auction = enriched.auction
  if (!auction) {
    return false
  }
  return isQuickLaunchAuctionData(auction)
}

/** Core fingerprint matcher, usable anywhere the raw auction fields are available. */
export function isQuickLaunchAuctionData(auction: QuickLaunchAuctionData): boolean {
  const isNativeRaise = areAddressesEqual({
    addressInput1: { address: auction.currency, platform: Platform.EVM },
    addressInput2: { address: ZERO_ADDRESS, platform: Platform.EVM },
  })
  if (!isNativeRaise) {
    return false
  }

  const totalSupplyRaw = auction.tokenTotalSupply || auction.totalSupply
  let isPresetSupply = false
  try {
    isPresetSupply = BigInt(totalSupplyRaw) === QUICK_LAUNCH_TOTAL_SUPPLY_RAW
  } catch {
    return false
  }
  if (!isPresetSupply) {
    return false
  }

  try {
    const blockSpan = Number(BigInt(auction.endBlock) - BigInt(auction.startBlock))
    const durationSeconds = blockSpan * getBlockTimeSeconds(auction.chainId)
    return QUICK_LAUNCH_DURATION_PRESETS_SECONDS.some(
      (presetSeconds) => Math.abs(durationSeconds - presetSeconds) <= presetSeconds * DURATION_TOLERANCE,
    )
  } catch {
    // Unknown chain block time — can't confirm the window.
    return false
  }
}
