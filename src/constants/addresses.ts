import { FACTORY_ADDRESS as V2_FACTORY_ADDRESS } from '@pollum-io/v1-sdk'
import { FACTORY_ADDRESS as V3_FACTORY_ADDRESS } from '@pollum-io/v2-sdk'
import { SupportedChainId } from 'constants/chains'

import { constructSameAddressMap } from '../utils/constructSameAddressMap'

type AddressMap = { [chainId: number]: string }

export const UNI_ADDRESS: AddressMap = constructSameAddressMap('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')

export const UNISWAP_NFT_AIRDROP_CLAIM_ADDRESS = '0x8B799381ac40b838BBA4131ffB26197C432AFe78'

export const V2_FACTORY_ADDRESSES: AddressMap = {
  [SupportedChainId.ROLLUX_TANENBAUM]: V2_FACTORY_ADDRESS,
}
export const V2_ROUTER_ADDRESS: AddressMap = {
  [SupportedChainId.ROLLUX_TANENBAUM]: '0x29f7Ad37EC018a9eA97D4b3fEebc573b5635fA84',
}

/* V3 Contract Addresses */
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap(V3_FACTORY_ADDRESS),
}

export const V3_MIGRATOR_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x8C2d6B3651989385D93b66cE61db6602457b257b'),
}

export const MULTICALL_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0xCbA1683e1f0BA5061573CCE7C1A73a80C3827cef'),
}

/**
 * The oldest V0 governance address
 */
export const GOVERNANCE_ALPHA_V0_ADDRESSES: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F', //TODO: deploy this contract to Rollux
}
/**
 * The older V1 governance address
 */
export const GOVERNANCE_ALPHA_V1_ADDRESSES: AddressMap = {
  [SupportedChainId.ROLLUX]: '0xC4e172459f1E7939D522503B81AFAaC1014CE6F6', //TODO: deploy this contract to Rollux
}
/**
 * The latest governor bravo that is currently admin of timelock
 */
export const GOVERNANCE_BRAVO_ADDRESSES: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3', //TODO: deploy this contract to Rollux
}

export const TIMELOCK_ADDRESS: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3', //TODO: deploy this contract to Rollux
}

export const MERKLE_DISTRIBUTOR_ADDRESS: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x090D4613473dEE047c3f2706764f49E0821D256e', //TODO: deploy this contract to Rollux
}

export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {
  [SupportedChainId.ROLLUX]: '0xeca4B0bDBf7c55E9b7925919d03CbF8Dc82537E8', //TODO: deploy this contract to Rollux
}

export const QUOTER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xC3d7521CD0Dbde97d9607C4e6389B806B36e8f66'),
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xc224d913A70c2AaF34B6f72479995B114020ad8b'),
}

export const ENS_REGISTRAR_ADDRESSES: AddressMap = {}

export const SOCKS_CONTROLLER_ADDRESSES: AddressMap = {}

export const TICK_LENS_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x36975dfB9B2b1c858f77c6797cf7454ACC57816f'),
}
