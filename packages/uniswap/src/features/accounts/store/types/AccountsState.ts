import type { Account } from 'uniswap/src/features/accounts/store/types/Account'
import { ConnectionStatusInfo, Connector } from 'uniswap/src/features/accounts/store/types/Connector'
import type { Wallet } from 'uniswap/src/features/accounts/store/types/Wallet'
import { FlexiblePlatformInput } from 'uniswap/src/features/accounts/store/utils/flexibleInput'
import type { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { PlatformSpecificAddress } from 'uniswap/src/features/platforms/types/PlatformSpecificAddress'
import type { StoreApi, UseBoundStore } from 'zustand'

/**
 * Zustand store type for accounts management with generic data and getter types.
 * Provides type-safe access to accounts state across different package implementations.
 */
export type AccountsStore<
  TData extends AccountsData = AccountsData,
  TGetters extends AccountsGetters = AccountsGetters,
> = UseBoundStore<StoreApi<AccountsState<TData, TGetters>>>

/**
 * Core data structure containing all accounts, wallets, and connectors.
 * Represents the raw state that gets transformed by getter functions.
 */
export interface AccountsData {
  connectors: { [id: string]: AnyConnector }
  accounts: { [address: string]: Account<Platform> }
  wallets: { [id: string]: Wallet }
}

/** Union type representing any connector across all platforms. Handles all current possible platform combinations. */
type AnyConnector = { [P in Platform]: Connector<P> }[Platform] | Connector

/**
 * Interface defining all getter functions available on the accounts store.
 * These functions provide computed values and platform-specific access to the underlying data.
 */
export interface AccountsGetters {
  /** Returns the address of the currently active account for the specified platform. */
  getActiveAddress: <P extends Platform>(platform: FlexiblePlatformInput<P>) => PlatformSpecificAddress<P> | undefined

  /** Returns all addresses for the currently active account across all platforms. */
  getActiveAddresses: () => { [P in Platform as `${P}Address`]?: PlatformSpecificAddress<P> }

  /** Returns the currently active account for the specified platform. */
  getActiveAccount: <P extends Platform>(platform: FlexiblePlatformInput<P>) => Account<P> | undefined

  /** Returns the currently active connector for the specified platform. */
  getActiveConnector: (platform: FlexiblePlatformInput) => AnyConnector | undefined

  /** Returns the currently active wallet for the specified platform. */
  getActiveWallet: (platform: FlexiblePlatformInput) => Wallet | undefined

  /** Returns the connection status for the specified platform, or defaults to 'aggregate' or for overall status. */
  getConnectionStatus: (platform?: FlexiblePlatformInput | 'aggregate') => ConnectionStatusInfo
}

/**
 * Complete accounts state combining data and getter functions.
 * This is the final type that gets exposed through the Zustand store.
 */
export type AccountsState<
  TData extends AccountsData = AccountsData,
  TGetters extends AccountsGetters = AccountsGetters,
> = TData & TGetters
