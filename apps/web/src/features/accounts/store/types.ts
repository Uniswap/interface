import type { WalletName as SolanaWalletName } from '@solana/wallet-adapter-base'
import type { AccountsData } from 'uniswap/src/features/accounts/store/types/AccountsState'
import type { Connector } from 'uniswap/src/features/accounts/store/types/Connector'
import type { Session, SingleChainScope } from 'uniswap/src/features/accounts/store/types/Session'
import type { SigningCapability, Wallet } from 'uniswap/src/features/accounts/store/types/Wallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

export interface ExternalWallet extends Wallet<SigningCapability.Interactive> {
  name: string
  connectorIds: {
    [Platform.EVM]?: string
    [Platform.SVM]?: string
  }
  analyticsWalletType: string
}

type LibraryIdFormatByPlatform = {
  [Platform.EVM]: string
  [Platform.SVM]: SolanaWalletName
}

type BaseExternalConnector<P extends Platform> = Connector<P, ExternalSession<P>> & {
  platform: P
  /** The id associated with the original source this connector was built from. Used for direct usage with original library utilities */
  externalLibraryId: LibraryIdFormatByPlatform[P]
}

export type ExternalConnector<P extends Platform = Platform> = Extract<
  BaseExternalConnector<Platform.EVM> | BaseExternalConnector<Platform.SVM>,
  { platform: P }
>
export interface ExternalSession<P extends Platform> extends Session<P> {
  chainScope: SingleChainScope<P>
}

export interface WebAccountsData extends AccountsData {
  connectors: { [id in string]: ExternalConnector }
  activeConnectors: { [P in Platform]?: ExternalConnector<P> }
  wallets: { [id: string]: ExternalWallet }
  connectionQueryIsPending: boolean
}
