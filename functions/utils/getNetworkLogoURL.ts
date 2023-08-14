import { Chain } from '../../src/graphql/data/__generated__/types-and-hooks'

export default function getNetworkLogoUrl(network: string) {
  switch (network) {
    case Chain.Polygon:
      return 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    case Chain.Arbitrum:
      return 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/arbitrum/assets/0x912CE59144191C1204E64559FE8253a0e49E6548/logo.png'
    case Chain.Optimism:
      return 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/optimism/assets/0x4200000000000000000000000000000000000042/logo.png'
    case Chain.Celo:
      return 'https://assets.coingecko.com/coins/images/11090/small/InjXBNx9_400x400.jpg?1674707499'
    default:
      return ''
  }
}
