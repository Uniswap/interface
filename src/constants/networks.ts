import { ChainId } from '@kyberswap/ks-sdk-core'
import Mainnet from '../assets/networks/mainnet-network.svg'
import Polygon from '../assets/networks/polygon-network.png'
import BSC from '../assets/networks/bsc-network.png'
import AVAX from '../assets/networks/avax-network.png'
import FTM from '../assets/networks/fantom-network.png'
import CRONOS from '../assets/networks/cronos-network.png'
import AURORA from '../assets/networks/aurora-network.svg'
import ARBITRUM from '../assets/networks/arbitrum-network.svg'
import VELAS from '../assets/networks/velas-network.png'
import OASIS from '../assets/networks/oasis-network.svg'
import BTT from '../assets/networks/bttc.png'
import { convertToSlug } from 'utils/string'

export const SUPPORTED_NETWORKS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.ARBITRUM,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.OASIS,
  ChainId.BTTC,

  ...(process.env.REACT_APP_MAINNET_ENV === 'staging'
    ? [ChainId.ROPSTEN, ChainId.MUMBAI, ChainId.BSCTESTNET, ChainId.AVAXTESTNET, ChainId.FANTOM, ChainId.CRONOSTESTNET]
    : []),
]

export type SupportedNetwork = typeof SUPPORTED_NETWORKS[number]

export const NETWORK_ICON = {
  [ChainId.MAINNET]: Mainnet,
  [ChainId.ROPSTEN]: Mainnet,
  [ChainId.RINKEBY]: Mainnet,
  [ChainId.GÖRLI]: Mainnet,
  [ChainId.KOVAN]: Mainnet,
  [ChainId.MATIC]: Polygon,
  [ChainId.MUMBAI]: Polygon,
  [ChainId.BSCTESTNET]: BSC,
  [ChainId.BSCMAINNET]: BSC,
  [ChainId.AVAXTESTNET]: AVAX,
  [ChainId.AVAXMAINNET]: AVAX,
  [ChainId.FANTOM]: FTM,
  [ChainId.CRONOSTESTNET]: CRONOS,
  [ChainId.CRONOS]: CRONOS,
  [ChainId.AURORA]: AURORA,
  [ChainId.BTTC]: BTT,
  [ChainId.ARBITRUM]: ARBITRUM,
  [ChainId.ARBITRUM_TESTNET]: ARBITRUM,
  [ChainId.VELAS]: VELAS,
  [ChainId.OASIS]: OASIS,
}

export const NETWORK_LABEL: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'Ethereum',
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.KOVAN]: 'Kovan',
  [ChainId.MATIC]: 'Polygon',
  [ChainId.MUMBAI]: 'Mumbai',
  [ChainId.BSCTESTNET]: 'BNB Testnet',
  [ChainId.BSCMAINNET]: 'BNB Chain',
  [ChainId.AVAXTESTNET]: 'Avalanche Testnet',
  [ChainId.AVAXMAINNET]: 'Avalanche',
  [ChainId.FANTOM]: 'Fantom',
  [ChainId.CRONOSTESTNET]: 'Cronos Testnet',
  [ChainId.CRONOS]: 'Cronos',
  [ChainId.AURORA]: 'Aurora',
  [ChainId.ARBITRUM]: 'Arbitrum',
  [ChainId.ARBITRUM_TESTNET]: 'Arbitrum Testnet',
  [ChainId.BTTC]: 'BitTorrent',
  [ChainId.VELAS]: 'Velas',
  [ChainId.OASIS]: 'Oasis',
}

type NetToChain = { [p: string]: ChainId }

// map network to chainId, key is slug of NETWORK_LABEL
export const NETWORK_TO_CHAINID: NetToChain = Object.keys(NETWORK_LABEL).reduce((rs: NetToChain, key: string) => {
  const key2 = (key as unknown) as ChainId
  const value: string = NETWORK_LABEL[key2] || ''
  rs[convertToSlug(value)] = key2
  return rs
}, {} as NetToChain)

export const MAP_TOKEN_HAS_MULTI_BY_NETWORK = {
  // these network have many type of usdt, .... =>  hardcode 1 type
  avalanche: { usdt: 'usdt.e' },
  bittorrent: { usdt: 'usdt_e' },
}

export const TRUESIGHT_NETWORK_TO_CHAINID: NetToChain = {
  eth: ChainId.MAINNET,
  bsc: ChainId.BSCMAINNET,
  avax: ChainId.AVAXMAINNET,
  polygon: ChainId.MATIC,
  fantom: ChainId.FANTOM,
  cronos: ChainId.CRONOS,
}
