import { ChainId } from '@uniswap/sdk-core'

export const FACTORY_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '0xFeabCc62240297F1e4b238937D68e7516f0918D7',
  [ChainId.GÖRLI]: '0xA31B47971cdC5376E41CfA2D4378912156ab1F10',
  [ChainId.KOVAN]: '0x58f6b77148BE49BF7898472268ae8f26377d0AA6',
}

export const TICK_LENS_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '0x3d137e860008BaF6d1c063158e5ec0baBbcFefF8',
  [ChainId.GÖRLI]: '0x80AacDBEe92DC1c2Fbaa261Fb369696AF1AD9f98',
  [ChainId.KOVAN]: '0xB79bDE60fc227217f4EE2102dC93fa1264E33DaB',
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '0x2F9e608FD881861B8916257B76613Cb22EE0652c',
  [ChainId.GÖRLI]: '0xd6852c52B9c97cBfb7e79B6ab4407AA20Ba31439',
  [ChainId.KOVAN]: '0xA31B47971cdC5376E41CfA2D4378912156ab1F10',
}

export const SWAP_ROUTER_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '0x273Edaa13C845F605b5886Dd66C89AB497A6B17b',
  [ChainId.GÖRLI]: '0x91a64CCaead471caFF912314E466D9CF7C55E0E8',
  [ChainId.KOVAN]: '0x1988F2e49A72C4D73961C7f4Bb896819d3d2F6a3',
}

export const V2_MIGRATOR_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '0x03782388516e94FcD4c18666303601A12Aa729Ea',
  [ChainId.GÖRLI]: '0x2F9e608FD881861B8916257B76613Cb22EE0652c',
  [ChainId.KOVAN]: '0xFeabCc62240297F1e4b238937D68e7516f0918D7',
}
