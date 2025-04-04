import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useShowSwapNetworkNotification } from 'hooks/useShowSwapNetworkNotification'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { serializeSwapAddressesToURLParameters } from 'state/swap/hooks'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { Connector } from 'wagmi'

// Adapts useEthersProvider to fit uniswap context hook shape
function useWebProvider(chainId: number) {
  return useEthersProvider({ chainId })
}

function useWagmiAccount(): { account?: AccountMeta; connector?: Connector } {
  const account = useAccount()

  return useMemo(() => {
    if (!account.address) {
      return {
        account: undefined,
        connector: account.connector,
      }
    }

    return {
      account: {
        address: account.address,
        type: AccountType.SignerMnemonic,
      },
      connector: account.connector,
    }
  }, [account.address, account.connector])
}

// Abstracts web-specific transaction flow objects for usage in cross-platform flows in the `uniswap` package.
export function WebUniswapProvider({ children }: PropsWithChildren) {
  const { account, connector } = useWagmiAccount()
  const signer = useEthersSigner()
  const showSwapNetworkNotification = useShowSwapNetworkNotification()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const navigateToFiatOnRamp = useCallback(() => navigate(`/buy`, { replace: true }), [navigate])

  const navigateToSwapFlow = useCallback(
    ({ inputCurrencyId, outputCurrencyId }: { inputCurrencyId?: string; outputCurrencyId?: string }) => {
      const queryParams = serializeSwapAddressesToURLParameters({
        inputTokenAddress: inputCurrencyId ? currencyIdToAddress(inputCurrencyId) : undefined,
        outputTokenAddress: outputCurrencyId ? currencyIdToAddress(outputCurrencyId) : undefined,
        chainId: inputCurrencyId ? currencyIdToChain(inputCurrencyId) : undefined,
        outputChainId: outputCurrencyId ? currencyIdToChain(outputCurrencyId) : undefined,
      })
      navigate(`/swap${queryParams}`, { replace: true })
    },
    [navigate],
  )

  return (
    <UniswapProvider
      account={account}
      signer={signer}
      connector={connector}
      useProviderHook={useWebProvider}
      onSwapChainsChanged={showSwapNetworkNotification}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
      navigateToSwapFlow={navigateToSwapFlow}
      onConnectWallet={accountDrawer.open}
    >
      {children}
    </UniswapProvider>
  )
}
