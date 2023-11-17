import { Chain } from '../../src/graphql/data/__generated__/types-and-hooks'

export default function getNetworkLogoUrl(network: string, origin: string) {
  switch (network) {
    case Chain.Polygon:
      return origin + '/images/logos/Polygon_Logo.png'
    case Chain.Arbitrum:
      return origin + '/images/logos/Arbitrum_Logo.png'
    case Chain.Optimism:
      return origin + '/images/logos/Optimism_Logo.png'
    case Chain.Celo:
      return origin + '/images/logos/Celo_Logo.png'
    default:
      return ''
  }
}
