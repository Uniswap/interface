import { Token } from '@uniswap/sdk-core'

import { WEVMOS, Evmos } from './native-token'

import { ChainId } from 'constants/chains'
import { TESTNET } from './periphery'

export { WEVMOS, Evmos }

export const EVMOS = Evmos.onChain(ChainId.MAINNET)

/** ---------- NOMAD TOKENS
 * https://docs.nomad.xyz/bridge/domains.html#milkomeda-c1
 * ----------- */
export const WETH = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0x5842C5532b61aCF3227679a8b1BD0242a41752f2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
}

export const WBTC = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xF80699Dc594e00aE7bA200c7533a07C1604A106D', 8, 'WBTC', 'Wrapped BTC'),
}

export const DAI = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0x63743ACF2c7cfee65A5E356A4C4A005b586fC7AA',
    18,
    'DAI',
    'Dai Stablecoin'
  ),
}

export const USDC = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0x51e44FfaD5C2B122C8b635671FCC8139dc636E82', 6, 'USDC', 'USD Coin'),
  [ChainId.TESTNET]: new Token(ChainId.TESTNET, TESTNET.mockUSDC, 18, 'MUSDC', 'Mock USDC'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, '0xB2E91f27a9766bFD925D66D88B78D2cE64a846b6', 18, 'MUSDC', 'Mock USDC'),
}

export const TETHER = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0x7FF4a56B32ee13D7D4D405887E0eA37d61Ed919e', 6, 'USDT', 'Tether USD'),
}

export const FRAX = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0x28eC4B29657959F4A5052B41079fe32919Ec3Bd3', 18, 'FRAX', 'FRAX'),
}

export const FXS = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xd0ec216A38F199B0229AE668a96c3Cd9F9f118A6', 18, 'FXS', 'FXS'),
}

/**
 * ------------ IBC Tokens
 */

export const ATOM = {
  //@TODO: FIX MAINNET
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0x2764b262E60D3Ac96999F7e73b0628B09CbB367E', 18, 'MATOM', 'Mock ATOM'),
  [ChainId.TESTNET]: new Token(ChainId.TESTNET, TESTNET.mockATOM, 18, 'MATOM', 'Mock ATOM'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, '0xC97D061637D6b3a3E54AC76537B2635B112ecdad', 18, 'MATOM', 'Mock ATOM'),
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
  [ChainId.MAINNET]: '0x3f75ceabCDfed1aCa03257Dc6Bdc0408E2b4b026',
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
