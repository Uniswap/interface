import { ChainId } from '@kyberswap/ks-sdk-core'
import { NetworkInfo } from './type'

import {
  ethereum,
  ropsten,
  rinkeby,
  görli,
  kovan,
  matic,
  mumbai,
  bnb,
  bnbTestnet,
  avax,
  avaxTestnet,
  fantom,
  cronos,
  cronosTestnet,
  arbitrum,
  arbitrumTestnet,
  bttc,
  velas,
  aurora,
  oasis,
  optimism,
} from './networks/index'

type NetToChain = { [p: string]: ChainId }

//todo move this to NETWORKS_INFO
export const TRUESIGHT_NETWORK_TO_CHAINID: NetToChain = {
  eth: ChainId.MAINNET,
  bsc: ChainId.BSCMAINNET,
  avax: ChainId.AVAXMAINNET,
  polygon: ChainId.MATIC,
  fantom: ChainId.FANTOM,
  cronos: ChainId.CRONOS,
}

export const NETWORKS_INFO_CONFIG: { [chain in ChainId]: NetworkInfo } = {
  [ChainId.MAINNET]: ethereum,
  [ChainId.ROPSTEN]: ropsten,
  [ChainId.RINKEBY]: rinkeby,
  [ChainId.GÖRLI]: görli,
  [ChainId.KOVAN]: kovan,
  [ChainId.MATIC]: matic,
  [ChainId.MUMBAI]: mumbai,
  [ChainId.BSCMAINNET]: bnb,
  [ChainId.BSCTESTNET]: bnbTestnet,
  [ChainId.AVAXMAINNET]: avax,
  [ChainId.AVAXTESTNET]: avaxTestnet,
  [ChainId.FANTOM]: fantom,
  [ChainId.CRONOS]: cronos,
  [ChainId.CRONOSTESTNET]: cronosTestnet,
  [ChainId.ARBITRUM]: arbitrum,
  [ChainId.ARBITRUM_TESTNET]: arbitrumTestnet,
  [ChainId.BTTC]: bttc,
  [ChainId.VELAS]: velas,
  [ChainId.AURORA]: aurora,
  [ChainId.OASIS]: oasis,
  [ChainId.OPTIMISM]: optimism,
}

//this Proxy helps fallback undefined ChainId by Ethereum info
export const NETWORKS_INFO = new Proxy(NETWORKS_INFO_CONFIG, {
  get(target, p) {
    const prop = (p as any) as ChainId
    if (p && target[prop]) return target[prop]
    return target[ChainId.MAINNET]
  },
})

export const SUPPORTED_NETWORKS = Object.keys(NETWORKS_INFO).map(Number) as ChainId[]

export const MAINNET_NETWORKS = [
  ChainId.MAINNET,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.ARBITRUM,
  ChainId.BTTC,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.OASIS,
  ChainId.OPTIMISM,
]
