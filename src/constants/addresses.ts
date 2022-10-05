// Copied from https://github.com/Uniswap/interface/blob/main/src/constants/addresses.ts
import { FACTORY_ADDRESS as V2_FACTORY_ADDRESS } from '@uniswap/v2-sdk'
import { FACTORY_ADDRESS as V3_FACTORY_ADDRESS } from '@uniswap/v3-sdk'
import { ChainId, L1_CHAIN_IDS } from 'src/constants/chains'

type AddressMap = { [chainId: number]: string }

const SUPPORTED_L1_L2_CHAINS = [
  ChainId.Optimism,
  ChainId.ArbitrumOne,
  ChainId.Polygon,
  ChainId.PolygonMumbai,
]

/** Address that represents native currencies on ETH, Polygon, etc. */
export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

export const MATIC_MAINNET_ADDRESS = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'

/** Alternative addres used to denote a native currency (e.g. MATIC on Polygon) */
export const NATIVE_ADDRESS_ALT = '0x0000000000000000000000000000000000001010'

export const UNI_ADDRESS: AddressMap = constructSameAddressMap(
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
)
export const MULTICALL_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984', [
    ChainId.Optimism,
    ChainId.Polygon,
    ChainId.PolygonMumbai,
  ]),
  [ChainId.ArbitrumOne]: '0xadF885960B47eA2CD9B55E6DAc6B42b7Cb2806dB',
}
export const V2_FACTORY_ADDRESSES: AddressMap = constructSameAddressMap(V2_FACTORY_ADDRESS)
export const SWAP_ROUTER_ADDRESSES: AddressMap = constructSameAddressMap(
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  SUPPORTED_L1_L2_CHAINS
)

/**
 * The oldest V0 governance address
 */
export const GOVERNANCE_ALPHA_V0_ADDRESSES: AddressMap = constructSameAddressMap(
  '0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F'
)
/**
 * The older V1 governance address
 */
export const GOVERNANCE_ALPHA_V1_ADDRESSES: AddressMap = {
  [ChainId.Mainnet]: '0xC4e172459f1E7939D522503B81AFAaC1014CE6F6',
}
/**
 * The latest governor bravo that is currently admin of timelock
 */
export const GOVERNANCE_BRAVO_ADDRESSES: AddressMap = {
  [ChainId.Mainnet]: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
}

export const TIMELOCK_ADDRESS: AddressMap = constructSameAddressMap(
  '0x1a9C8182C09F50C8318d769245beA52c32BE35BC'
)

export const MERKLE_DISTRIBUTOR_ADDRESS: AddressMap = {
  [ChainId.Mainnet]: '0x090D4613473dEE047c3f2706764f49E0821D256e',
}
export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {
  [ChainId.Mainnet]: '0xeca4B0bDBf7c55E9b7925919d03CbF8Dc82537E8',
}
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = constructSameAddressMap(
  V3_FACTORY_ADDRESS,
  SUPPORTED_L1_L2_CHAINS
)
export const QUOTER_ADDRESSES: AddressMap = constructSameAddressMap(
  '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  SUPPORTED_L1_L2_CHAINS
)
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = constructSameAddressMap(
  '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  SUPPORTED_L1_L2_CHAINS
)
export const ENS_REGISTRAR_ADDRESSES: AddressMap = {
  [ChainId.Mainnet]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [ChainId.Goerli]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
}
export const SOCKS_CONTROLLER_ADDRESSES: AddressMap = {
  [ChainId.Mainnet]: '0x65770b5283117639760beA3F867b69b3697a91dd',
}
export const V3_MIGRATOR_ADDRESSES: AddressMap = constructSameAddressMap(
  '0xA5644E29708357803b5A882D272c41cC0dF92B34',
  [ChainId.ArbitrumOne, ChainId.Polygon, ChainId.PolygonMumbai]
)

export function constructSameAddressMap<T extends string>(
  address: T,
  additionalNetworks: ChainId[] = []
): { [chainId: number]: T } {
  return (L1_CHAIN_IDS as readonly ChainId[])
    .concat(additionalNetworks)
    .reduce<{ [chainId: number]: T }>((memo, chainId) => {
      memo[chainId] = address
      return memo
    }, {})
}
