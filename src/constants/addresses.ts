import { FACTORY_ADDRESS as V2_FACTORY_ADDRESS } from '@pollum-io/v1-sdk'
import { FACTORY_ADDRESS as V3_FACTORY_ADDRESS } from '@pollum-io/v3-sdk'
import { SupportedChainId } from 'constants/chains'

import { constructSameAddressMap } from '../utils/constructSameAddressMap'

type AddressMap = { [chainId: number]: string }

export const UNI_ADDRESS: AddressMap = {
  [SupportedChainId.ROLLUX_TANENBAUM]: '0x817C777DEf2Fd6ffE2492C6CD124985C78Ee9235',
  [SupportedChainId.ROLLUX]: '0x48023b16c3e81AA7F6eFFbdEB35Bb83f4f31a8fd',
}

export const UNISWAP_NFT_AIRDROP_CLAIM_ADDRESS = '0x0000000000000000000000000000000000000000'

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
  ...constructSameAddressMap('0x2b75Ee991F4E5572451E186E5cd2148Ba4B286e5'),
}

export const MULTICALL_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0xc9E6E07CB460F36A6D5826f70647eff7e1823899'),
}

/**
 * The oldest V0 governance address
 */
export const GOVERNANCE_ALPHA_V0_ADDRESSES: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x0000000000000000000000000000000000000000', //TODO: deploy this contract to Rollux
}
/**
 * The older V1 governance address
 */
export const GOVERNANCE_ALPHA_V1_ADDRESSES: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x0000000000000000000000000000000000000000', //TODO: deploy this contract to Rollux
}
/**
 * The latest governor bravo that is currently admin of timelock
 */
export const GOVERNANCE_BRAVO_ADDRESSES: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x0000000000000000000000000000000000000000', //TODO: deploy this contract to Rollux
}

export const TIMELOCK_ADDRESS: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x0000000000000000000000000000000000000000', //TODO: deploy this contract to Rollux
}

export const MERKLE_DISTRIBUTOR_ADDRESS: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x0000000000000000000000000000000000000000', //TODO: deploy this contract to Rollux
}

export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {
  [SupportedChainId.ROLLUX]: '0x0000000000000000000000000000000000000000', //TODO: deploy this contract to Rollux
}

export const QUOTER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x4aa7D3a3D8025e653886EbD5f2e9416a7b4ADe22'),
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x4dB158Eec5c5d63F9A09535882b835f36d3fd012'),
}

export const ENS_REGISTRAR_ADDRESSES: AddressMap = {}

// export const SOCKS_CONTROLLER_ADDRESSES: AddressMap = {}

export const TICK_LENS_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x6dfd1ea91128733Dc96479b7d1b0F4bC36C31C44'),
}
