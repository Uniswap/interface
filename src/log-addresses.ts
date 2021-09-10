// simply logs addresses to check if everything looks fine

import {
  ChainId,
  FACTORY_ADDRESS,
  RoutablePlatform,
  ROUTER_ADDRESS,
  STAKING_REWARDS_FACTORY_ADDRESS,
  SWPR,
  SWPR_CLAIMER_ADDRESS,
  SWPR_CONVERTER_ADDRESS
} from '@swapr/sdk'

console.log('Arbitrum One factory address set to', FACTORY_ADDRESS[ChainId.ARBITRUM_ONE])
console.log(
  'Arbitrum One factory address in Swapr routable platform set to',
  RoutablePlatform.SWAPR.factoryAddress[ChainId.ARBITRUM_ONE]
)
console.log('Arbitrum One router address set to', ROUTER_ADDRESS[ChainId.ARBITRUM_ONE])
console.log(
  'Arbitrum One router address in Swapr routable platform set to',
  RoutablePlatform.SWAPR.routerAddress[ChainId.ARBITRUM_ONE]
)
console.log(
  'Arbitrum One staking reward campaigns factory address set to',
  STAKING_REWARDS_FACTORY_ADDRESS[ChainId.ARBITRUM_ONE]
)
console.log('Arbitrum One SWPR address set to', SWPR[ChainId.ARBITRUM_ONE].address)
console.log('Mainnet SWPR address set to', SWPR[ChainId.MAINNET].address)
console.log('Arbitrum One SWPR claimer address set to', SWPR_CLAIMER_ADDRESS[ChainId.ARBITRUM_ONE])
console.log('Arbitrum One SWPR converter address set to', SWPR_CONVERTER_ADDRESS[ChainId.ARBITRUM_ONE])
