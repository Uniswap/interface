export default function getNetworkLogoUrl(network: string) {
  switch (network) {
    case 'POLYGON':
      return 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    case 'ARBITRUM':
      return 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/arbitrum/assets/0x912CE59144191C1204E64559FE8253a0e49E6548/logo.png'
    case 'OPTIMISM':
      return 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/optimism/assets/0x4200000000000000000000000000000000000042/logo.png'
    case 'CELO':
      return 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    default:
      return ''
  }
}
