import type { UniverseChainId } from '@universe/chains'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'

/** `?deposit=range` opens the deposit panel's range editor once the pool's default range is ready. */
export const PDP_DEPOSIT_PARAM = 'deposit'
export const PDP_DEPOSIT_RANGE = 'range'

/** The browser's URL, so the PDP's "Choose a pool" breadcrumb leads back with its filters. */
export type PoolBrowserLinkState = { poolBrowserHref?: string }

export function getPoolBrowserPdpUrl({ poolIdOrHash, chainId }: { poolIdOrHash: string; chainId: UniverseChainId }) {
  return `${getPoolDetailsURL(poolIdOrHash, chainId)}?${PDP_DEPOSIT_PARAM}=${PDP_DEPOSIT_RANGE}`
}
