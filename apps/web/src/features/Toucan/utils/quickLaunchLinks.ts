import { UniverseChainId } from '@universe/chains'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { isQuickLaunchAuction } from '~/features/Toucan/utils/quickLaunchClassification'
import { getChainUrlParam } from '~/utils/params/chainParams'

/**
 * pools.xyz — the standalone quick-launch product (labs/rh-cca). Quick launches are created and
 * bid on there, so discovery surfaces link them out to its token page instead of the web app's
 * auction page. Token pages are `/t/:chain/:address`.
 */
export const POOLS_BASE_URL = 'https://pools.xyz'

/** The brand label shown for link-outs, derived so it cannot drift from the URL. */
export const POOLS_HOSTNAME = new URL(POOLS_BASE_URL).hostname

/**
 * Chains pools.xyz serves. Off them there is no page to link to and no brand to attribute. Which
 * of them a given deploy serves is that app's own build config, not ours, and it makes `create`
 * imply `trade` — so a quick launch existing on a chain means its token page is served there.
 */
export function isPoolsSupportedChain(
  chainId: number | undefined,
): chainId is UniverseChainId.Robinhood | UniverseChainId.Arc {
  return chainId === UniverseChainId.Robinhood || chainId === UniverseChainId.Arc
}

/** Token pages use the same chain slugs as Uniswap. */
export function getPoolsTokenPageUrl({
  chainId,
  tokenAddress,
}: {
  chainId: number | undefined
  tokenAddress: string | undefined
}): string | undefined {
  if (!isPoolsSupportedChain(chainId) || !tokenAddress) {
    return undefined
  }
  return `${POOLS_BASE_URL}/t/${getChainUrlParam(chainId)}/${encodeURIComponent(tokenAddress)}`
}

/**
 * The pools.xyz link-out for an auction list item: set only when the quick-launch treatment is
 * enabled (feature flag), the auction is classified as a quick launch, and a pools.xyz URL can
 * be constructed. Undefined means the caller keeps its web-app auction link.
 */
export function getQuickLaunchExternalBidUrl({
  enrichedAuction,
  isQuickLaunchFlagEnabled,
}: {
  enrichedAuction: EnrichedAuction
  isQuickLaunchFlagEnabled: boolean
}): string | undefined {
  if (!isQuickLaunchFlagEnabled || !isQuickLaunchAuction(enrichedAuction)) {
    return undefined
  }
  return getPoolsTokenPageUrl({
    chainId: enrichedAuction.auction?.chainId,
    tokenAddress: enrichedAuction.auction?.tokenAddress,
  })
}
