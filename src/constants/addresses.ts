import { FACTORY_ADDRESS as V3_FACTORY_ADDRESS } from '@uniswap/v3-sdk'

import { constructSameAddressMap } from '../utils/constructSameAddressMap'
import { SupportedChainId } from './chains'

type AddressMap = { [chainId: number]: string }

const FACTORY_ADDRESS_V2 = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

export const UNI_ADDRESS: AddressMap = constructSameAddressMap(FACTORY_ADDRESS_V2)
export const MULTICALL_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984', [
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.OPTIMISM,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
  ]),
  [SupportedChainId.ARBITRUM_ONE]: '0xadF885960B47eA2CD9B55E6DAc6B42b7Cb2806dB',
  [SupportedChainId.ARBITRUM_RINKEBY]: '0xa501c031958F579dB7676fF1CE78AD305794d579',
  [SupportedChainId.BASE]: '0x091e99cb1C49331a94dD62755D168E941AbD0693',
}
export const V2_FACTORY_ADDRESSES: AddressMap = constructSameAddressMap('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f')
export const V2_ROUTER_ADDRESS: AddressMap = constructSameAddressMap('0x1111111254fb6c44bAC0beD2854e76F90643097d')
export const INCH_ROUTER_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x1111111254fb6c44bAC0beD2854e76F90643097d', [
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
  ]),
  [SupportedChainId.OPTIMISM]: '0x1111111254760f7ab3f16433eea9304126dcd199',
  [SupportedChainId.ARBITRUM_ONE]: '0x1111111254fb6c44bac0bed2854e76f90643097d',
  [SupportedChainId.BASE]: '0x111111125421cA6dc452d289314280a0f8842A65',
  [SupportedChainId.ARBITRUM_RINKEBY]: '0xa501c031958F579dB7676fF1CE78AD305794d579',
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

export const TREASURY_FEE_ADDRESS: AddressMap = {
  [SupportedChainId.KOVAN]: '0x9aE8F90f58a6bc41B469b386a0A49eBb94897fAE',
}

export const SKROMATIKA_ADDRESS: AddressMap = {
  [SupportedChainId.KOVAN]: '0xEcf12A780a922A8963A8f044e489F499Bf6494e7',
}

export const STAKING_ADDRESS: AddressMap = {
  [SupportedChainId.KOVAN]: '0x24C2F4d4e81620dBbC46E02d3DAc9A9c095DcF8C',
}

export const STAKING_DISTRIBUTOR_ADDRESS: AddressMap = {
  [SupportedChainId.KOVAN]: '0xa6b19D85a221d5C063b62570457c1171068ba9fd',
}

export const TIMELOCK_ADDRESS: AddressMap = constructSameAddressMap('0x1a9C8182C09F50C8318d769245beA52c32BE35BC')

export const MERKLE_DISTRIBUTOR_ADDRESS: AddressMap = {
  [SupportedChainId.MAINNET]: '0x090D4613473dEE047c3f2706764f49E0821D256e',
}
export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {
  [SupportedChainId.MAINNET]: '0xeca4B0bDBf7c55E9b7925919d03CbF8Dc82537E8',
}
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap(V3_FACTORY_ADDRESS, [
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
  ]),
  [SupportedChainId.BASE]: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
}

