import { ethers } from 'ethers'
import { PropsWithChildren, useEffect, useState } from 'react'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { logger } from 'utilities/src/logger/logger'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
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

// Abstracts wallet-specific transaction flow objects for usage in cross-platform flows in the `uniswap` package.
export function WalletUniswapProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useActiveAccount() ?? undefined
  const signer = useWalletSigner()
  const { navigateToBuyOrReceiveWithEmptyWallet, navigateToFiatOnRamp } = useWalletNavigation()
  const showSwapNetworkNotification = useShowSwapNetworkNotification()

  return (
    <UniswapProvider
      account={account}
      navigateToBuyOrReceiveWithEmptyWallet={navigateToBuyOrReceiveWithEmptyWallet}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
      signer={signer}
      useProviderHook={useWalletProvider}
      onSwapChainsChanged={showSwapNetworkNotification}
    >
      {children}
    </UniswapProvider>
  )
}
