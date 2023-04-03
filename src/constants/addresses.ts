import { FACTORY_ADDRESS as V2_FACTORY_ADDRESS } from '@uniswap/v2-sdk'

import { constructSameAddressMap } from '../utils/constructSameAddressMap'
import { SupportedChainId } from './chains'

type AddressMap = { [chainId: number]: string }

export const UNI_ADDRESS: AddressMap = constructSameAddressMap('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')

export const UNISWAP_NFT_AIRDROP_CLAIM_ADDRESS = '0x8B799381ac40b838BBA4131ffB26197C432AFe78'

export const V2_FACTORY_ADDRESSES: AddressMap = constructSameAddressMap(V2_FACTORY_ADDRESS)
export const V2_ROUTER_ADDRESS: AddressMap = constructSameAddressMap('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D')

// evmos addresses
const EVMOS_V3_CORE_FACTORY_ADDRESSES = '0xf544365e7065966f190155F629cE0182fC68Eaa2'
const EVMOS_V3_MIGRATOR_ADDRESSES = '0x0c05b819733A21838376519a8Fb2552Cf16Bc828'
const EVMOS_MULTICALL_ADDRESS = '0xcF30595B19B299664e8d2CedF41EC8FA859F97b1'
const EVMOS_QUOTER_ADDRESSES = '0xacDD67285fFeF73c9C6778019d2fF0A75547048a'
const EVMOS_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = '0x5fE5dAAa011673289847dA4f76d63246DDB2965d'
const EVMOS_TICK_LENS_ADDRESSES = '0x8Ae03dB96E16C5cEec346Aae78A8103365F5232B'
const EVMOS_ROUTER_ADDRESS = '0x5b5e44da9718288244110e66a7cA6C537f36f948'

/* V3 Contract Addresses */
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: EVMOS_V3_CORE_FACTORY_ADDRESSES,
}

export const V3_MIGRATOR_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: EVMOS_V3_MIGRATOR_ADDRESSES,
}

export const MULTICALL_ADDRESS: AddressMap = {
  [SupportedChainId.MAINNET]: EVMOS_MULTICALL_ADDRESS,
}

export const SWAP_ROUTER_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: EVMOS_ROUTER_ADDRESS,
}

/**
 * The oldest V0 governance address
 */
export const GOVERNANCE_ALPHA_V0_ADDRESSES: AddressMap = constructSameAddressMap(
  '0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F'
)
/**
 * The older V1 governance address
 */
export const GOVERNANCE_ALPHA_V1_ADDRESSES: AddressMap = {}
/**
 * The latest governor bravo that is currently admin of timelock
 */
export const GOVERNANCE_BRAVO_ADDRESSES: AddressMap = {}

export const TIMELOCK_ADDRESS: AddressMap = constructSameAddressMap('0x1a9C8182C09F50C8318d769245beA52c32BE35BC')

export const MERKLE_DISTRIBUTOR_ADDRESS: AddressMap = {}

export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {}

export const QUOTER_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: EVMOS_QUOTER_ADDRESSES,
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: EVMOS_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
}

export const ENS_REGISTRAR_ADDRESSES: AddressMap = {}

export const SOCKS_CONTROLLER_ADDRESSES: AddressMap = {}

export const TICK_LENS_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: EVMOS_TICK_LENS_ADDRESSES,
}
