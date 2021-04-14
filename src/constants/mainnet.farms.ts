import { ChainId, Token, WETH } from 'libs/sdk/src'

import { KNC_ADDRESS } from '.'
import { FarmConfig } from './types'

const farms: FarmConfig[] = [
  {
    lpAddress: '0x663cf0567df7b3Eda0eF5Ac1222BEFD0DEBe11AA',
    token: new Token(ChainId.MAINNET, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
    quoteToken: WETH[ChainId.MAINNET]
  },
  {
    lpAddress: '0x566EB77Bf46c2863501c4149bdcd60D313056E8f',
    token: new Token(ChainId.MAINNET, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
    quoteToken: WETH[ChainId.MAINNET]
  }
]

export default farms
