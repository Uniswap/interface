import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useShowSwapNetworkNotification } from 'hooks/useShowSwapNetworkNotification'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'

// Adapts useEthersProvider to fit uniswap context hook shape
function useWebProvider(chainId: number) {
  return useEthersProvider({ chainId })
}

function useWagmiAccount(): AccountMeta | undefined {
  const account = useAccount()

  return useMemo(() => {
    if (!account.address) {
      return undefined
    }

    return {
      address: account.address,
      type: AccountType.SignerMnemonic,
    }
  }, [account.address])
}

// Abstracts web-specific transaction flow objects for usage in cross-platform flows in the `uniswap` package.
export function WebUniswapProvider({ children }: PropsWithChildren) {
  const account = useWagmiAccount()
  const signer = useEthersSigner()
  const showSwapNetworkNotification = useShowSwapNetworkNotification()
  const navigate = useNavigate()
  const navigateToFiatOnRamp = useCallback(() => navigate(`/buy`, { replace: true }), [navigate])

  return (
    <UniswapProvider
      account={account}
      signer={signer}
      useProviderHook={useWebProvider}
      onShowSwapNetworkNotification={showSwapNetworkNotification}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
    >
      {children}
    </UniswapProvider>
  )
}
