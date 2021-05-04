import { ChainId } from '@uniswap/sdk-core'
import goerli from './goerli.json'
import ropsten from './ropsten.json'
import rinkeby from './rinkeby.json'
import kovan from './kovan.json'
import mainnet from './mainnet.json'

function constructAddressMap(
  key: keyof typeof goerli | keyof typeof ropsten | keyof typeof rinkeby | keyof typeof mainnet
): { [chainId in ChainId]: string } {
  return {
    [ChainId.MAINNET]: mainnet[key],
    [ChainId.ROPSTEN]: ropsten[key],
    [ChainId.KOVAN]: kovan[key],
    [ChainId.RINKEBY]: rinkeby[key],
    [ChainId.GÖRLI]: goerli[key],
  }
}

export const V3_CORE_FACTORY_ADDRESSES = constructAddressMap('v3CoreFactoryAddress')

export const QUOTER_ADDRESSES = constructAddressMap('quoterAddress')

export const TICK_LENS_ADDRESSES = constructAddressMap('tickLensAddress')

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = constructAddressMap('nonfungibleTokenPositionManagerAddress')

export const SWAP_ROUTER_ADDRESSES = constructAddressMap('swapRouter')

export const V3_MIGRATOR_ADDRESSES = constructAddressMap('v3MigratorAddress')