export const QUOTER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6', [
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
  ]),
  [SupportedChainId.BASE]: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xC36442b4a4522E871399CD717aBDD847Ab11FE88', [
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
  ]),
  [SupportedChainId.BASE]: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
}
export const ENS_REGISTRAR_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [SupportedChainId.ROPSTEN]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [SupportedChainId.GOERLI]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [SupportedChainId.RINKEBY]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
}
export const SOCKS_CONTROLLER_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x65770b5283117639760beA3F867b69b3697a91dd',
}
export const SWAP_ROUTER_ADDRESSES: AddressMap = constructSameAddressMap('0xE592427A0AEce92De3Edee1F18E0157C05861564', [
  SupportedChainId.OPTIMISM,
  SupportedChainId.OPTIMISTIC_KOVAN,
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.ARBITRUM_RINKEBY,
])
export const LIMIT_ORDER_MANAGER_ADDRESSES: AddressMap = {
  [SupportedChainId.KOVAN]: '0x66E15bb53c9C5fB1B9Aa19D84920A3965cEad8a7',
  [SupportedChainId.OPTIMISTIC_KOVAN]: '0x6bC9BFfF3CD847Fd1e061E3B275901b930872B4B',
  [SupportedChainId.OPTIMISM]: '0x7314Af7D05e054E96c44D7923E68d66475FfaAb8',
  [SupportedChainId.ARBITRUM_RINKEBY]: '0xf10A3841bc1ccEAe1DC162e66e615D2416A3adac',
  [SupportedChainId.ARBITRUM_ONE]: '0x02C282F60FB2f3299458c2B85EB7E303b25fc6F0',
  [SupportedChainId.MAINNET]: '0xD1fDF0144be118C30a53E1d08Cc1E61d600E508e',
  [SupportedChainId.POLYGON]: '0x03F490aE5b59E428E6692059d0Dca1B87ED42aE1',
  [SupportedChainId.POLYGON_MUMBAI]: '0x62052292295791fB07C95eF6F7ACD68ae475ee8C',
  [SupportedChainId.BASE]: '0x5Ca301d3feF15526C7a8b403f475A74eAfb9FED2',
}
export const KROM_TOKEN_ADDRESSES: AddressMap = {
  [SupportedChainId.KOVAN]: '0x4cEbC301Cd0E8AD64dE6B19576de7dd0B0140a1f',
  [SupportedChainId.OPTIMISTIC_KOVAN]: '0x0f747ed5De34aaDc17E39368b7d90da2D0545319',
  [SupportedChainId.OPTIMISM]: '0xF98dCd95217E15E05d8638da4c91125E59590B07',
  [SupportedChainId.ARBITRUM_RINKEBY]: '0x4f1BB8FD099170714AC6F756966616fCc39ae867',
  [SupportedChainId.ARBITRUM_ONE]: '0x55fF62567f09906A85183b866dF84bf599a4bf70',
  [SupportedChainId.MAINNET]: '0x3af33bef05c2dcb3c7288b77fe1c8d2aeba4d789',
  [SupportedChainId.POLYGON]: '0x14Af1F2f02DCcB1e43402339099A05a5E363b83c',
  [SupportedChainId.BASE]: '0xdfF3C626De2Ccd1ECf67E97abc8A74C102C86545',
}
export const UNISWAP_UTILS_ADDRESSES: AddressMap = {
  [SupportedChainId.KOVAN]: '0x9E1E4f041877f1aB604E5B109Cf699545e20E4bC',
}
export const KROMATIKA_ROUTER_ADDRESSES: AddressMap = {
  [SupportedChainId.ARBITRUM_ONE]: '0x79ba1CFF3998D7ce3DF452c3Fd6FCf817971Ea39',
  [SupportedChainId.POLYGON]: '0xCe7cbDA67DE0BFdBBBAEA0DB94434a722A353CF4',
  [SupportedChainId.OPTIMISM]: '0x6FE9F5616Ac30E0A66B5Bc68D05F081471835bf7',
  [SupportedChainId.BASE]: '0x43785836fb28be5bf7e3b519eff2acd4ffabd17d',
}
export const KROMATIKA_METASWAP_ADDRESSES: AddressMap = {
  [SupportedChainId.POLYGON]: '0xE10F5F77CF90c99976BceE524Fbf88504A2e6616',
}
export const BICONOMY_DAPP_API: AddressMap = {
  [SupportedChainId.POLYGON]: 'lD1x8FLPD.45318b65-8ab0-45c7-b59c-2f73137fb751',
  [SupportedChainId.ARBITRUM_ONE]: '5pAU9H4iJ.3c55c04e-127e-45c7-94e0-5cd90260ce11',
  [SupportedChainId.OPTIMISM]: 'zoXlK_GwU.e5be1e3a-521d-4298-a66c-4940b26f2355',
  [SupportedChainId.MAINNET]: 'XBXolmq9m.43a85921-4a01-480b-a352-d56afa8da640',
}

export const V3_MIGRATOR_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xA5644E29708357803b5A882D272c41cC0dF92B34', [
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
  ]),
  [SupportedChainId.BASE]: '0x23cF10b1ee3AdfCA73B0eF17C07F7577e7ACd2d7',
}
