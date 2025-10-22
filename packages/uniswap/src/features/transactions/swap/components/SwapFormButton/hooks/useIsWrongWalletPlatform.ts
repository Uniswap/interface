import { useActiveAccount, useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export function useIsWrongWalletPlatform(): { isWrongWalletPlatform: boolean; expectedPlatform: Platform | undefined } {
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const activeAccount = useActiveAccount(chainId)
  const { isConnected } = useConnectionStatus()

  return {
    isWrongWalletPlatform: Boolean(isConnected && activeAccount === undefined),
    expectedPlatform: chainIdToPlatform(chainId),
  }
}
