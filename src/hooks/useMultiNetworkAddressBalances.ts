import { Currency, CurrencyAmount, NativeCurrency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Weth } from 'abis/types'
import WETH_ABI from 'abis/weth.json'
import { ALL_SUPPORTED_CHAIN_IDS, isSupportedChain, SupportedChainId, TESTNET_CHAIN_IDS } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { NATIVE_CHAIN_ID, nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { BaseVariant, FeatureFlag, useBaseFlag } from 'featureFlags'
import { useCallback, useEffect, useState } from 'react'
import { getContract } from 'utils'

interface useMultiNetworkAddressBalancesArgs {
  ownerAddress: string | undefined
  tokenAddress: 'NATIVE' | string | undefined
}

type AddressNetworkBalanceData = Partial<
  Record<
    SupportedChainId,
    Record<string | 'NATIVE', CurrencyAmount<Token> | CurrencyAmount<NativeCurrency> | undefined>
  >
>

interface handleBalanceArg {
  amount: CurrencyAmount<Currency>
  chainId: SupportedChainId
  tokenAddress: string | 'NATIVE'
}

const testnetSet = new Set(TESTNET_CHAIN_IDS) as Set<SupportedChainId>

export function useMultiNetworkAddressBalances({ ownerAddress, tokenAddress }: useMultiNetworkAddressBalancesArgs) {
  const [data, setData] = useState<AddressNetworkBalanceData>({})
  const [error] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { chainId: connectedChainId } = useWeb3React()
  const feature_flag_multi_network_balances = useBaseFlag(FeatureFlag.multiNetworkBalances)

  const handleBalance = useCallback(({ amount, chainId, tokenAddress }: handleBalanceArg) => {
    if (!amount.greaterThan(0) || !tokenAddress) {
      return
    }
    setData((data) => ({
      ...data,
      [chainId]: {
        ...(data[chainId] ?? {}),
        [tokenAddress]: amount,
      },
    }))
  }, [])

  useEffect(() => {
    if (!ownerAddress || !tokenAddress) {
      return
    }
    const isConnecteToTestnet = connectedChainId ? TESTNET_CHAIN_IDS.includes(connectedChainId) : false
    setLoading(true)
    const isNative = tokenAddress === NATIVE_CHAIN_ID
    const promises: Promise<any>[] = []

    const isWrappedNative = ALL_SUPPORTED_CHAIN_IDS.some(
      (chainId) => WRAPPED_NATIVE_CURRENCY[chainId]?.address.toLowerCase() === tokenAddress.toLowerCase()
    )

    const chainsToCheck: SupportedChainId[] =
      feature_flag_multi_network_balances === BaseVariant.Enabled
        ? ALL_SUPPORTED_CHAIN_IDS
        : isSupportedChain(connectedChainId)
        ? [SupportedChainId.MAINNET, connectedChainId]
        : [SupportedChainId.MAINNET]

    chainsToCheck.forEach((chainId) => {
      const isTestnet = testnetSet.has(chainId)
      if ((isConnecteToTestnet && isTestnet) || !isTestnet) {
        const provider = RPC_PROVIDERS[chainId]
        if (isWrappedNative || isNative) {
          const wrappedNative = WRAPPED_NATIVE_CURRENCY[chainId]
          if (wrappedNative) {
            promises.push(
              new Promise(async (resolve) => {
                try {
                  const wrappedNativeContract = getContract(wrappedNative.address, WETH_ABI, provider) as Weth
                  const balance = await wrappedNativeContract.balanceOf(ownerAddress, { blockTag: 'latest' })
                  const amount = CurrencyAmount.fromRawAmount(wrappedNative, balance.toString())
                  resolve(handleBalance({ amount, chainId, tokenAddress: wrappedNative.address.toLowerCase() }))
                } catch (e) {}
              })
            )
          }
          promises.push(
            new Promise(async (resolve) => {
              try {
                const balance = await provider.getBalance(ownerAddress, 'latest')
                const nativeCurrency = nativeOnChain(chainId)
                const amount = CurrencyAmount.fromRawAmount(nativeCurrency, balance.toString())
                resolve(handleBalance({ amount, chainId, tokenAddress: 'NATIVE' }))
              } catch (e) {}
            })
          )
          // todo (jordan): support multi-network ERC20 balances
          // } else {
          //   promises.push(
          //     new Promise(async (resolve) => {
          //       try {
          //         const ERC20Contract = getContract(tokenAddress, ERC20_ABI, provider) as Erc20
          //         const balance = await ERC20Contract.balanceOf(ownerAddress, { blockTag: 'latest' })
          //         const amount =  //
          //         resolve(handleBalance({ amount, chainId, tokenAddress }))
          //       } catch (e) {}
          //     })
          //   )
        }
      }
    })

    Promise.all(promises)
      .catch(() => ({}))
      .finally(() => setLoading(false))
  }, [connectedChainId, feature_flag_multi_network_balances, handleBalance, ownerAddress, tokenAddress])

  return { data, error, loading }
}
