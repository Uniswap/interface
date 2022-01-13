import { ChainId } from '@swapr/sdk'

import EthereumLogo from '../../assets/svg/ethereum-logo.svg'
import ArbitrumLogo from '../../assets/svg/arbitrum-one-logo.svg'
import GnosisLogo from '../../assets/svg/gnosis-chain-logo.svg'

export const networkOptionsPreset = [
  // no tag - mainnets
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
  // TESTNETS
  {
    chainId: ChainId.RINKEBY,
    name: 'Rinkeby',
    logoSrc: EthereumLogo,
    color: '#443780',
    tag: 'testnets'
  },
  {
    chainId: ChainId.ARBITRUM_RINKEBY,
    name: 'A.\xa0Rinkeby',
    logoSrc: ArbitrumLogo,
    color: '#b1a5e6',
    tag: 'testnets'
  },
  // COMING SOON
  {
    chainId: ChainId.XDAI,
    name: 'Gnosis Chain',
    logoSrc: GnosisLogo,
    color: '#49A9A7',
    tag: 'coming soon'
  }
]
