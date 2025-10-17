/**
 * Patches @uniswap/sdk-core address constants to include Taiko support
 *
 * The SDK doesn't natively support Taiko, so we need to patch the address constants
 * at runtime to make them work with our custom chains.
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
  TAIKO_MAINNET_CHAIN_ID,
  TAIKO_MULTICALL_ADDRESSES,
  TAIKO_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  TAIKO_TICK_LENS_ADDRESSES,
  TAIKO_V3_CORE_FACTORY_ADDRESSES,
  TAIKO_V3_MIGRATOR_ADDRESSES,
} from '../constants/taiko'

/**
 * Call this function early in the app initialization to patch SDK constants
 */
export function patchSdkAddressesForTaiko() {
  // Patch addresses for both Taiko Mainnet and Hoodi testnet

  // Patch V3 Core Factory
  Object.assign(V3_CORE_FACTORY_ADDRESSES, TAIKO_V3_CORE_FACTORY_ADDRESSES)

  // Patch Multicall
  Object.assign(MULTICALL_ADDRESSES, TAIKO_MULTICALL_ADDRESSES)

  // Patch NFT Position Manager
  Object.assign(NONFUNGIBLE_POSITION_MANAGER_ADDRESSES, TAIKO_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES)

  // Patch Tick Lens
  Object.assign(TICK_LENS_ADDRESSES, TAIKO_TICK_LENS_ADDRESSES)

  // Patch V3 Migrator
  Object.assign(V3_MIGRATOR_ADDRESSES, TAIKO_V3_MIGRATOR_ADDRESSES)

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ SDK addresses patched for Taiko networks')
    console.log(`   Mainnet Chain ID: ${TAIKO_MAINNET_CHAIN_ID}`)
    console.log(`   Mainnet Factory: ${TAIKO_V3_CORE_FACTORY_ADDRESSES[TAIKO_MAINNET_CHAIN_ID]}`)
    console.log(`   Hoodi Chain ID: ${TAIKO_HOODI_CHAIN_ID}`)
    console.log(`   Hoodi Factory: ${TAIKO_V3_CORE_FACTORY_ADDRESSES[TAIKO_HOODI_CHAIN_ID]}`)
  }
}
