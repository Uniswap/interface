import { GraphQLApi } from '@universe/api'

export default function getNetworkLogoUrl(network: string, origin: string) {
  switch (network) {
    case GraphQLApi.Chain.Polygon:
      return origin + '/images/logos/Polygon_Logo.png'
    case GraphQLApi.Chain.Arbitrum:
      return origin + '/images/logos/Arbitrum_Logo.png'
    case GraphQLApi.Chain.Optimism:
      return origin + '/images/logos/Optimism_Logo.png'
    case GraphQLApi.Chain.Celo:
      return origin + '/images/logos/Celo_Logo.png'
    case GraphQLApi.Chain.Base:
      return origin + '/images/logos/Base_Logo.png'
    case GraphQLApi.Chain.Bnb:
      return origin + '/images/logos/BNB_Logo.png'
    case GraphQLApi.Chain.Avalanche:
      return origin + '/images/logos/Avax_Logo.png'
    case GraphQLApi.Chain.Blast:
      return origin + '/images/logos/Blast_Logo.png'
    case GraphQLApi.Chain.Zora:
      return origin + '/images/logos/Zora_Logo.png'
    case GraphQLApi.Chain.Zksync:
      return origin + '/images/logos/zkSync_Logo.png'
    case GraphQLApi.Chain.Unichain:
      return origin + '/images/logos/Unichain_Logo.png'
    default:
      return ''
  }
}
