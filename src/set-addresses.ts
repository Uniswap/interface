import CID from 'cids'
import {
  ChainId,
  Token,
  FACTORY_ADDRESS,
  ROUTER_ADDRESS,
  STAKING_REWARDS_FACTORY_ADDRESS,
  SWPR,
  RoutablePlatform,
  SWPR_CLAIMER_ADDRESS
} from '@swapr/sdk'
import { isAddress } from './utils'
import { CONVERTER_ADDRESS } from './constants'

const isValidAddressEnv = (value: string | undefined): boolean => {
  return !!value && !!isAddress(value)
}

new CID(process.env.REACT_APP_SWPR_AIRDROP_WHITELIST_IPFS_HASH as string) // fails if the cid is either non-present or malformed
if (
  !isValidAddressEnv(process.env.REACT_APP_FACTORY_ADDRESS_ARBITRUM_ONE) ||
  !isValidAddressEnv(process.env.REACT_APP_ROUTER_ADDRESS_ARBITRUM_ONE) ||
  !isValidAddressEnv(process.env.REACT_APP_STAKING_REWARDS_FACTORY_ADDRESS_ARBITRUM_ONE) ||
  !isValidAddressEnv(process.env.REACT_APP_SWPR_ADDRESS_ARBITRUM_ONE) ||
  !isValidAddressEnv(process.env.REACT_APP_SWPR_CLAIMER_ADDRESS_ARBITRUM_ONE) ||
  !isValidAddressEnv(process.env.REACT_APP_SWPR_CONVERTER_ADDRESS_ARBITRUM_ONE)
)
  throw new Error('missing env variables')

FACTORY_ADDRESS[ChainId.ARBITRUM_ONE] = process.env.REACT_APP_FACTORY_ADDRESS_ARBITRUM_ONE as string
RoutablePlatform.SWAPR.factoryAddress[ChainId.ARBITRUM_ONE] = process.env
  .REACT_APP_FACTORY_ADDRESS_ARBITRUM_ONE as string
console.log('Arbitrum One factory address set to', FACTORY_ADDRESS[ChainId.ARBITRUM_ONE])

ROUTER_ADDRESS[ChainId.ARBITRUM_ONE] = process.env.REACT_APP_ROUTER_ADDRESS_ARBITRUM_ONE as string
RoutablePlatform.SWAPR.routerAddress[ChainId.ARBITRUM_ONE] = process.env.REACT_APP_ROUTER_ADDRESS_ARBITRUM_ONE as string
console.log('Arbitrum One router address set to', ROUTER_ADDRESS[ChainId.ARBITRUM_ONE])

STAKING_REWARDS_FACTORY_ADDRESS[ChainId.ARBITRUM_ONE] = process.env
  .REACT_APP_STAKING_REWARDS_FACTORY_ADDRESS_ARBITRUM_ONE as string
console.log(
  'Arbitrum One staking reward campaigns factory address set to',
  STAKING_REWARDS_FACTORY_ADDRESS[ChainId.ARBITRUM_ONE]
)

SWPR[ChainId.ARBITRUM_ONE] = new Token(
  ChainId.ARBITRUM_ONE,
  process.env.REACT_APP_SWPR_ADDRESS_ARBITRUM_ONE as string,
  18,
  'SWPR',
  'Swapr'
)
console.log('Arbitrum One SWPR address set to', SWPR[ChainId.ARBITRUM_ONE].address)

SWPR_CLAIMER_ADDRESS[ChainId.ARBITRUM_ONE] = process.env.REACT_APP_SWPR_CLAIMER_ADDRESS_ARBITRUM_ONE as string
console.log('Arbitrum One SWPR claimer address set to', SWPR_CLAIMER_ADDRESS[ChainId.ARBITRUM_ONE])

CONVERTER_ADDRESS[ChainId.RINKEBY] = process.env.REACT_APP_SWPR_CONVERTER_ADDRESS_ARBITRUM_ONE as string // TODO: change to Arb1 before deploying
console.log('Arbitrum One SWPR converter address set to', CONVERTER_ADDRESS[ChainId.RINKEBY]) // TODO: change to Arb1 before deploying
