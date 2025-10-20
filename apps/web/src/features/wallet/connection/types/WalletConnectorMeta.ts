import type { WalletName as SolanaWalletName } from '@solana/wallet-adapter-base'
import type { CustomConnectorId } from 'features/wallet/connection/types/CustomConnectorId'

type AtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? { [P in K]-?: NonNullable<T[P]> } & Partial<Omit<T, K>>
  : never

export type WalletConnectorMeta = {
  name: string
  icon?: string
  isInjected: boolean
  analyticsWalletType: string
} & AtLeastOne<{
  wagmi?: WagmiConnectorDetails
  solana?: SolanaConnectorDetails
  /** The id of this connector, if this connector has custom logic (e.g. embedded wallet connector or uniswap wallet connect connector). */
  customConnectorId?: CustomConnectorId
}>

type WagmiConnectorDetails = {
  /** The wagmi connector is of this connector, if this connector is linked to a wagmi connector. */
  id: string
  type: string // temporarily kept for backwards analytics compatibility
}

type SolanaConnectorDetails = {
  /** The "@solana/wallet-adapter-base" `WalletName` of this connector, if this connector is linked to a solana wallet. */
  walletName: SolanaWalletName
}
