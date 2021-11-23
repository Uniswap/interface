import { ChainId } from '@swapr/sdk'

import EthereumLogo from '../../assets/svg/ethereum-logo.svg'
import XDAILogo from '../../assets/svg/xdai-logo.svg'
import ArbitrumLogo from '../../assets/svg/arbitrum-one-logo.svg'

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
    color: '#49A9A7',
    tag: 'coming soon'
  },
  {
    chainId: ChainId.RINKEBY,
    name: 'Rinkeby',
    logoSrc: EthereumLogo,
    color: '#443780',
    tag: 'testnet'
  },
  {
    chainId: ChainId.ARBITRUM_RINKEBY,
    name: 'A. Rinkeby',
    logoSrc: ArbitrumLogo,
    color: '#b1a5e6',
    tag: 'testnet'
  }
]
