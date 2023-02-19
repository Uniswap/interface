import { ChainId, ChainType, getChainType } from '@kyberswap/ks-sdk-core'

import { SolanaNetworkInfo } from 'constants/networks/type'

import {
  arbitrum,
  arbitrumTestnet,
  aurora,
  avax,
  avaxTestnet,
  bnb,
  bnbTestnet,
  bttc,
  cronos,
  ethereum,
  ethw,
  fantom,
  görli,
  matic,
  mumbai,
  oasis,
  optimism,
  solana,
  velas,
} from './networks/index'
import { EVMNetworkInfo } from './networks/type'

type NETWORKS_INFO_CONFIG_TYPE = { [chainId in EVM_NETWORK]: EVMNetworkInfo } & {
  [chainId in ChainId.SOLANA]: SolanaNetworkInfo
}
export const NETWORKS_INFO_CONFIG: NETWORKS_INFO_CONFIG_TYPE = {
  [ChainId.MAINNET]: ethereum,
  [ChainId.ETHW]: ethw,
  [ChainId.GÖRLI]: görli,
  [ChainId.MATIC]: matic,
  [ChainId.MUMBAI]: mumbai,
  [ChainId.BSCMAINNET]: bnb,
  [ChainId.BSCTESTNET]: bnbTestnet,
  [ChainId.AVAXMAINNET]: avax,
  [ChainId.AVAXTESTNET]: avaxTestnet,
  [ChainId.FANTOM]: fantom,
  [ChainId.CRONOS]: cronos,
  [ChainId.ARBITRUM]: arbitrum,
  [ChainId.ARBITRUM_TESTNET]: arbitrumTestnet,
  [ChainId.BTTC]: bttc,
  [ChainId.VELAS]: velas,
  [ChainId.AURORA]: aurora,
  [ChainId.OASIS]: oasis,
  [ChainId.OPTIMISM]: optimism,
  [ChainId.SOLANA]: solana,
} as const

//this Proxy helps fallback undefined ChainId by Ethereum info
export const NETWORKS_INFO = new Proxy(NETWORKS_INFO_CONFIG, {
  get(target, p) {
    const prop = p as any as ChainId
    if (p && target[prop]) return target[prop]
    return target[ChainId.MAINNET]
  },
})

export const SUPPORTED_NETWORKS = Object.keys(NETWORKS_INFO).map(Number) as ChainId[]

export const MAINNET_NETWORKS = [
  ChainId.MAINNET,
  ChainId.BSCMAINNET,
  ChainId.MATIC,
  ChainId.AVAXMAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.SOLANA,
  ChainId.BTTC,
  ChainId.OASIS,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.ETHW,
] as const

export type MAINNET_NETWORK = typeof MAINNET_NETWORKS[number]

export const EVM_NETWORKS = SUPPORTED_NETWORKS.filter(chainId => getChainType(chainId) === ChainType.EVM) as Exclude<
  ChainId,
  ChainId.SOLANA
>[]
export type EVM_NETWORK = typeof EVM_NETWORKS[number]

export const EVM_MAINNET_NETWORKS = MAINNET_NETWORKS.filter(
  chainId => getChainType(chainId) === ChainType.EVM,
) as Exclude<typeof MAINNET_NETWORKS[number], ChainId.SOLANA>[]
export type EVM_MAINNET_NETWORK = typeof EVM_MAINNET_NETWORKS[number]

export const WALLET_CONNECT_SUPPORTED_CHAIN_IDS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.ETHW,
  ChainId.MUMBAI,
  ChainId.MATIC,
  ChainId.BSCTESTNET,
  ChainId.BSCMAINNET,
  ChainId.AVAXTESTNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.BTTC,
  ChainId.ARBITRUM,
  ChainId.ARBITRUM_TESTNET,
  ChainId.AURORA,
  ChainId.VELAS,
  ChainId.OASIS,
  ChainId.OPTIMISM,
]

export function isEVM(chainId?: ChainId): chainId is EVM_NETWORK {
  if (!chainId) return false
  const chainType = getChainType(chainId)
  return chainType === ChainType.EVM
}
export function isSolana(chainId?: ChainId): chainId is ChainId.SOLANA {
  if (!chainId) return false
  const chainType = getChainType(chainId)
  return chainType === ChainType.SOLANA
}

type NetToChain = { [p: string]: ChainId | undefined }

export const TRUESIGHT_NETWORK_TO_CHAINID: NetToChain = SUPPORTED_NETWORKS.reduce((acc, chainId) => {
  const id = NETWORKS_INFO[chainId].trueSightId
  if (id) {
    return {
      ...acc,
      [id]: chainId,
    }
  }
  return acc
}, {} as NetToChain) as NetToChain

export const FAUCET_NETWORKS = [ChainId.BTTC]
export const CHAINS_SUPPORT_NEW_POOL_FARM_API: readonly ChainId[] = [
  ChainId.MAINNET,
  // ChainId.ETHW,
  // ChainId.MUMBAI,
  ChainId.MATIC,
  // ChainId.BSCTESTNET,
  ChainId.BSCMAINNET,
  // ChainId.AVAXTESTNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.BTTC,
  ChainId.ARBITRUM,
  // ChainId.ARBITRUM_TESTNET,
  ChainId.AURORA,
  // ChainId.VELAS,
  // ChainId.OASIS,
  // ChainId.OPTIMISM,
]
