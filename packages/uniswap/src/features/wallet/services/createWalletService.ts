import type { WalletService } from 'uniswap/src/features/wallet/services/IWalletService'

export function createWalletService(ctx: {
  evmWalletService?: WalletService
  svmWalletService?: WalletService
}): WalletService {
  const service: WalletService = {
    getWallet(params) {
      const { evmAddress, svmAddress } = params

      const evmWallet = ctx.evmWalletService?.getWallet({ evmAddress })
      const svmWallet = ctx.svmWalletService?.getWallet({ svmAddress })

      return { ...evmWallet, ...svmWallet }
    },
  }

  return service
}
