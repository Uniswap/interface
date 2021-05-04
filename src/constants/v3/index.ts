import { ChainId } from '@uniswap/sdk-core'
import { FACTORY_ADDRESS } from '@uniswap/v3-sdk'

function constructSameAddressMap(address: string): { [chainId in ChainId]: string } {
  return {
    [ChainId.MAINNET]: address,
    [ChainId.ROPSTEN]: address,
    [ChainId.KOVAN]: address,
    [ChainId.RINKEBY]: address,
    [ChainId.GÖRLI]: address,
  }
}

export const V3_CORE_FACTORY_ADDRESSES = constructSameAddressMap(FACTORY_ADDRESS)

export const QUOTER_ADDRESSES = constructSameAddressMap('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6')

export const TICK_LENS_ADDRESSES = constructSameAddressMap('0xbfd8137f7d1516D3ea5cA83523914859ec47F573')

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = constructSameAddressMap(
  '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
)

export const SWAP_ROUTER_ADDRESSES = constructSameAddressMap('0xE592427A0AEce92De3Edee1F18E0157C05861564')

export const V3_MIGRATOR_ADDRESSES = constructSameAddressMap('0xA5644E29708357803b5A882D272c41cC0dF92B34')
