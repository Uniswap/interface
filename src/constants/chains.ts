export enum ChainId {
  MAINNET = 9001,
  TESTNET = 9000,
}

export const NETWORK_URLS: {
  [chainId in ChainId]: string
} = {
  [ChainId.MAINNET]: `https://eth.bd.evmos.org:8545`,
  [ChainId.TESTNET]: `https://evmos-archive-testnet.api.bdnodes.net:8545`,
}
