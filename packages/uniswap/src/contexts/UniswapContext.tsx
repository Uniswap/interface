import { JsonRpcProvider } from '@ethersproject/providers'
import { Signer } from 'ethers/lib/ethers'
import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { useEvent } from 'utilities/src/react/hooks'
import { Connector } from 'wagmi'

/** Stores objects/utils that exist on all platforms, abstracting away app-level specifics for each, in order to allow usage in cross-platform code. */
interface UniswapContextValue {
  account?: AccountMeta
  connector?: Connector
  navigateToBuyOrReceiveWithEmptyWallet?: () => void
  navigateToFiatOnRamp: (args: { prefilledCurrency?: FiatOnRampCurrency }) => void
  navigateToSwapFlow: (args: { inputCurrencyId?: string; outputCurrencyId?: string }) => void
  navigateToSendFlow: (args: { chainId: UniverseChainId; currencyAddress?: Address }) => void
  navigateToReceive: () => void
  navigateToTokenDetails: (currencyId: string) => void
  navigateToExternalProfile: (args: { address: Address }) => void
  navigateToNftCollection: (args: { collectionAddress: Address; chainId: UniverseChainId }) => void
  handleShareToken: (args: { currencyId: string }) => void
  onSwapChainsChanged: (args: {
    chainId: UniverseChainId
    prevChainId?: UniverseChainId
    outputChainId?: UniverseChainId
  }) => void
  swapInputChainId?: UniverseChainId
  setSwapOutputChainId: (chainId: UniverseChainId) => void
  swapOutputChainId?: UniverseChainId
  signer: Signer | undefined
  useProviderHook: (chainId: number) => JsonRpcProvider | undefined
  // Used for triggering wallet connection on web
  onConnectWallet?: () => void
  // Used for web to open the token selector from a banner not in the swap flow
  isSwapTokenSelectorOpen: boolean
  setIsSwapTokenSelectorOpen: (open: boolean) => void
  getCanSignPermits?: (chainId: UniverseChainId | undefined) => boolean
  // some wallets don't support UniswapX, so we need to check if it's supported (mismatch account)
  getIsUniswapXSupported?: (chainId: UniverseChainId | undefined) => boolean
  handleOnPressUniswapXUnsupported?: () => void
  getCanBatchTransactions?: (chainId: UniverseChainId | undefined) => boolean
  getSwapDelegationAddress?: (chainId: UniverseChainId | undefined) => string | undefined
}

export const UniswapContext = createContext<UniswapContextValue | null>(null)

export function UniswapProvider({
  children,
  account,
  connector,
  navigateToBuyOrReceiveWithEmptyWallet,
  navigateToFiatOnRamp,
  navigateToSwapFlow,
  navigateToSendFlow,
  navigateToReceive,
  navigateToTokenDetails,
  navigateToExternalProfile,
  navigateToNftCollection,
  handleShareToken,
  onSwapChainsChanged,
  signer,
  useProviderHook,
  onConnectWallet,
  getCanSignPermits,
  getIsUniswapXSupported,
  handleOnPressUniswapXUnsupported,
  getCanBatchTransactions,
  getSwapDelegationAddress,
}: PropsWithChildren<
  Omit<UniswapContextValue, 'isSwapTokenSelectorOpen' | 'setIsSwapTokenSelectorOpen' | 'setSwapOutputChainId'>
>): JSX.Element {
  const [swapInputChainId, setSwapInputChainId] = useState<UniverseChainId>()
  const [swapOutputChainId, setSwapOutputChainId] = useState<UniverseChainId>()
  const [isSwapTokenSelectorOpen, setIsSwapTokenSelectorOpen] = useState<boolean>(false)

  const value: UniswapContextValue = useMemo(
    () => ({
      account,
      connector,
      navigateToBuyOrReceiveWithEmptyWallet,
      navigateToFiatOnRamp,
      navigateToSwapFlow,
      navigateToSendFlow,
      navigateToReceive,
      navigateToTokenDetails,
      navigateToExternalProfile,
      navigateToNftCollection,
      handleShareToken,
      onSwapChainsChanged: ({
        chainId,
        prevChainId,
        outputChainId,
      }: {
        chainId: UniverseChainId
        prevChainId?: UniverseChainId
        outputChainId?: UniverseChainId
      }): void => {
        onSwapChainsChanged({ chainId, prevChainId, outputChainId })
        setSwapInputChainId(chainId)
        setSwapOutputChainId(outputChainId)
      },
      signer,
      useProviderHook,
      onConnectWallet,
      swapInputChainId,
      swapOutputChainId,
      setSwapOutputChainId,
      isSwapTokenSelectorOpen,
      setIsSwapTokenSelectorOpen: (open: boolean) => setIsSwapTokenSelectorOpen(open),
      getCanSignPermits,
      getIsUniswapXSupported,
      handleOnPressUniswapXUnsupported,
      getCanBatchTransactions,
      getSwapDelegationAddress,
    }),
    [
      account,
      connector,
      navigateToBuyOrReceiveWithEmptyWallet,
      navigateToFiatOnRamp,
      navigateToSwapFlow,
      navigateToSendFlow,
      navigateToReceive,
      navigateToTokenDetails,
      navigateToExternalProfile,
      navigateToNftCollection,
      handleShareToken,
      signer,
      useProviderHook,
      onConnectWallet,
      swapInputChainId,
      swapOutputChainId,
      isSwapTokenSelectorOpen,
      setIsSwapTokenSelectorOpen,
      getCanSignPermits,
      onSwapChainsChanged,
      getIsUniswapXSupported,
      handleOnPressUniswapXUnsupported,
      getCanBatchTransactions,
      getSwapDelegationAddress,
    ],
  )

  return <UniswapContext.Provider value={value}>{children}</UniswapContext.Provider>
}

/** Cross-platform util for getting items/utils that exist on all apps. */
export function useUniswapContext(): UniswapContextValue {
  const context = useContext(UniswapContext)
  if (!context) {
    throw new Error('useUniswapContext must be used within a UniswapProvider')
  }

  return context
}

export function useUniswapContextSelector<T>(selector: (ctx: UniswapContextValue) => T): T | undefined {
  const stableSelector = useEvent(selector)
  const context = useContext(UniswapContext)
  return context ? stableSelector(context) : undefined
}

/** Cross-platform util for getting metadata for the active account/wallet, regardless of platform/environment. */
export function useAccountMeta(): AccountMeta | undefined {
  return useUniswapContext().account
}

/** Cross-platform util for getting connector for the active account/wallet, only applicable to web, other platforms are undefined. */
export function useConnector(): Connector | undefined {
  return useUniswapContext().connector
}

/** Cross-platform util for getting an RPC provider for the given `chainId`, regardless of platform/environment. */
export function useProvider(chainId: number): JsonRpcProvider | undefined {
  return useUniswapContext().useProviderHook(chainId)
}

/** Cross-platform util for getting a signer for the active account/wallet, regardless of platform/environment. */
export function useSigner(): Signer | undefined {
  return useUniswapContext().signer
}
