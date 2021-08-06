import { ChainId } from 'libs/sdk/src'
import Mainnet from '../assets/networks/mainnet-network.svg'
import Polygon from '../assets/networks/polygon-network.png'
import BSC from '../assets/networks/bsc-network.png'

export const NETWORK_ICON = {
  [ChainId.MAINNET]: Mainnet,
  [ChainId.ROPSTEN]: Mainnet,
  [ChainId.RINKEBY]: Mainnet,
  [ChainId.GÖRLI]: Mainnet,
  [ChainId.KOVAN]: Mainnet,
  [ChainId.MATIC]: Polygon,
  [ChainId.MUMBAI]: Polygon,
  [ChainId.BSCTESTNET]: BSC,
  [ChainId.BSCMAINNET]: BSC
}

export const NETWORK_LABEL: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'Ethereum',
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.KOVAN]: 'Kovan',
  [ChainId.MATIC]: 'Polygon',
  [ChainId.MUMBAI]: 'Mumbai',
  [ChainId.BSCTESTNET]: 'BSC',
  [ChainId.BSCMAINNET]: 'BSC'
}
