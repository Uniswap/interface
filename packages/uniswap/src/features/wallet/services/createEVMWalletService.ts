import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { WalletService } from 'uniswap/src/features/wallet/services/IWalletService'
import { WalletMeta } from 'uniswap/src/features/wallet/types/WalletMeta'

export function createEVMWalletService(ctx: {
  getWalletMeta: (address: `0x${string}`) => WalletMeta
  getAccountType: (address: `0x${string}`) => AccountType
}): WalletService {
  const service: WalletService = {
    getWallet(params) {
      const address = params.evmAddress

      if (address) {
        return {
          evmAccount: {
            platform: Platform.EVM,
            accountType: ctx.getAccountType(address),
            address,
            walletMeta: ctx.getWalletMeta(address),
          },
        }
      }

      return {
        evmAccount: undefined,
      }
    },
  }

  return service
}
