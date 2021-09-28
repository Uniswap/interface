import { ChainId } from '@swapr/sdk'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.jpg'

export const networkOptionsPreset = [
  {
    chainId: ChainId.MAINNET,
    name: 'Ethereum',
    logoSrc: EthereumLogo,
    color: '#627EEA'
  },
  {
    chainId: ChainId.ARBITRUM_ONE,
    name: 'Arbitrum one',
    logoSrc: ArbitrumLogo,
    color: '#2C374B'
  },
  {
    chainId: ChainId.XDAI,
    name: 'xDai',
    logoSrc: XDAILogo,
    color: '#49A9A7'
  },
  {
    chainId: ChainId.RINKEBY,
    name: 'Rinkeby',
    logoSrc: EthereumLogo,
    color: '#443780'
  },
  {
    chainId: ChainId.ARBITRUM_RINKEBY,
    name: 'Arbitrum Rinkeby',
    logoSrc: ArbitrumLogo,
    color: '#b1a5e6'
  }
]
