import { ethers } from 'ethers'
import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChainsWithConnector } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useUpdateDelegatedState } from 'uniswap/src/features/smartWallet/delegation/hooks/useUpdateDelegateState'
import { MismatchContextProvider } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'
import { useHasAccountMismatchCallback } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { createHasMismatchUtil } from 'uniswap/src/features/smartWallet/mismatch/mismatch'
import { useGetGeneratePermitAsTransaction } from 'uniswap/src/features/transactions/hooks/useGetGeneratePermitAsTransaction'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { getLogger, logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { getDelegationService } from 'wallet/src/features/smartWallet/delegation'
import { useShowSwapNetworkNotification } from 'wallet/src/features/transactions/swap/hooks/useShowSwapNetworkNotification'
import { useProvider, useWalletSigners } from 'wallet/src/features/wallet/context'
import { useActiveAccount, useActiveSignerAccount } from 'wallet/src/features/wallet/hooks'

// Adapts useProvider to fit uniswap context requirement of returning undefined instead of null
function useWalletProvider(chainId: number): ethers.providers.JsonRpcProvider | undefined {
  return useProvider(chainId) ?? undefined
}

// Gets the signer for the active account
function useWalletSigner(): ethers.Signer | undefined {
  const account = useActiveSignerAccount()
  const signerManager = useWalletSigners()
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined)
  useEffect(() => {
    setSigner(undefined) // clear signer if account changes

    if (!account) {
      return
    }

    signerManager
      .getSignerForAccount(account)
      .then(setSigner)
      .catch((error) => logger.error(error, { tags: { file: 'WalletUniswapContext', function: 'useWalletSigner' } }))
  }, [account, signerManager])

  return signer
}
export function WalletUniswapProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <MismatchContextWrapper>
      <WalletUniswapProviderInner>{children}</WalletUniswapProviderInner>
    </MismatchContextWrapper>
  )
}

// Abstracts wallet-specific transaction flow objects for usage in cross-platform flows in the `uniswap` package.
function WalletUniswapProviderInner({ children }: PropsWithChildren): JSX.Element {
  const account = useActiveAccount() ?? undefined
  const signer = useWalletSigner()
  const {
    navigateToTokenDetails,
    navigateToBuyOrReceiveWithEmptyWallet,
    navigateToFiatOnRamp,
    navigateToSwapFlow,
    navigateToSend,
    navigateToReceive,
    navigateToExternalProfile,
    navigateToNftCollection,
    handleShareToken,
  } = useWalletNavigation()
  const showSwapNetworkNotification = useShowSwapNetworkNotification()

  const navigateToSwapFromCurrencyIds = useCallback(
    ({ inputCurrencyId, outputCurrencyId }: { inputCurrencyId?: string; outputCurrencyId?: string }) => {
      const initialState = prepareSwapFormState({
        inputCurrencyId,
        outputCurrencyId,
        defaultChainId: UniverseChainId.Mainnet,
      })
      navigateToSwapFlow({ initialState })
    },
    [navigateToSwapFlow],
  )

  const getHasMismatch = useHasAccountMismatchCallback()
  const isPermitMismatchUxEnabled = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const getIsUniswapXSupported = useEvent((innerChainId?: UniverseChainId) => {
    if (isPermitMismatchUxEnabled) {
      return !getHasMismatch(innerChainId)
    }
    return true
  })
  const getGeneratePermitAsTransaction = useGetGeneratePermitAsTransaction()

  return (
    <UniswapProvider
      account={account}
      navigateToBuyOrReceiveWithEmptyWallet={navigateToBuyOrReceiveWithEmptyWallet}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
      navigateToSwapFlow={navigateToSwapFromCurrencyIds}
      navigateToSendFlow={navigateToSend}
      navigateToReceive={navigateToReceive}
      navigateToTokenDetails={navigateToTokenDetails}
      navigateToExternalProfile={navigateToExternalProfile}
      navigateToNftCollection={navigateToNftCollection}
      handleShareToken={handleShareToken}
      signer={signer}
      useProviderHook={useWalletProvider}
      getIsUniswapXSupported={getIsUniswapXSupported}
      getGeneratePermitAsTransaction={getGeneratePermitAsTransaction}
      onSwapChainsChanged={showSwapNetworkNotification}
    >
      {children}
    </UniswapProvider>
  )
}

/**
 * MismatchContextWrapper -- wraps the MismatchContextProvider with the active account and default chain id
 * @param children - the children to render
 * @returns the MismatchContextProvider with the active account and default chain id
 */
const MismatchContextWrapper = React.memo(function MismatchContextWrapper({
  children,
}: PropsWithChildren): JSX.Element {
  const account = useActiveAccount() ?? undefined
  const { defaultChainId, chains, isTestnetModeEnabled } = useEnabledChainsWithConnector()
  const mismatchCallback = useMismatchCallback()
  return (
    <MismatchContextProvider
      address={account?.address}
      chainId={defaultChainId}
      mismatchCallback={mismatchCallback}
      chains={chains}
      defaultChainId={defaultChainId}
      isTestnetModeEnabled={isTestnetModeEnabled}
      onHasAnyMismatch={() => {
        // todo: implement
      }}
    >
      {children}
    </MismatchContextProvider>
  )
})

MismatchContextWrapper.displayName = 'MismatchContextWrapper'

function useMismatchCallback(): (input: { chainId: UniverseChainId; address: string }) => Promise<boolean> {
  const updateDelegatedState = useUpdateDelegatedState()
  return useEvent(
    async (input: { chainId: UniverseChainId; address: string }): Promise<boolean> =>
      createHasMismatchUtil({
        logger: getLogger(),
        delegationService: getDelegationService({
          onDelegationDetected: (payload) => {
            // update redux state
            updateDelegatedState({ chainId: String(payload.chainId), address: payload.address })
          },
        }),
        getIsAtomicBatchingSupported: async () => {
          // hardcoded to false for now
          return false
        },
      })(input),
  )
}
