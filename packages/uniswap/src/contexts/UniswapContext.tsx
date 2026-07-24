import { JsonRpcProvider } from '@ethersproject/providers'
import { Signer } from 'ethers/lib/ethers'
import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react'
import { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { DisplayName } from 'uniswap/src/features/accounts/types'
import { WalletDisplayNameOptions } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { SignDelegationAuthorizationFn, SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import type { TdpChainSelection } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'

export type NavigateToNftItemArgs = {
  owner?: Address
  contractAddress: Address
  tokenId: string
  chainId: UniverseChainId
}

export type NavigateToSwapFlowArgs = {
  inputCurrencyId?: string
  outputCurrencyId?: string
  exactCurrencyField?: CurrencyField
  exactAmountToken?: string
}

export type NavigateToEarnVaultArgs = {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  vault: EarnVaultInfo
  position?: EarnPositionInfo
}

/** Stores objects/utils that exist on all platforms, abstracting away app-level specifics for each, in order to allow usage in cross-platform code. */
interface UniswapContextValue {
  navigateToBuyOrReceiveWithEmptyWallet?: () => void
  navigateToFiatOnRamp: (args: { prefilledCurrency?: FiatOnRampCurrency }) => void
  navigateToSwapFlow: (args: NavigateToSwapFlowArgs) => void
  navigateToSendFlow: (args: { chainId: UniverseChainId; currencyAddress?: Address; recipient?: Address }) => void
  navigateToReceive: () => void
  navigateToTokenDetails: (currencyId: string, chainSelection?: TdpChainSelection) => void
  navigateToExternalProfile: (args: { address: Address }) => void
  navigateToNftDetails: (args: NavigateToNftItemArgs) => void
  navigateToPoolDetails: (args: { poolId: Address; chainId: UniverseChainId }) => void
  // Opens the earn vault destination for a vault share token (underlying TDP + earn modal on web, earn vault
  // modal on mobile/extension). Optional: not all platforms/environments wire earn navigation.
  navigateToEarnVault?: (args: NavigateToEarnVaultArgs) => void
  navigateToAuction?: (args: { auctionAddress: string; chainId: UniverseChainId }) => void
  handleShareToken: (args: { currencyId: string }) => void
  navigateToAdvancedSettings: () => void
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
  useWalletDisplayName: (address: Maybe<Address>, options?: WalletDisplayNameOptions) => DisplayName | undefined
  // Used for triggering wallet connection on web
  onConnectWallet?: (platform?: Platform) => void
  // Used for web to open the token selector from a banner not in the swap flow
  isSwapTokenSelectorOpen: boolean
  setIsSwapTokenSelectorOpen: (open: boolean) => void
  getCanSignPermits?: (chainId: UniverseChainId | undefined) => boolean
  // some wallets don't support UniswapX, so we need to check if it's supported (mismatch account)
  getIsUniswapXSupported?: (chainId: UniverseChainId | undefined) => boolean
  handleOnPressUniswapXUnsupported?: () => void
  getCanBatchTransactions?: (chainId: UniverseChainId | undefined) => boolean
  // wallet pays gas via a non-native method, so a native balance isn't required to swap
  getHasAlternateGasFees?: (chainId: UniverseChainId | undefined) => boolean
  getSwapDelegationInfo?: (chainId: UniverseChainId | undefined) => SwapDelegationInfo
  // Signs an EIP-7702 delegation authorization to bundle into 4337 swap/approval requests.
  // Provided by wallet environments only; undefined elsewhere.
  signDelegationAuthorization?: SignDelegationAuthorizationFn
  // Whether this platform executes swaps as 4337 userOps directly (mobile/extension). Web executes
  // embedded-wallet swaps via the EIP-5792 wallet_sendCalls surface instead, so it leaves this
  // false — sponsored EW swaps must route to /swap_5792, not the /swap_4337 userOp endpoint.
  supportsUserOpSwaps?: boolean
  useAccountsStoreContextHook: () => AccountsStore
  getTokenDetailsUrl?: (currencyId: string, chainSelection?: TdpChainSelection) => string
  getPoolDetailsUrl?: (args: { poolId: Address; chainId: UniverseChainId }) => string
  getExternalProfileUrl?: (args: { address: Address }) => string
}

export const UniswapContext = createContext<UniswapContextValue | null>(null)

export function UniswapProvider({
  children,
  navigateToBuyOrReceiveWithEmptyWallet,
  navigateToFiatOnRamp,
  navigateToSwapFlow,
  navigateToSendFlow,
  navigateToReceive,
  navigateToTokenDetails,
  navigateToExternalProfile,
  navigateToNftDetails,
  navigateToPoolDetails,
  navigateToEarnVault,
  navigateToAuction,
  handleShareToken,
  navigateToAdvancedSettings,
  onSwapChainsChanged,
  signer,
  useProviderHook,
  useWalletDisplayName,
  onConnectWallet,
  getCanSignPermits,
  getIsUniswapXSupported,
  handleOnPressUniswapXUnsupported,
  getCanBatchTransactions,
  getHasAlternateGasFees,
  getSwapDelegationInfo,
  signDelegationAuthorization,
  supportsUserOpSwaps,
  useAccountsStoreContextHook,
  getTokenDetailsUrl,
  getPoolDetailsUrl,
  getExternalProfileUrl,
}: PropsWithChildren<
  Omit<UniswapContextValue, 'isSwapTokenSelectorOpen' | 'setIsSwapTokenSelectorOpen' | 'setSwapOutputChainId'>
>): JSX.Element {
  const [swapInputChainId, setSwapInputChainId] = useState<UniverseChainId>()
  const [swapOutputChainId, setSwapOutputChainId] = useState<UniverseChainId>()
  const [isSwapTokenSelectorOpen, setIsSwapTokenSelectorOpen] = useState<boolean>(false)

  const value: UniswapContextValue = useMemo(
    () => ({
      navigateToBuyOrReceiveWithEmptyWallet,
      navigateToFiatOnRamp,
      navigateToSwapFlow,
      navigateToSendFlow,
      navigateToReceive,
      navigateToTokenDetails,
      navigateToExternalProfile,
      navigateToNftDetails,
      navigateToPoolDetails,
      navigateToEarnVault,
      navigateToAuction,
      handleShareToken,
      navigateToAdvancedSettings,
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
      useWalletDisplayName,
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
      getHasAlternateGasFees,
      getSwapDelegationInfo,
      signDelegationAuthorization,
      supportsUserOpSwaps,
      useAccountsStoreContextHook,
      getTokenDetailsUrl,
      getPoolDetailsUrl,
      getExternalProfileUrl,
    }),
    [
      navigateToBuyOrReceiveWithEmptyWallet,
      navigateToFiatOnRamp,
      navigateToSwapFlow,
      navigateToSendFlow,
      navigateToReceive,
      navigateToTokenDetails,
      navigateToExternalProfile,
      navigateToNftDetails,
      navigateToPoolDetails,
      navigateToEarnVault,
      navigateToAuction,
      handleShareToken,
      navigateToAdvancedSettings,
      signer,
      useProviderHook,
      useWalletDisplayName,
      onConnectWallet,
      swapInputChainId,
      swapOutputChainId,
      isSwapTokenSelectorOpen,
      getCanSignPermits,
      getIsUniswapXSupported,
      handleOnPressUniswapXUnsupported,
      getCanBatchTransactions,
      getHasAlternateGasFees,
      getSwapDelegationInfo,
      signDelegationAuthorization,
      supportsUserOpSwaps,
      onSwapChainsChanged,
      useAccountsStoreContextHook,
      getTokenDetailsUrl,
      getPoolDetailsUrl,
      getExternalProfileUrl,
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

/** Cross-platform util for getting an RPC provider for the given `chainId`, regardless of platform/environment. */
export function useProvider(chainId: number): JsonRpcProvider | undefined {
  return useUniswapContext().useProviderHook(chainId)
}

/** Cross-platform util for getting a signer for the active account/wallet, regardless of platform/environment. */
export function useSigner(): Signer | undefined {
  return useUniswapContext().signer
}

/** Cross-platform util for signing a 7702 delegation authorization to bundle into 4337 requests. */
export function useSignDelegationAuthorization(): SignDelegationAuthorizationFn | undefined {
  return useUniswapContext().signDelegationAuthorization
}
