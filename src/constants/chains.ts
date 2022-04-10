export enum ChainId {
  MAINNET = 9001,
  TESTNET = 9000,
  RINKEBY = 4,
}

export const NETWORK_URLS: {
  [chainId in ChainId]: string
} = {
  [ChainId.MAINNET]: `https://eth.bd.evmos.org:8545`,
  [ChainId.TESTNET]: `https://evmos-archive-testnet.api.bdnodes.net:8545`,
  // From Metamask
  [ChainId.RINKEBY]: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
}
