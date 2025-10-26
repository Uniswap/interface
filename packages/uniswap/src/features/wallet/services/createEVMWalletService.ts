import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { WalletService } from 'uniswap/src/features/wallet/services/IWalletService'
import { WalletMeta } from 'uniswap/src/features/wallet/types/WalletMeta'
import { HexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'

export function createEVMWalletService(ctx: {
  getWalletMeta: (address: HexString) => WalletMeta
  getAccountType: (address: HexString) => AccountType
}): WalletService {
  const service: WalletService = {
    getWallet(params) {
      const address = params.evmAddress

      try {
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
      } catch (error) {
        logger.error(error, {
          tags: { file: 'createEVMWalletService.ts', function: 'getWallet' },
        })
      }

      return {
        evmAccount: undefined,
      }
    },
  }

  return service
}
