import { ChainId } from '@swapr/sdk'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.jpg'

export const networkOptionsPreset = [
  {
    chainId: ChainId.MAINNET,
    name: 'Ethereum',
    logoSrc: EthereumLogo
  },
  {
    chainId: ChainId.ARBITRUM_ONE,
    name: 'Arbitrum one',
    logoSrc: ArbitrumLogo
  },
  {
    chainId: ChainId.XDAI,
    name: 'xDai',
    logoSrc: XDAILogo
  }
]
