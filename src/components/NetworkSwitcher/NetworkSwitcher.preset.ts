import { ChainId } from '@swapr/sdk'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.jpg'

import { NetworkSwitcherOptionsPreset } from './NetworkSwitcher.types'

export const networkSwitcherOptionsPreset: NetworkSwitcherOptionsPreset = {
  [ChainId.MAINNET]: {
    header: 'Ethereum',
    logoSrc: EthereumLogo
  },
  [ChainId.ARBITRUM_ONE]: {
    header: 'Arbitrum one',
    logoSrc: ArbitrumLogo
  },
  [ChainId.XDAI]: {
    header: 'xDai',
    logoSrc: XDAILogo
  }
}
