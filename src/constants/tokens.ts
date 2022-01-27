import { Token } from '@uniswap/sdk-core'

import { WPHOTON, WETH9, Photon } from './native-token'

import { ChainId } from 'constants/chains'

export { WETH9, WPHOTON, Photon }

export const PHOTON = Photon.onChain(ChainId.MAINNET)

//@TODO Replace when launch
export const ATOM = makeToken('Mock ATOM', 'ATOM', 18, '0x221ab5e5Ec2B748abc3d0e9D771D258493DD9165')
export const USDC = makeToken('Mock USDC', 'USDC', 18, '0x880E63017A2854ECE5B23A5B84fbEeC0858e6551')
export const MEVMOS = makeToken('Mock EVMOS', 'MEVMOS', 18, '0xca20D595fEcB22f0D0E6ab4309324D2b7d300C63')
export const OSMOSIS = makeToken('Mock Osmosis', 'OSMOSIS', 18, '0x290A81340949c3C303313D54f4E99774e8bF85CD')
export const DIFFUSION = makeToken('Mock Diffusion', 'DIFF', 18, '0xca20D595fEcB22f0D0E6ab4309324D2b7d300C63')

function makeToken(name: string, symbol: string, decimals: number, mainAddress: string, testNetAddress?: string) {
  return {
    [ChainId.MAINNET]: new Token(ChainId.MAINNET, mainAddress, decimals, symbol, name),
    [ChainId.TESTNET]: new Token(ChainId.TESTNET, testNetAddress || mainAddress, decimals, symbol, name),
  }
}
