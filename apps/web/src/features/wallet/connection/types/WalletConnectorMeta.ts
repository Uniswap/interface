import type { WalletName as SolanaWalletName } from "@solana/wallet-adapter-base"
import type { CustomConnectorId } from "features/wallet/connection/connectors/custom"
import type { Prettify } from "viem"

type AtLeastOne<
  T,
  K extends keyof T = keyof T
> = K extends keyof T
  ? { [P in K]-?: NonNullable<T[P]> } & Partial<Omit<T, K>>
  : never

export type WalletConnectorMeta = {
  name: string
  icon?: string
} & AtLeastOne<{
   /** The wagmi connector is of this connector, if this connector is linked to a wagmi connector. */
   wagmiConnectorId?: string
   /** The "@solana/wallet-adapter-base" `WalletName` of this connector, if this connector is linked to a solana wallet. */
   solanaWalletName?: SolanaWalletName
   /** The id of this connector, if this connector has custom logic (e.g. embedded wallet connector or uniswap wallet connect connector). */
   customConnectorId?: CustomConnectorId
}>

export type SolanaWalletConnectorMeta = Prettify<Extract<WalletConnectorMeta, { solanaWalletName: SolanaWalletName }>>
export type WagmiWalletConnectorMeta = Prettify<Extract<WalletConnectorMeta, { wagmiConnectorId: string }>>
export type CustomWalletConnectorMeta = Prettify<Extract<WalletConnectorMeta, { customConnectorId: CustomConnectorId }>>
