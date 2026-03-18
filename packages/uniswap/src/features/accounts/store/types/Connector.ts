import type { Session } from 'uniswap/src/features/accounts/store/types/Session'
import type { Platform } from 'uniswap/src/features/platforms/types/Platform'

/**
 * Represents the connection state of a wallet connector.
 * Tracks the lifecycle from connection attempts through active sessions to disconnection.
 */
export enum ConnectorStatus {
  Connected = 'Connected',
  Connecting = 'Connecting',
  Disconnected = 'Disconnected',
}

/** Utility return type for connection status information. */
export type ConnectionStatusInfo =
  | { status: ConnectorStatus.Connected; isConnected: true; isConnecting: false; isDisconnected: false }
  | { status: ConnectorStatus.Connecting; isConnected: false; isConnecting: true; isDisconnected: false }
  | { status: ConnectorStatus.Disconnected; isConnected: false; isConnecting: false; isDisconnected: true }

export enum ConnectorErrorType {
  OnboardingNotFinished = 'OnboardingNotFinished',
  UnexpectedEmptyAccountState = 'UnexpectedEmptyAccountState',
  UnknownError = 'UnknownError',
}

/**
 * Defines how a wallet is accessed, informing connection management and UI presentation.
 * Independent from `Wallet.SigningCapability` - AccessPattern represents source of access rather than type of wallet/signer.
 * Designed for extensibility as additional connection mechanisms are added.
 */
export enum AccessPattern {
  /** Direct native device access to the wallet/signing material, e.g. in a Wallet application.*/
  Native = 'Native',
  /** Indirect, injected access to the wallet/signing material, e.g. an extension wallet connected to a Dapp. */
  Injected = 'Injected',
  /** Indirect access to the wallet/signing material through a proprietary SDK like WalletConnect or Coinbase. */
  SDK = 'SDK',
  // Embedded = 'Embedded', -- Currently embedded is treated as SDK
}

/**
 * Base connector interface providing the capability and configuration for establishing wallet communication.
 * Separates connection capability from active session state, enabling independent tracking of
 * connection attempts, error states, and different access patterns.
 */
interface BaseConnector<TAccessPattern extends AccessPattern = AccessPattern> {
  id: string
  access: TAccessPattern
  status: ConnectorStatus
}

export interface ConnectedConnector<
  SupportedPlatforms extends Platform = Platform,
  TSessionType extends Session<SupportedPlatforms> = Session<SupportedPlatforms>,
  TAccessPattern extends AccessPattern = AccessPattern,
> extends BaseConnector<TAccessPattern> {
  status: ConnectorStatus.Connected
  session: TSessionType
}

export interface ConnectingConnector<
  SupportedPlatforms extends Platform = Platform,
  TSessionType extends Session<SupportedPlatforms> = Session<SupportedPlatforms>,
  TAccessPattern extends AccessPattern = AccessPattern,
> extends BaseConnector<TAccessPattern> {
  status: ConnectorStatus.Connecting
  session?: TSessionType
}

export interface DisconnectedConnector<TAccessPattern extends AccessPattern = AccessPattern>
  extends BaseConnector<TAccessPattern> {
  status: ConnectorStatus.Disconnected
  session?: undefined
  error?: ConnectorErrorType
}

/**
 * Union type representing a wallet connector in any connection state.
 * Provides type-safe access to session data only when connected, ensuring
 * proper handling of connection lifecycle across all package contexts.
 */
export type Connector<
  SupportedPlatforms extends Platform = Platform,
  TSessionType extends Session<SupportedPlatforms> = Session<SupportedPlatforms>,
> =
  | ConnectedConnector<SupportedPlatforms, TSessionType>
  | ConnectingConnector<SupportedPlatforms, TSessionType>
  | DisconnectedConnector

/** Utility type for extracting a Session with a specific Connector status. */
export type ConnectorWithStatus<
  TStatus extends ConnectorStatus,
  SupportedPlatforms extends Platform = Platform,
> = Extract<Connector<SupportedPlatforms>, { status: TStatus }>
