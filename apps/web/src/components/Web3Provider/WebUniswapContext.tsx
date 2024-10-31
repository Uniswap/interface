import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useShowSwapNetworkNotification } from 'hooks/useShowSwapNetworkNotification'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveSmartPool } from 'state/application/hooks'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'

// Adapts useEthersProvider to fit uniswap context hook shape
function useWebProvider(chainId: number) {
  return useEthersProvider({ chainId })
}

function useWagmiAccount(): AccountMeta | undefined {
  const account = useAccount()
  const activeSmartPool = useActiveSmartPool()

  return useMemo(() => {
    if (!activeSmartPool?.address || !account.address) {
      return undefined
    }

    return {
      address: activeSmartPool?.address ?? account.address,
      type: AccountType.SignerMnemonic,
    }
  }, [activeSmartPool?.address, account.address])
}

// Abstracts web-specific transaction flow objects for usage in cross-platform flows in the `uniswap` package.
export function WebUniswapProvider({ children }: PropsWithChildren) {
  const account = useWagmiAccount()
  const signer = useEthersSigner()
  const { connector } = useAccount()
  const showSwapNetworkNotification = useShowSwapNetworkNotification()
  const navigate = useNavigate()
  const navigateToFiatOnRamp = useCallback(() => navigate(`/buy`, { replace: true }), [navigate])
  const accountDrawer = useAccountDrawer()

  return (
    <UniswapProvider
      account={account}
      signer={signer}
      connector={connector}
      useProviderHook={useWebProvider}
      onSwapChainsChanged={showSwapNetworkNotification}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
      onConnectWallet={accountDrawer.open}
    >
      {children}
    </UniswapProvider>
  )
}
