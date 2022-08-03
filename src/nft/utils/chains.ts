/* eslint-disable no-template-curly-in-string */
export type Chain = {
  name: string
  chain: string
  network: string
  rpc: string[]
  nativeCurrency: { name: string; symbol: string; decimals: number }
  infoURL: string
  chainId: number
  ens?: { registry: string }
  explorers?: { name: string; url: string; standard: string }[]
  aliases: string[]
  logoURL?: string
  slip44?: number
  faucets?: string[]
  parent?: { chain: string; type: string }
}

export enum ChainId {
  MAINNET = 1,
  POLYGON = 137,
  ROPSTEN = 3,
  RINKEBY = 4,
  KOVAN = 42,
  GOERLI = 5,
}

export const chains: Chain[] = [
  {
    aliases: ['ethereum', 'mainnet', 'homestead'],
    chain: 'ETH',
    chainId: 1,
    ens: { registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
    explorers: [{ name: 'etherscan', standard: 'EIP3091', url: 'https://etherscan.io' }],
    infoURL: 'https://ethereum.org',
    logoURL: 'https://cloudflare-ipfs.com/ipfs/QmU1rGfe87iNEC1rComqCREDT9hX86TiysU3mqJ5iSFb6i',
    name: 'Ethereum',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    network: 'mainnet',
    rpc: ['https://api.mycryptoapi.com/eth', 'https://cloudflare-eth.com'],
    slip44: 60,
  },

  {
    aliases: ['polygon', 'matic'],
    chain: 'Polygon',
    chainId: 137,
    explorers: [
      {
        name: 'polygonscan',
        standard: 'EIP3091',
        url: 'https://polygonscan.com',
      },
    ],
    infoURL: 'https://matic.network/',
    logoURL: 'https://cloudflare-ipfs.com/ipfs/bafkreidhxhnuwatm7xoiwuniiwycewblmxiu65dkklt3t3fwtx2eumbswu',
    name: 'Polygon',
    nativeCurrency: { decimals: 18, name: 'Matic', symbol: 'MATIC' },
    network: 'mainnet',
    rpc: [
      'https://rpc-mainnet.matic.network',
      'wss://ws-mainnet.matic.network',
      'https://rpc-mainnet.matic.quiknode.pro',
      'https://matic-mainnet.chainstacklabs.com',
    ],
  },

  /// TESTNETS
  {
    aliases: ['ropsten'],
    chain: 'ETH',
    chainId: 3,
    ens: { registry: '0x112234455c3a32fd11230c42e7bccd4a84e02010' },
    explorers: [
      {
        name: 'etherscan-ropsten',
        standard: 'EIP3091',
        url: 'https://ropsten.etherscan.io',
      },
    ],
    faucets: ['https://faucet.ropsten.be?${ADDRESS}'],
    infoURL: 'https://github.com/ethereum/ropsten',
    name: 'Ropsten',
    nativeCurrency: { decimals: 18, name: 'Ropsten Ether', symbol: 'ETH' },
    network: 'ropsten',
    rpc: [],
  },
  {
    aliases: ['rinkeby'],
    chain: 'ETH',
    chainId: 4,
    ens: { registry: '0xe7410170f87102df0055eb195163a03b7f2bff4a' },
    explorers: [
      {
        name: 'etherscan-rinkeby',
        standard: 'EIP3091',
        url: 'https://rinkeby.etherscan.io',
      },
    ],
    faucets: ['https://faucet.rinkeby.io'],
    infoURL: 'https://www.rinkeby.io',
    name: 'Rinkeby',
    nativeCurrency: { decimals: 18, name: 'Rinkeby Ether', symbol: 'ETH' },
    network: 'rinkeby',
    rpc: [],
  },
  {
    aliases: ['goerli'],
    chain: 'ETH',
    chainId: 5,
    ens: { registry: '0x112234455c3a32fd11230c42e7bccd4a84e02010' },
    faucets: ['https://goerli-faucet.slock.it/?address=${ADDRESS}', 'https://faucet.goerli.mudit.blog'],
    infoURL: 'https://goerli.net/#about',
    name: 'Görli',
    nativeCurrency: { decimals: 18, name: 'Görli Ether', symbol: 'ETH' },
    network: 'goerli',
    rpc: ['https://rpc.goerli.mudit.blog/', 'https://rpc.slock.it/goerli ', 'https://goerli.prylabs.net/'],
  },
  {
    aliases: ['kovan'],
    chain: 'ETH',
    chainId: 42,
    faucets: ['https://faucet.kovan.network', 'https://gitter.im/kovan-testnet/faucet'],
    infoURL: 'https://kovan-testnet.github.io/website',
    name: 'Kovan',
    nativeCurrency: { decimals: 18, name: 'Kovan Ether', symbol: 'ETH' },
    network: 'kovan',
    rpc: ['https://kovan.poa.network', 'http://kovan.poa.network:8545', 'ws://kovan.poa.network:8546'],
  },

  {
    aliases: ['matic testnet', 'polygon testnet', 'mumbai'],
    chain: 'Polygon',
    chainId: 80001,
    explorers: [
      {
        name: 'polygonscan',
        standard: 'EIP3091',
        url: 'https://mumbai.polygonscan.com/',
      },
    ],
    faucets: ['https://faucet.matic.network/'],
    infoURL: 'https://matic.network/',
    name: 'Polygon Testnet Mumbai',
    nativeCurrency: { decimals: 18, name: 'Matic', symbol: 'tMATIC' },
    network: 'testnet',
    rpc: ['https://rpc-mumbai.matic.today', 'wss://ws-mumbai.matic.today'],
  },
]
