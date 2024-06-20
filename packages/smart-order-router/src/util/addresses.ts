import { CHAIN_TO_ADDRESSES_MAP, ChainId, Token } from '@ubeswap/sdk-core'

import { NETWORKS_WITH_SAME_UNISWAP_ADDRESSES } from './chains'

export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  [ChainId.CELO]: CHAIN_TO_ADDRESSES_MAP[ChainId.CELO].v3CoreFactoryAddress,
  [ChainId.CELO_ALFAJORES]: CHAIN_TO_ADDRESSES_MAP[ChainId.CELO_ALFAJORES].v3CoreFactoryAddress,
  // TODO: Gnosis + Moonbeam contracts to be deployed
}

export const QUOTER_V2_ADDRESSES: AddressMap = {
  [ChainId.CELO]: CHAIN_TO_ADDRESSES_MAP[ChainId.CELO].quoterAddress,
  [ChainId.CELO_ALFAJORES]: CHAIN_TO_ADDRESSES_MAP[ChainId.CELO_ALFAJORES].quoterAddress,
  // TODO: Gnosis + Moonbeam contracts to be deployed
}

export const MIXED_ROUTE_QUOTER_V1_ADDRESSES: AddressMap = {
  [ChainId.CELO]: CHAIN_TO_ADDRESSES_MAP[ChainId.CELO].mixedRouteQuoterV1Address,
  [ChainId.CELO_ALFAJORES]: CHAIN_TO_ADDRESSES_MAP[ChainId.CELO_ALFAJORES].mixedRouteQuoterV1Address,
}

export const UNISWAP_MULTICALL_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984'),
  [ChainId.CELO]: CHAIN_TO_ADDRESSES_MAP[ChainId.CELO].multicallAddress,
  [ChainId.CELO_ALFAJORES]: CHAIN_TO_ADDRESSES_MAP[ChainId.CELO_ALFAJORES].multicallAddress,
  // TODO: Gnosis + Moonbeam contracts to be deployed
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const SWAP_ROUTER_02_ADDRESSES = (_chainId: number): string => {
  return '0xE389f92B47d913F773254962eD638E12C28aA82d'
}

export const OVM_GASPRICE_ADDRESS = '0x420000000000000000000000000000000000000F'
export const ARB_GASINFO_ADDRESS = '0x000000000000000000000000000000000000006C'

export type AddressMap = { [chainId: number]: string | undefined }

export function constructSameAddressMap<T extends string>(
  address: T,
  additionalNetworks: ChainId[] = []
): { [chainId: number]: T } {
  return NETWORKS_WITH_SAME_UNISWAP_ADDRESSES.concat(additionalNetworks).reduce<{
    [chainId: number]: T
  }>((memo, chainId) => {
    memo[chainId] = address
    return memo
  }, {})
}

export const WETH9: {
  [ChainId.MAINNET]: Token
} = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
}
