import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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
    case Chain.Base:
      return origin + '/images/logos/Base_Logo.png'
    case Chain.Bnb:
      return origin + '/images/logos/BNB_Logo.png'
    case Chain.Avalanche:
      return origin + '/images/logos/Avax_Logo.png'
    case Chain.Blast:
      return origin + '/images/logos/Blast_Logo.png'
    default:
      return ''
  }
}
