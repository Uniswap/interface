import { Token } from '@uniswap/sdk-core'

import { WEVMOS, WETH9, Evmos } from './native-token'

import { ChainId } from 'constants/chains'

export { WETH9, WEVMOS, Evmos }

export const EVMOS = Evmos.onChain(ChainId.MAINNET)

//@TODO Replace when launch
/*
    weth9: "0xcF5ef8d007a616066e5eaEa0916592374a0F478D",
    mockUSDC: "0x6aBdDa34Fb225be4610a2d153845e09429523Cd2",
    mockEVMOS: "0xFCd2Ce20ef8ed3D43Ab4f8C2dA13bbF1C6d9512F",
    mockATOM: "0x2764b262E60D3Ac96999F7e73b0628B09CbB367E",
    mockOSMOSIS: "0x067eC87844fBD73eDa4a1059F30039584586e09d",
    leftHandSideToken: "0xD6C474447cA995219B52E5c018665eCAfEB772e4",
    rightHandSideToken: "0x16bc4f17071A27Ebe6Af44e90bac6349057646a5",
 */

export const ATOM = makeToken('Mock ATOM', 'ATOM', 18, '0x2764b262E60D3Ac96999F7e73b0628B09CbB367E')
export const USDC = makeToken('Mock USDC', 'USDC', 18, '0x6aBdDa34Fb225be4610a2d153845e09429523Cd2')
export const MEVMOS = makeToken('Mock EVMOS', 'MEVMOS', 18, '0xFCd2Ce20ef8ed3D43Ab4f8C2dA13bbF1C6d9512F')
export const OSMOSIS = makeToken('Mock Osmosis', 'OSMOSIS', 18, '0x067eC87844fBD73eDa4a1059F30039584586e09d')
export const DIFFUSION = makeToken('Mock Diffusion', 'DIFF', 18, '0xca20D595fEcB22f0D0E6ab4309324D2b7d300C63')

function makeToken(name: string, symbol: string, decimals: number, mainAddress: string, testNetAddress?: string) {
  return {
    [ChainId.MAINNET]: new Token(ChainId.MAINNET, mainAddress, decimals, symbol, name),
    [ChainId.TESTNET]: new Token(ChainId.TESTNET, testNetAddress || mainAddress, decimals, symbol, name),
  }
}
