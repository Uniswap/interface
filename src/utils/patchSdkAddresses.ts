/**
 * Patches @uniswap/sdk-core address constants to include Taiko Hoodi support
 *
 * The SDK doesn't natively support Taiko, so we need to patch the address constants
 * at runtime to make them work with our custom chain.
 */
import {
  MULTICALL_ADDRESSES,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  TICK_LENS_ADDRESSES,
  V3_CORE_FACTORY_ADDRESSES,
  V3_MIGRATOR_ADDRESSES,
} from '@uniswap/sdk-core'

import {
  TAIKO_HOODI_CHAIN_ID,
  TAIKO_HOODI_MULTICALL_ADDRESSES,
  TAIKO_HOODI_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  TAIKO_HOODI_TICK_LENS_ADDRESSES,
  TAIKO_HOODI_V3_CORE_FACTORY_ADDRESSES,
  TAIKO_HOODI_V3_MIGRATOR_ADDRESSES,
} from '../constants/taiko'

/**
 * Call this function early in the app initialization to patch SDK constants
 */
export function patchSdkAddressesForTaiko() {
  // Patch V3 Core Factory
  Object.assign(V3_CORE_FACTORY_ADDRESSES, TAIKO_HOODI_V3_CORE_FACTORY_ADDRESSES)

  // Patch Multicall
  Object.assign(MULTICALL_ADDRESSES, TAIKO_HOODI_MULTICALL_ADDRESSES)

  // Patch NFT Position Manager
  Object.assign(NONFUNGIBLE_POSITION_MANAGER_ADDRESSES, TAIKO_HOODI_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES)

  // Patch Tick Lens
  Object.assign(TICK_LENS_ADDRESSES, TAIKO_HOODI_TICK_LENS_ADDRESSES)

  // Patch V3 Migrator
  Object.assign(V3_MIGRATOR_ADDRESSES, TAIKO_HOODI_V3_MIGRATOR_ADDRESSES)

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ SDK addresses patched for Taiko Hoodi')
    console.log(`   Chain ID: ${TAIKO_HOODI_CHAIN_ID}`)
    console.log(`   Factory: ${TAIKO_HOODI_V3_CORE_FACTORY_ADDRESSES[TAIKO_HOODI_CHAIN_ID]}`)
  }
}
