import { UniverseChainId } from '@universe/chains'
import arbitrumLogo from 'ui/src/assets/logos/png/arbitrum-logo.png?inline'
import avalancheLogo from 'ui/src/assets/logos/png/avalanche-logo.png?inline'
import baseLogo from 'ui/src/assets/logos/png/base-logo.png?inline'
import blastLogo from 'ui/src/assets/logos/png/blast-logo.png?inline'
import bnbLogo from 'ui/src/assets/logos/png/bnb-logo.png?inline'
import celoLogo from 'ui/src/assets/logos/png/celo-logo.png?inline'
import optimismLogo from 'ui/src/assets/logos/png/optimism-logo.png?inline'
import polygonLogo from 'ui/src/assets/logos/png/polygon-logo.png?inline'
import unichainLogo from 'ui/src/assets/logos/png/unichain-logo.png?inline'
import zksyncLogo from 'ui/src/assets/logos/png/zksync-logo.png?inline'
import zoraLogo from 'ui/src/assets/logos/png/zora-logo.png?inline'

/**
 * Chains that show an inlined network badge on OG images. Tests iterate this list so
 * refactors that drop a `?inline` import or a `packages/ui` path fail in CI.
 */
export const OG_NETWORK_BADGE_CHAINS = [
  UniverseChainId.Polygon,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Optimism,
  UniverseChainId.Celo,
  UniverseChainId.Base,
  UniverseChainId.Bnb,
  UniverseChainId.Avalanche,
  UniverseChainId.Blast,
  UniverseChainId.Zora,
  UniverseChainId.Zksync,
  UniverseChainId.Unichain,
] as const

type OgNetworkBadgeChain = (typeof OG_NETWORK_BADGE_CHAINS)[number]

/**
 * Inline PNG data URLs from `packages/ui` for `@vercel/og` / Satori (`<img src>`).
 * No separate static `/images/logos/*` fetches — logos ship inside the worker bundle.
 */
const NETWORK_LOGO_DATA_URL: Record<OgNetworkBadgeChain, string> = {
  [UniverseChainId.Polygon]: polygonLogo,
  [UniverseChainId.ArbitrumOne]: arbitrumLogo,
  [UniverseChainId.Optimism]: optimismLogo,
  [UniverseChainId.Celo]: celoLogo,
  [UniverseChainId.Base]: baseLogo,
  [UniverseChainId.Bnb]: bnbLogo,
  [UniverseChainId.Avalanche]: avalancheLogo,
  [UniverseChainId.Blast]: blastLogo,
  [UniverseChainId.Zora]: zoraLogo,
  [UniverseChainId.Zksync]: zksyncLogo,
  [UniverseChainId.Unichain]: unichainLogo,
}

/**
 * Returns a data URL, or an empty string for a chain with no OG badge (and for an unresolved
 * chain id, so callers can pass a URL-param lookup straight through).
 * `_origin` is unused; kept for call-site stability.
 */
export default function getNetworkLogoUrl(chainId: UniverseChainId | undefined, _origin: string): string {
  if (chainId === undefined) {
    return ''
  }
  return NETWORK_LOGO_DATA_URL[chainId as OgNetworkBadgeChain] ?? ''
}
