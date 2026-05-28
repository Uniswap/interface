import type { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { PlatformSpecificAddress } from 'uniswap/src/features/platforms/types/PlatformSpecificAddress'

/**
 * Defines how a wallet signs transactions, informing UX and business logic around signing.
 * Independent of `Connector.AccessPattern` - determines whether user approval is required and
 * enables shared transaction logic to handle different signing flows appropriately.
 */
export enum SigningCapability {
  /** The wallet does not support signing, e.g. readonly imported wallets. */
  None = 'None',
  /** The wallet supports interactive signing, e.g. requires user interaction to sign a transaction. */
  Interactive = 'Interactive',
  /** The wallet supports immediate signing, e.g. native device access to the private key / signing material. */
  Immediate = 'Immediate',
}

/**
 * Represents a group of addresses across different platforms for a single account derivation.
 * Each AddressGroup contains at most one address per platform (EVM, SVM, etc.).
 */
export type CrossChainAddresses = { [P in Platform]?: PlatformSpecificAddress<P> }

/**
 * Represents an entity capable of exposing accounts and executing signing operations.
 * Contains cross-platform address groups and signing capabilities, serving as the
 * source of truth for account relationships across our unified architecture.
 * Used consistently across web, mobile, and shared packages for wallet operations.
 */
export interface Wallet<TSigningCapability extends SigningCapability = SigningCapability> {
  id: string
  signingCapability: TSigningCapability
  addresses: Record<number, CrossChainAddresses>
  name?: string
  icon?: string
}
