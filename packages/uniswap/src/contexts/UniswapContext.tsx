import { JsonRpcProvider } from '@ethersproject/providers'
import { Signer } from 'ethers/lib/ethers'
import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'

/** Stores objects/utils that exist on all platforms, abstracting away app-level specifics for each, in order to allow usage in cross-platform code. */
interface UniswapContext {
  account?: AccountMeta
  navigateToBuyOrReceiveWithEmptyWallet?: () => void
  navigateToFiatOnRamp: (args: { prefilledCurrency?: FiatOnRampCurrency }) => void
  onShowSwapNetworkNotification: (chainId?: number, prevChainId?: number) => void
  signer: Signer | undefined
  useProviderHook: (chainId: number) => JsonRpcProvider | undefined
  // Used for triggering wallet connection on web
  onConnectWallet?: () => void
}

export const UniswapContext = createContext<UniswapContext | null>(null)

export function UniswapProvider({
  children,
  account,
  navigateToBuyOrReceiveWithEmptyWallet,
  navigateToFiatOnRamp,
  onShowSwapNetworkNotification,
  signer,
  useProviderHook,
  onConnectWallet,
}: PropsWithChildren<UniswapContext>): JSX.Element {
  const value: UniswapContext = useMemo(
    () => ({
      account,
      navigateToBuyOrReceiveWithEmptyWallet,
      onShowSwapNetworkNotification,
      signer,
      useProviderHook,
      navigateToFiatOnRamp,
      onConnectWallet,
    }),
    [
      account,
      navigateToBuyOrReceiveWithEmptyWallet,
      navigateToFiatOnRamp,
      onShowSwapNetworkNotification,
      signer,
      useProviderHook,
      onConnectWallet,
    ],
  )

  return <UniswapContext.Provider value={value}>{children}</UniswapContext.Provider>
}

/** Cross-platform util for getting items/utils that exist on all apps. */
export function useUniswapContext(): UniswapContext {
  const context = useContext(UniswapContext)
  if (!context) {
    throw new Error('useUniswapContext must be used within a UniswapProvider')
  }

  return context
}

/** Cross-platform util for getting metadata for the active account/wallet, regardless of platform/environment. */
export function useAccountMeta(): AccountMeta | undefined {
  return useUniswapContext().account
}

/** Cross-platform util for getting an RPC provider for the given `chainId`, regardless of platform/environment. */
export function useProvider(chainId: number): JsonRpcProvider | undefined {
  return useUniswapContext().useProviderHook(chainId)
}

/** Cross-platform util for getting a signer for the active account/wallet, regardless of platform/environment. */
export function useSigner(): Signer | undefined {
  return useUniswapContext().signer
}
