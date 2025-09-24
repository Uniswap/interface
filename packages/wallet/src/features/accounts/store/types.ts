import { Account } from 'uniswap/src/features/accounts/store/types/Account'
import type { AccountsData } from 'uniswap/src/features/accounts/store/types/AccountsState'
import type { Connector, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { MultiChainScope, Session } from 'uniswap/src/features/accounts/store/types/Session'
import type { SigningCapability, Wallet } from 'uniswap/src/features/accounts/store/types/Wallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { PlatformSpecificAddress } from 'uniswap/src/features/platforms/types/PlatformSpecificAddress'

export type DerivedAddresses = {
  derivationIndex: number
  [Platform.EVM]: PlatformSpecificAddress<Platform.EVM>
  // Currently EVM-only as wallet package only supports EVM wallets.
  [Platform.SVM]?: undefined
}

/** Represents a single-address import. As cross platform addresses cannot be known without accessing the seedphrase, readonly wallets can only store one address/account. */
type SingleImportedAddress = { [Platform.EVM]: PlatformSpecificAddress<Platform.EVM>; [Platform.SVM]?: undefined } // | { [Platform.EVM]: undefined, [Platform.SVM]: PlatformSpecificAddress<Platform.SVM> }

export interface MnemonicWallet extends Wallet<SigningCapability.Immediate> {
  addresses: Record<number, DerivedAddresses>
}

export interface ReadonlyWallet extends Wallet<SigningCapability.None> {
  // Readonly imports only have one address.
  addresses: [SingleImportedAddress]
}

export interface LocalSession extends Session<Platform.EVM> {
  chainScope: MultiChainScope<Platform.EVM>
}

export type LocalConnector = Connector<Platform.EVM> & {
  status: ConnectorStatus.Connected | ConnectorStatus.Disconnected
  session?: LocalSession
}

export interface WalletAppsAccountsData extends AccountsData {
  localConnector: LocalConnector
  wallets: { [id: string]: MnemonicWallet | ReadonlyWallet }
  accounts: { [address: string]: Account<Platform.EVM> }
}
