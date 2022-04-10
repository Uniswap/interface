import { Token } from '@uniswap/sdk-core'

import { WEVMOS, WETH9, Evmos } from './native-token'

import { ChainId } from 'constants/chains'
import { TESTNET } from './periphery'

export { WETH9, WEVMOS, Evmos }

export const EVMOS = Evmos.onChain(ChainId.MAINNET)

export const ATOM = {
  //@TODO: FIX MAINNET
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0x2764b262E60D3Ac96999F7e73b0628B09CbB367E', 18, 'MATOM', 'Mock ATOM'),
  [ChainId.TESTNET]: new Token(ChainId.TESTNET, TESTNET.mockATOM, 18, 'MATOM', 'Mock ATOM'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, '0xC97D061637D6b3a3E54AC76537B2635B112ecdad', 18, 'MATOM', 'Mock ATOM'),
}

export const USDC = {
  //@TODO: FIX MAINNET
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0x6aBdDa34Fb225be4610a2d153845e09429523Cd2', 18, 'MUSDC', 'Mock USDC'),
  [ChainId.TESTNET]: new Token(ChainId.TESTNET, TESTNET.mockUSDC, 18, 'MUSDC', 'Mock USDC'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, '0xB2E91f27a9766bFD925D66D88B78D2cE64a846b6', 18, 'MUSDC', 'Mock USDC'),
}
export const MEVMOS = makeToken('Mock EVMOS', 'MEVMOS', 18, {
  //@TODO: FIX MAINNET
  [ChainId.MAINNET]: '0xFCd2Ce20ef8ed3D43Ab4f8C2dA13bbF1C6d9512F',
  [ChainId.TESTNET]: TESTNET.mockEVMOS,
  [ChainId.RINKEBY]: '0xDfbBc5573024984ddac30BbE632fa3DAA821aBaD',
})
export const OSMOSIS = makeToken('Mock Osmosis', 'OSMOSIS', 18, {
  //@TODO: FIX MAINNET
  [ChainId.MAINNET]: '0x067eC87844fBD73eDa4a1059F30039584586e09d',
  [ChainId.TESTNET]: TESTNET.mockOSMOSIS,
  [ChainId.RINKEBY]: '0x7F2D8c2bb0cD4368C9f44198e0Cd1486cD5Ae1aA',
})
export const DIFFUSION = makeToken('Mock Diffusion', 'DIFF', 18, {
  //@TODO: FIX MAINNET & RINKEBY
  [ChainId.MAINNET]: '0x067eC87844fBD73eDa4a1059F30039584586e09d',
  [ChainId.TESTNET]: TESTNET.diffusion || '0x067eC87844fBD73eDa4a1059F30039584586e09d',
  // Minichef Main Reward
  [ChainId.RINKEBY]: '0x655dfdd82cb10dc7fb931fd85d69887756b922fd ',
})

function makeToken(name: string, symbol: string, decimals: number, addresses: Record<ChainId, string>) {
  return {
    [ChainId.MAINNET]: new Token(ChainId.MAINNET, addresses[ChainId.MAINNET], decimals, symbol, name),
    [ChainId.TESTNET]: new Token(ChainId.TESTNET, addresses[ChainId.TESTNET], decimals, symbol, name),
    [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, addresses[ChainId.TESTNET], decimals, symbol, name),
  }
}
