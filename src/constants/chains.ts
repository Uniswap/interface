export enum ChainId {
  MAINNET = 9001,
  TESTNET = 9000,
}

export const NETWORK_URLS: {
  [chainId in ChainId]: string
} = {
  [ChainId.MAINNET]: `https://ethereum.rpc.evmos.org`,
  [ChainId.TESTNET]: `https://evmos-archive-testnet.api.bdnodes.net:8545`,
}
