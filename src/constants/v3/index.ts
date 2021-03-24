import { ChainId } from '@uniswap/sdk-core'

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: { [chainId in ChainId | 1337]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '',
  [ChainId.GÖRLI]: '',
  [ChainId.KOVAN]: '',
  [1337]: '0xee9e30637f84Bbf929042A9118c6E20023dab833',
}

export const NONFUNGIBLE_TOKEN_POSITION_DESCRIPTOR_ADDRESSES: { [chainId in ChainId | 1337]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '',
  [ChainId.GÖRLI]: '',
  [ChainId.KOVAN]: '',
  [1337]: '0x3431b9Ed12e3204bC6f7039e1c576417B70fdD67',
}

export const SWAP_ROUTER_ADDRESSES: { [chainId in ChainId | 1337]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '',
  [ChainId.GÖRLI]: '',
  [ChainId.KOVAN]: '',
  [1337]: '0xa0588c89Fe967e66533aB1A0504C30989f90156f',
}
