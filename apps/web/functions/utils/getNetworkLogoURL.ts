import { GraphQLApi } from '@universe/api'
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
  GraphQLApi.Chain.Polygon,
  GraphQLApi.Chain.Arbitrum,
  GraphQLApi.Chain.Optimism,
  GraphQLApi.Chain.Celo,
  GraphQLApi.Chain.Base,
  GraphQLApi.Chain.Bnb,
  GraphQLApi.Chain.Avalanche,
  GraphQLApi.Chain.Blast,
  GraphQLApi.Chain.Zora,
  GraphQLApi.Chain.Zksync,
  GraphQLApi.Chain.Unichain,
] as const

type OgNetworkBadgeChain = (typeof OG_NETWORK_BADGE_CHAINS)[number]

const OG_NETWORK_BADGE_CHAIN_SET: ReadonlySet<string> = new Set(OG_NETWORK_BADGE_CHAINS)

/**
 * Inline PNG data URLs from `packages/ui` for `@vercel/og` / Satori (`<img src>`).
 * No separate static `/images/logos/*` fetches — logos ship inside the worker bundle.
 */
const NETWORK_LOGO_DATA_URL: Record<OgNetworkBadgeChain, string> = {
  [GraphQLApi.Chain.Polygon]: polygonLogo,
  [GraphQLApi.Chain.Arbitrum]: arbitrumLogo,
  [GraphQLApi.Chain.Optimism]: optimismLogo,
  [GraphQLApi.Chain.Celo]: celoLogo,
  [GraphQLApi.Chain.Base]: baseLogo,
  [GraphQLApi.Chain.Bnb]: bnbLogo,
  [GraphQLApi.Chain.Avalanche]: avalancheLogo,
  [GraphQLApi.Chain.Blast]: blastLogo,
  [GraphQLApi.Chain.Zora]: zoraLogo,
  [GraphQLApi.Chain.Zksync]: zksyncLogo,
  [GraphQLApi.Chain.Unichain]: unichainLogo,
}

/** Returns a data URL or empty string (no logo). `_origin` is unused; kept for call-site stability. */
export default function getNetworkLogoUrl(network: string, _origin: string): string {
  if (!OG_NETWORK_BADGE_CHAIN_SET.has(network)) {
    return ''
  }
  return NETWORK_LOGO_DATA_URL[network as OgNetworkBadgeChain]
}
