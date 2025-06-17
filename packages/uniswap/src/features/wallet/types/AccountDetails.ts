import { AccountType } from "uniswap/src/features/accounts/types";
import { Platform } from "uniswap/src/features/platforms/types/Platform";
import { WalletMeta } from "uniswap/src/features/wallet/types/WalletMeta";

export type BaseAccountDetails<TPlatform extends Platform, TAddressType extends string = string> = {
  platform: TPlatform
  accountType: AccountType
  address: TAddressType
  walletMeta: WalletMeta
  // displayName: string
}

export type EVMAccountDetails = BaseAccountDetails<Platform.EVM, `0x${string}`>

export type AccountDetails = EVMAccountDetails // | BaseAccountDetails<Platform.other, string>
