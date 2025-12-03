import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { EVMAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { WalletMeta } from 'uniswap/src/features/wallet/types/WalletMeta'
import { HexString } from 'utilities/src/addresses/hex'

export const createMockEVMAccountDetails = (overrides: Partial<EVMAccountDetails> = {}): EVMAccountDetails => {
  return {
    platform: Platform.EVM,
    accountType: AccountType.SignerMnemonic,
    walletMeta: {
      id: '1234567890123456789012345678901234567890',
      name: 'Mock EVM Wallet',
      icon: 'https://mock.com/icon.png',
    },
    address: '0x1234567890123456789012345678901234567890',
    ...overrides,
  }
}
