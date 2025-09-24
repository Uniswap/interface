import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useActiveAddresses, useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'

export function useIsMissingPlatformWallet(): {
  isMissingPlatformWallet: boolean
  expectedPlatform: Platform | undefined
} {
  const { swapInputChainId, swapOutputChainId } = useUniswapContext()
  const chainId = swapInputChainId ?? swapOutputChainId
  const expectedPlatform = chainId ? chainIdToPlatform(chainId) : undefined

  const { isConnected } = useConnectionStatus()
  const activeAddresses = useActiveAddresses()
  const activeAddress = expectedPlatform
    ? expectedPlatform === Platform.EVM
      ? activeAddresses.evmAddress
      : activeAddresses.svmAddress
    : undefined

  return {
    isMissingPlatformWallet: Boolean(chainId && isConnected && activeAddress === undefined),
    expectedPlatform,
  }
}
