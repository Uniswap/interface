import { PublicKey } from '@solana/web3.js'
import { skipToken, useQuery } from '@tanstack/react-query'
import { Currency, CurrencyAmount, NativeCurrency as NativeCurrencyClass } from '@uniswap/sdk-core'
import { Contract } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { getSolanaParsedTokenAccountsByOwnerQueryOptions } from 'uniswap/src/data/solanaConnection/getSolanaParsedTokenAccountsByOwnerQueryOptions'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPollingIntervalByBlocktime } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, SyncTransactionSubmissionChainIdsConfigKey } from 'uniswap/src/features/gating/configs'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { getSolanaConnection } from 'uniswap/src/features/providers/getSolanaConnection'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { currencyId, currencyAddress as getCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type BalanceLookupParams = {
  currencyAddress: Address
  chainId: UniverseChainId
  currencyIsNative?: boolean
  accountAddress: string
}

/** Custom fetcher that uses an ethers provider to fetch. */
export async function getOnChainBalancesFetch(params: BalanceLookupParams): Promise<{ balance?: string }> {
  switch (chainIdToPlatform(params.chainId)) {
    case Platform.EVM:
      return getOnChainBalancesFetchEVM(params)
    case Platform.SVM:
      return getOnChainBalancesFetchSVM(params)
    default: {
      logger.error(new Error(`Unexpected chainId for balance lookup: ${params.chainId}`), {
        tags: { file: 'api.ts', function: 'getOnChainBalancesFetch' },
        extra: { params },
      })
      return { balance: undefined }
    }
  }
}

async function getOnChainBalancesFetchEVM(params: BalanceLookupParams): Promise<{ balance?: string }> {
  const { currencyAddress, chainId, currencyIsNative, accountAddress } = params

  const defaultSyncChainIds: UniverseChainId[] = []
  const syncTransactionSubmissionChainIds = getDynamicConfigValue({
    config: DynamicConfigs.SyncTransactionSubmissionChainIds,
    key: SyncTransactionSubmissionChainIdsConfigKey.ChainIds,
    defaultValue: defaultSyncChainIds,
  })
  const isSyncChain = syncTransactionSubmissionChainIds.includes(chainId)

  if (isSyncChain) {
    return getOnChainBalancesFetchWithPending(params)
  }

  const provider = createEthersProvider({ chainId })
  if (!provider) {
    return { balance: undefined }
  }

  // native amount lookup
  if (currencyIsNative) {
    const nativeBalance = await provider.getBalance(accountAddress)
    return { balance: nativeBalance.toString() }
  }

  // erc20 lookup
  const erc20Contract = new Contract(currencyAddress, ERC20_ABI, provider)
  const balance = await erc20Contract.callStatic.balanceOf?.(accountAddress)
  return { balance: balance.toString() }
}

/**
 * Custom fetcher for balance w/ pending tag to get subblock data.
 * Used for on-chain balance checking on Unichain.
 * TODO(APPS-8519): consolidate this with existing instant balance fetcher
 */
export async function getOnChainBalancesFetchWithPending(params: BalanceLookupParams): Promise<{ balance?: string }> {
  const { currencyAddress, chainId, currencyIsNative, accountAddress } = params
  if (!currencyAddress || !accountAddress) {
    return { balance: undefined }
  }

  const provider = createEthersProvider({ chainId })
  if (!provider) {
    return { balance: undefined }
  }

  // native amount lookup
  if (currencyIsNative) {
    const nativeBalance = await provider.getBalance(accountAddress, 'pending')
    return { balance: nativeBalance.toString() }
  }

  // erc20 lookup with pending tag support
  const erc20Contract = new Contract(currencyAddress, ERC20_ABI, provider)

  // For ERC20 tokens with pending tag, we'll use a direct RPC call
  const balance = await provider.send('eth_call', [
    {
      to: currencyAddress,
      data: erc20Contract.interface.encodeFunctionData('balanceOf', [accountAddress]),
    },
    'pending',
  ])

  const decodedBalance = erc20Contract.interface.decodeFunctionResult('balanceOf', balance)[0]
  return { balance: decodedBalance.toString() }
}

async function getOnChainBalancesFetchSVM(params: BalanceLookupParams): Promise<{ balance?: string }> {
  const { currencyAddress, chainId, accountAddress } = params

  try {
    // Native currency lookup
    if (currencyAddress === getChainInfo(chainId).nativeCurrency.address) {
      const connection = getSolanaConnection()
      const balance = await connection.getBalance(new PublicKey(accountAddress))
      return { balance: balance.toString() }
    }

    // SPL token lookup with caching
    const tokenAccountsMap = await SharedQueryClient.ensureQueryData(
      getSolanaParsedTokenAccountsByOwnerQueryOptions({ params: { accountAddress } }),
    )

    return { balance: tokenAccountsMap[currencyAddress]?.tokenAmount }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'api.ts', function: 'getOnChainBalancesFetchSVM' },
      extra: { params },
    })
    return { balance: undefined }
  }
}

export function useOnChainCurrencyBalance(
  currency?: Currency | null,
  accountAddress?: Address,
): { balance: CurrencyAmount<Currency> | undefined; isLoading: boolean; error: unknown } {
  const refetchInterval = getPollingIntervalByBlocktime(currency?.chainId)

  const { data, error } = useQuery<{ balance?: string }>({
    queryKey: [ReactQueryCacheKey.OnchainBalances, accountAddress, currencyId(currency)],
    queryFn:
      currency && accountAddress
        ? async (): ReturnType<typeof getOnChainBalancesFetch> =>
            await getOnChainBalancesFetch({
              currencyAddress: getCurrencyAddress(currency),
              chainId: currency.chainId,
              currencyIsNative: currency.isNative,
              accountAddress,
            })
        : skipToken,
    staleTime: refetchInterval,
    refetchInterval,
    gcTime: refetchInterval * 2,
  })

  return useMemo(
    () => ({
      balance: getCurrencyAmount({ value: data?.balance, valueType: ValueType.Raw, currency }) ?? undefined,
      isLoading: !data?.balance,
      error,
    }),
    [data?.balance, currency, error],
  )
}

export function useOnChainNativeCurrencyBalance(
  chain: UniverseChainId,
  accountAddress?: Address,
): { balance: CurrencyAmount<NativeCurrencyClass> | undefined; isLoading: boolean } {
  const currency = nativeOnChain(chain)
  const { balance, isLoading } = useOnChainCurrencyBalance(currency, accountAddress)
  return { balance: balance as CurrencyAmount<NativeCurrencyClass> | undefined, isLoading }
}
