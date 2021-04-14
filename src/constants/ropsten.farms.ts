import { ChainId, Token, WETH } from 'libs/sdk/src'

import { KNC_ADDRESS_ROPSTEN, KNCL_ADDRESS_ROPSTEN } from '.'
import { FarmConfig } from './types'

const farms: FarmConfig[] = [
  {
    lpAddress: '0xdD35aaf12d310777BD32dba66132cB57394a86aF',
    token: new Token(ChainId.ROPSTEN, KNC_ADDRESS_ROPSTEN, 18, 'KNC', 'Kyber Network Crystal'),
    quoteToken: WETH[ChainId.ROPSTEN]
  },
  {
    lpAddress: '0x4F54C52D446605f324f30dDd79547D607255612E',
    token: new Token(ChainId.ROPSTEN, KNCL_ADDRESS_ROPSTEN, 18, 'KNCL', 'Kyber Network Crystal Legacy'),
    quoteToken: WETH[ChainId.ROPSTEN]
  },
  {
    lpAddress: '0xa996f6c28AeB2E0b4395D3227e2E0b5C07650c55',
    token: new Token(ChainId.ROPSTEN, KNCL_ADDRESS_ROPSTEN, 18, 'KNCL', 'Kyber Network Crystal Legacy'),
    quoteToken: WETH[ChainId.ROPSTEN]
  },
  {
    lpAddress: '0x46Ac9631Da5bF389E2D07579D33849d30C57553d',
    token: new Token(ChainId.ROPSTEN, KNCL_ADDRESS_ROPSTEN, 18, 'KNCL', 'Kyber Network Crystal Legacy'),
    quoteToken: WETH[ChainId.ROPSTEN]
  }
]

export default farms
