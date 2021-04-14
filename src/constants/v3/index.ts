import { ChainId } from '@uniswap/sdk-core'

export const FACTORY_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0xb31b9A7b331eA8993bdfC67c650eDbfc9256eC62',
  [ChainId.RINKEBY]: '0xD8A6adFB40Ba3B3CdA9F985BF1fdbDc0c1d7591e',
  [ChainId.GÖRLI]: '0xb31b9A7b331eA8993bdfC67c650eDbfc9256eC62',
  [ChainId.KOVAN]: '',
}

export const TICK_LENS_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0x8E984b597F19E8D0FDd0b5bAfDb1d0ae4386455f',
  [ChainId.RINKEBY]: '0xB1c59e8Ae4B72f63a5a9CB9c25A9253096A4b126',
  [ChainId.GÖRLI]: '0x8E984b597F19E8D0FDd0b5bAfDb1d0ae4386455f',
  [ChainId.KOVAN]: '',
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0x29e4bF3bFD649b807B4C752c01023E535094F6Bc',
  [ChainId.RINKEBY]: '0xee9e30637f84Bbf929042A9118c6E20023dab833',
  [ChainId.GÖRLI]: '0x29e4bF3bFD649b807B4C752c01023E535094F6Bc',
  [ChainId.KOVAN]: '',
}

export const NONFUNGIBLE_TOKEN_POSITION_DESCRIPTOR_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0xa0588c89Fe967e66533aB1A0504C30989f90156f',
  [ChainId.RINKEBY]: '0x3431b9Ed12e3204bC6f7039e1c576417B70fdD67',
  [ChainId.GÖRLI]: '0xa0588c89Fe967e66533aB1A0504C30989f90156f',
  [ChainId.KOVAN]: '',
}

export const SWAP_ROUTER_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '0x71bB3d0e63f2Fa2A5d04d54267211f4Caef7062e',
  [ChainId.RINKEBY]: '0xa0588c89Fe967e66533aB1A0504C30989f90156f',
  [ChainId.GÖRLI]: '0x71bB3d0e63f2Fa2A5d04d54267211f4Caef7062e',
  [ChainId.KOVAN]: '',
}

export const V2_MIGRATOR_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '0xb31b9A7b331eA8993bdfC67c650eDbfc9256eC62',
  [ChainId.GÖRLI]: '0xee9e30637f84Bbf929042A9118c6E20023dab833',
  [ChainId.KOVAN]: '',
}
