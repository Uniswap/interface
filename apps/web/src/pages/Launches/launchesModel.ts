import type { PlainMessage } from '@bufbuild/protobuf'
import type { Launch, Launchpad } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { normalizeTokenAddressForCache } from 'uniswap/src/utils/currencyId'
import { getChainUrlParam } from '~/utils/params/chainParams'

/** One point of the trailing-1h USD price sparkline (unix seconds + USD price), from `LaunchStats.sparkline`. */
export interface LaunchSparklinePoint {
  timestamp: number
  value: number
}

/** Display model backing both the launch cards and the table, derived from proto `Launch` entries. */
export interface LaunchItem {
  id: string
  name: string
  symbol: string
  tokenAddress: string
  launchpadId: string
  launchpadLabel: string
  launchpadLogoUrl?: string
  networkLabel: string
  // Only set when the launch chain maps to a supported chain so NetworkLogo/getChainInfo stay safe.
  logoChainId?: UniverseChainId
  logoUrl?: string
  volume24hUsd?: number
  fdvUsd?: number
  liquidityUsd?: number
  priceChangePercent1h?: number
  priceChangePercent24h?: number
  createdSecondsAgo: number
  /** Auction bid page for live CCA launches with a known auction; token detail page otherwise (supported chains only). */
  detailPath?: string
  /** True for Uniswap CCA quick launches (auction-backed). */
  isQuickLaunch: boolean
  /** True once the auction migrated into a live pool (server `graduated`). */
  graduated: boolean
  /** Auction fill percent (served `auction_fill_pct`); unset outside pre-graduation CCA launches. */
  progressPct?: number
  /** Countdown to auction close; unset until estimated client-side from the served `auction_end_block`. */
  endsInSeconds?: number
  /** Distinct auction bidders (served `bidder_count`); unset for launches without an auction. */
  bidders?: number
  /** Trailing-1h USD price series (served `stats.sparkline`); unset when the series is empty. */
  sparkline?: LaunchSparklinePoint[]
}

/** ListLaunches launchpad id for Uniswap CCA quick launches. */
export const UNISWAP_CCA_LAUNCHPAD_ID = 'uniswap-cca'

/** ListLaunches/ListLaunchpads id for the Uniswap bonding-curve (direct launch) launchpad. */
export const UNISWAP_BONDING_CURVE_LAUNCHPAD_ID = 'uniswap-bonding-curve'

/**
 * ListLaunches group id covering the whole Uniswap brand: the server resolves it to both mechanism
 * ids above, so one request carries crowd launches (CCA) and instant launches (bonding curve).
 *
 * Request-only. Rows always come back tagged with their own mechanism id, never `pools`, so
 * anything reading a row's `launchpadId` keeps comparing against the two constants above.
 */
export const POOLS_LAUNCHPAD_GROUP_ID = 'pools'

/** The mechanism ids `POOLS_LAUNCHPAD_GROUP_ID` expands to — what a `pools` row can be tagged with. */
export const POOLS_LAUNCHPAD_MECHANISM_IDS: readonly string[] = [
  UNISWAP_CCA_LAUNCHPAD_ID,
  UNISWAP_BONDING_CURVE_LAUNCHPAD_ID,
]

/**
 * Display names for launchpads that ListLaunches serves but ListLaunchpads has no row for. Without
 * this, cards and table rows fall through to the raw slug (`uniswap-cca`). Drop an entry once the
 * registry carries it.
 */
const MISSING_LAUNCHPAD_NAMES = new Map<string, string>([[UNISWAP_CCA_LAUNCHPAD_ID, 'Uniswap']])

/**
 * Registry entry to borrow a logo from when a launchpad has no row of its own. CCA quick launches
 * carry the same Uniswap brand mark as the bonding-curve launchpad, so aliasing keeps them in sync
 * with whatever the registry serves instead of pinning a second copy of the asset in the bundle.
 */
const LAUNCHPAD_LOGO_ALIASES = new Map<string, string>([[UNISWAP_CCA_LAUNCHPAD_ID, UNISWAP_BONDING_CURVE_LAUNCHPAD_ID]])

/**
 * Resolves a launchpad id to its display name + logo through the ListLaunchpads registry, with the
 * same missing-name and logo-alias fallbacks the launch feed applies (falls back to the raw slug
 * only when nothing else resolves).
 */
