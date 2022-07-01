import { constructSameAddressMap } from '../utils/constructSameAddressMap'
import { SupportedChainId } from './chains'

type AddressMap = { [chainId: number]: string }
const { MAINNET, TESTNET } = SupportedChainId

export const XSP_ADDRESS: AddressMap = {
  [MAINNET]: '0x36726235dAdbdb4658D33E62a249dCA7c4B2bC68',
  [TESTNET]: '0xbC4979e749c28F81F22f95B603B350D9Ab0F172A',
}
export const WXDC_ADDRESS: AddressMap = {
  [MAINNET]: '0x951857744785E80e2De051c32EE7b25f9c458C42',
  [TESTNET]: '0x2a5c77b016Df1b3b0AE4E79a68F8adF64Ee741ba',
}
export const MULTICALL_ADDRESS: AddressMap = {
  [MAINNET]: '0x2aE7DcaF1e1AEf5Be1Ef63FCb0E70a519A4b8d7E',
  [TESTNET]: '0xFC96B6C4A1775aD2Cbe3fF6E2d82A190A69f7ABB',
}
export const V2_FACTORY_ADDRESSES: AddressMap = {
  [MAINNET]: '0x347D14b13a68457186b2450bb2a6c2Fd7B38352f',
  [TESTNET]: '0xCae66ac135d6489BDF5619Ae8F8f1e724765eb8f',
}
export const V2_ROUTER_ADDRESS: AddressMap = {
  [MAINNET]: '0xf9c5E4f6E627201aB2d6FB6391239738Cf4bDcf9',
  [TESTNET]: '0x3F11A24EB45d3c3737365b97A996949dA6c2EdDf',
}
export const XTT_PRESALE_ADDRESS: AddressMap = {
  [MAINNET]: '',
  [TESTNET]: '0xa22B00DB4Efe538449eBE18C78Dc215893d914Cc',
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
export const GOVERNANCE_ALPHA_V1_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0xC4e172459f1E7939D522503B81AFAaC1014CE6F6',
}
/**
 * The latest governor bravo that is currently admin of timelock
 */
export const GOVERNANCE_BRAVO_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
}

export const TIMELOCK_ADDRESS: AddressMap = constructSameAddressMap('0x1a9C8182C09F50C8318d769245beA52c32BE35BC')

export const MERKLE_DISTRIBUTOR_ADDRESS: AddressMap = {
  [SupportedChainId.MAINNET]: '0x090D4613473dEE047c3f2706764f49E0821D256e',
}
export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {
  [SupportedChainId.MAINNET]: '0xeca4B0bDBf7c55E9b7925919d03CbF8Dc82537E8',
}

export const QUOTER_ADDRESSES: AddressMap = constructSameAddressMap('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6')
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = constructSameAddressMap(
  '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
)
export const ENS_REGISTRAR_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [SupportedChainId.TESTNET]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
}
export const SOCKS_CONTROLLER_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x65770b5283117639760beA3F867b69b3697a91dd',
}

export const V3_MIGRATOR_ADDRESSES: AddressMap = constructSameAddressMap('0xA5644E29708357803b5A882D272c41cC0dF92B34')
