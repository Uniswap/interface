import { ChainId } from '@dynamic-amm/sdk'
import Mainnet from '../assets/networks/mainnet-network.svg'
import Polygon from '../assets/networks/polygon-network.png'
import BSC from '../assets/networks/bsc-network.png'
import AVAX from '../assets/networks/avax-network.png'
import FTM from '../assets/networks/fantom-network.png'

export const SUPPORTED_NETWORKS = [
  ChainId.MAINNET,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM
] as const
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
  [ChainId.FANTOM]: FTM
}

export const NETWORK_LABEL: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'Ethereum',
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.KOVAN]: 'Kovan',
  [ChainId.MATIC]: 'Polygon',
  [ChainId.MUMBAI]: 'Mumbai',
  [ChainId.BSCTESTNET]: 'BSC Testnet',
  [ChainId.BSCMAINNET]: 'BSC',
  [ChainId.AVAXTESTNET]: 'Avalanche Testnet',
  [ChainId.AVAXMAINNET]: 'Avalanche',
  [ChainId.FANTOM]: 'Fantom'
}