export function getLaunchpadDisplay({
  launchpadId,
  launchpadById,
}: {
  launchpadId: string
  launchpadById: Map<string, PlainMessage<Launchpad>>
}): { label: string; logoUrl?: string } {
  const launchpad = launchpadById.get(launchpadId)
  const logoAliasId = LAUNCHPAD_LOGO_ALIASES.get(launchpadId)
  const aliasedLogoUrl = logoAliasId === undefined ? undefined : launchpadById.get(logoAliasId)?.logoUrl
  // `||`, not `??`: `Launchpad.name` is a plain proto3 scalar, so a registry row with no name
  // arrives as `''` and has to fall through to the local name / alias the same way a missing row does.
  return {
    label: launchpad?.name || MISSING_LAUNCHPAD_NAMES.get(launchpadId) || launchpadId,
    logoUrl: launchpad?.logoUrl || aliasedLogoUrl,
  }
}

/** Key for looking up a launch's auction by its token (ListLaunches carries no auction address). */
export function getAuctionTokenKey({ chainId, tokenAddress }: { chainId: number; tokenAddress: string }): string {
  return `${chainId}-${normalizeTokenAddressForCache(tokenAddress)}`
}

// Display labels for launch chains without a UniverseChainId entry in this web build.
const UNSUPPORTED_CHAIN_LABELS: Record<number, string> = { 4663: 'Robinhood' }

export function toLaunchItems({
  launches,
  launchpadById,
  auctionAddressByToken,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  launches: PlainMessage<Launch>[]
  launchpadById: Map<string, PlainMessage<Launchpad>>
  /** Auction contract address by {@link getAuctionTokenKey}, used to route live CCA launches to their bid page. */
  auctionAddressByToken?: ReadonlyMap<string, string>
  /** Injectable so time derivations are deterministic (defaults to the current time). */
  nowSeconds?: number
}): LaunchItem[] {
  return launches.flatMap((launch) => {
    const token = launch.token
    if (!token) {
      return []
    }

    const supportedChainId = isUniverseChainId(token.chainId) ? token.chainId : undefined
    const launchpadDisplay = getLaunchpadDisplay({ launchpadId: launch.launchpadId, launchpadById })
    const isQuickLaunch = launch.launchpadId === UNISWAP_CCA_LAUNCHPAD_ID
    // Live (pre-graduation) CCA quick launches route to the auction bid page. ListLaunches carries
    // no auction address, so it's joined in from the auctions list; graduated launches (and any
    // launch whose auction isn't found) fall back to the token detail page on supported chains.
    const liveAuctionAddress =
      isQuickLaunch && launch.graduated !== true
        ? auctionAddressByToken?.get(getAuctionTokenKey({ chainId: token.chainId, tokenAddress: token.address }))
        : undefined
    const detailPath = supportedChainId
      ? liveAuctionAddress
        ? `/explore/auctions/${getChainUrlParam(supportedChainId)}/${liveAuctionAddress}`
        : `/explore/tokens/${getChainUrlParam(supportedChainId)}/${token.address}`
      : undefined
    const sparkline = launch.stats?.sparkline.length
      ? launch.stats.sparkline.map((point) => ({ timestamp: Number(point.timestamp), value: point.value }))
      : undefined

    return [
      {
        id: `${launch.launchpadId}-${token.chainId}-${token.address}`,
        name: token.name,
        symbol: token.symbol,
        tokenAddress: token.address,
        launchpadId: launch.launchpadId,
        launchpadLabel: launchpadDisplay.label,
        launchpadLogoUrl: launchpadDisplay.logoUrl,
        networkLabel: supportedChainId
          ? getChainInfo(supportedChainId).label
          : (UNSUPPORTED_CHAIN_LABELS[token.chainId] ?? `Chain ${token.chainId}`),
        logoChainId: supportedChainId,
        logoUrl: token.logoUrl,
        volume24hUsd: launch.stats?.volume24hUsd,
        fdvUsd: launch.stats?.fdvUsd,
        liquidityUsd: launch.stats?.tvlUsd,
        priceChangePercent1h: launch.stats?.priceChangePercent1h,
        priceChangePercent24h: launch.stats?.priceChangePercent24h,
        createdSecondsAgo: Math.max(0, nowSeconds - Number(launch.launchedAt)),
        detailPath,
        isQuickLaunch,
        graduated: launch.graduated === true,
        progressPct: launch.auctionFillPct,
        // bidder_count is explicit-optional in the proto; also treat a 0 (proto default) as unset
        // so non-auction launches never render a "0 bidders" stat.
        bidders: launch.bidderCount || undefined,
        sparkline,
      },
    ]
  })
}
