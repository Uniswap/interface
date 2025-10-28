import { useStatsigClientStatus } from '@universe/gating'
import { useEffect, useState } from 'react'
import { fetchGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/defaults'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { useSmartWalletChains } from 'wallet/src/features/smartWallet/hooks/useSmartWalletChains'
import { NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'
import { getRemoveDelegationTransaction } from 'wallet/src/features/smartWallet/sagas/removeDelegationSaga'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'

function hasEnoughNativeFunds(balance: bigint, gasFee?: { displayValue?: string }): boolean {
  const parsedGasFee = gasFee?.displayValue ? BigInt(gasFee.displayValue) : BigInt(0)
  return balance > parsedGasFee
}

export const useNetworkBalances = (account?: Address): NetworkInfo[] => {
  const enabledChains = useSmartWalletChains()
  const { getDelegationDetails } = useWalletDelegationContext()
  const [networkInfos, setNetworkInfos] = useState<NetworkInfo[]>([])
  const { isStatsigReady } = useStatsigClientStatus()

  useEffect(() => {
    const checkBalances = async (): Promise<void> => {
      if (!account) {
        setNetworkInfos([])
        return
      }

      const networkInfoPromises = enabledChains.map(async (chainId): Promise<NetworkInfo | undefined> => {
        const result = getDelegationDetails(account, chainId)

        if (result?.latestDelegationAddress && result.isWalletDelegatedToUniswap) {
          try {
            const provider = createEthersProvider({ chainId })
            const balance = await provider?.getBalance(account)
            const nativeBalance = balance ? BigInt(balance.toString()) : BigInt(0)
            const chainInfo = getChainInfo(chainId)

            const gasAmount = await fetchGasFeeQuery({
              tx: getRemoveDelegationTransaction(chainId, account),
              isStatsigReady,
              smartContractDelegationAddress: DEFAULT_NATIVE_ADDRESS,
            })

            return {
              chainId,
              name: chainInfo.label,
              nativeCurrency: chainInfo.nativeCurrency.name,
              hasSufficientFunds: hasEnoughNativeFunds(nativeBalance, gasAmount),
              gasFee: gasAmount,
            }
          } catch (_error) {
            return undefined
          }
        }

        return undefined
      })

      const networkFundsInfo = (await Promise.all(networkInfoPromises)).filter(
        (info): info is NetworkInfo => info !== undefined,
      )

      setNetworkInfos(networkFundsInfo)
    }

    checkBalances().catch(() => {
      setNetworkInfos([])
    })
  }, [account, enabledChains, getDelegationDetails, isStatsigReady])

  return networkInfos
}
