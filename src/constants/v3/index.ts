import { ChainId } from '@uniswap/sdk-core'

export const FACTORY_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0x5BbFe6FF864718cD1cE0F126be99e96239E3caDD',
  [ChainId.RINKEBY]: '0x7ba6C6345E7a73cC0D41d762C7Db9cb3DB721396',
  [ChainId.GÖRLI]: '0x5BbFe6FF864718cD1cE0F126be99e96239E3caDD',
  [ChainId.KOVAN]: '',
}

export const TICK_LENS_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0x1C8beBE5596b60A84e6d737229aDd502E14276Eb',
  [ChainId.RINKEBY]: '0xd4013a706fa79487989b595Df35eF8AD1ffBb422',
  [ChainId.GÖRLI]: '0x1C8beBE5596b60A84e6d737229aDd502E14276Eb',
  [ChainId.KOVAN]: '',
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0x921647f0c094e2e59CDE6DEfafD77743012f52bd',
  [ChainId.RINKEBY]: '0x30Ba713F78Ad3c175a25aD767e3f423549Ac2D65',
  [ChainId.GÖRLI]: '0x921647f0c094e2e59CDE6DEfafD77743012f52bd',
  [ChainId.KOVAN]: '',
}

export const NONFUNGIBLE_TOKEN_POSITION_DESCRIPTOR_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0xD2AAa0217a203d9FaB6e5272b211Be2Aba52f385',
  [ChainId.RINKEBY]: '0xAc03019C975F5e79215FeDAB4a1DC30Af3E478F2',
  [ChainId.GÖRLI]: '0xD2AAa0217a203d9FaB6e5272b211Be2Aba52f385',
  [ChainId.KOVAN]: '',
}

export const SWAP_ROUTER_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0xDD1B8aA26ac2330e39f8B291eA1E6a82A40E65C4',
  [ChainId.RINKEBY]: '0xD2AAa0217a203d9FaB6e5272b211Be2Aba52f385',
  [ChainId.GÖRLI]: '0xDD1B8aA26ac2330e39f8B291eA1E6a82A40E65C4',
  [ChainId.KOVAN]: '',
}

export const V2_MIGRATOR_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0x30Ba713F78Ad3c175a25aD767e3f423549Ac2D65',
  [ChainId.RINKEBY]: '0x864e344eCd7f3a9A4368dEC11Be8104db5770364',
  [ChainId.GÖRLI]: '0x30Ba713F78Ad3c175a25aD767e3f423549Ac2D65',
  [ChainId.KOVAN]: '',
}
