import type { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { PlatformSpecificAddress } from 'uniswap/src/features/platforms/types/PlatformSpecificAddress'

/**
 * Represents a platform-specific address paired with metadata about its originating wallet.
 * This is the fundamental unit of account identity across packages.
 * Each account belongs to exactly one wallet and exists on exactly one platform.
 * For usage across web, mobile, and shared packages for type-safe account operations.
 */
export interface Account<P extends Platform> {
  platform: P
  address: PlatformSpecificAddress<P>
  /** The wallet this account is sourced from. */
  walletId: string
}
