import { PublicKey } from '@solana/web3.js'
import { skipToken, useQuery } from '@tanstack/react-query'
import { Currency, CurrencyAmount, NativeCurrency as NativeCurrencyClass } from '@uniswap/sdk-core'
import { SharedQueryClient } from '@universe/api'
import { DynamicConfigs, getDynamicConfigValue, SyncTransactionSubmissionChainIdsConfigKey } from '@universe/gating'
import { Contract } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import {
  getSolanaParsedTokenAccountsByOwnerQueryOptions,
  SOLANA_ONCHAIN_BALANCE_COMMITMENT,
} from 'uniswap/src/data/solanaConnection/getSolanaParsedTokenAccountsByOwnerQueryOptions'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPollingIntervalByBlocktime } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { getSolanaConnection } from 'uniswap/src/features/providers/getSolanaConnection'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { currencyAddress as getCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type BalanceLookupParams = {
  currencyAddress: Address
  chainId: UniverseChainId
  currencyIsNative?: boolean
  accountAddress: string
}

type OnchainBalanceReactQueryResponse = {
  balance?: string
}

function getOnchainBalanceReactQueryKey({
  accountAddress,
  chainId,
  currencyAddress,
}: {
  accountAddress: string
  chainId: UniverseChainId
  currencyAddress: string
}): Array<string | number> {
  return [ReactQueryCacheKey.OnchainBalances, accountAddress, chainId, normalizeTokenAddressForCache(currencyAddress)]
}

async function fetchOnChainCurrencyBalanceInternal(
  params: BalanceLookupParams,
): Promise<OnchainBalanceReactQueryResponse> {
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

async function getOnChainBalancesFetchEVM(params: BalanceLookupParams): Promise<OnchainBalanceReactQueryResponse> {
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
export async function getOnChainBalancesFetchWithPending(
  params: BalanceLookupParams,
): Promise<OnchainBalanceReactQueryResponse> {
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

async function getOnChainBalancesFetchSVM(params: BalanceLookupParams): Promise<OnchainBalanceReactQueryResponse> {
  const { currencyAddress, chainId, accountAddress } = params

  try {
    // Native currency lookup
    if (currencyAddress === getChainInfo(chainId).nativeCurrency.address) {
      const connection = getSolanaConnection()
      const balance = await connection.getBalance(new PublicKey(accountAddress), SOLANA_ONCHAIN_BALANCE_COMMITMENT)
      return { balance: balance.toString() }
    }

    // SPL token lookup with caching
    const tokenAccountsMap = await SharedQueryClient.fetchQuery(
      getSolanaParsedTokenAccountsByOwnerQueryOptions({ params: { accountAddress } }),
    )

    return { balance: tokenAccountsMap[currencyAddress]?.tokenAmount ?? '0' }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'api.ts', function: 'getOnChainBalancesFetchSVM' },
      extra: { params },
    })
    return { balance: undefined }
  }
}

// We want this to return fresh data.
// We only return cached data if it's called multiple times almost at the exact same time.
const ONCHAIN_BALANCE_CACHE_TIME_MS = 100

/**
 * Equivalent to `useOnChainCurrencyBalance`, to be used when hooks aren't an option.
 */
export async function fetchOnChainCurrencyBalance({
  currencyAddress,
  chainId,
  currencyIsNative,
  accountAddress,
}: BalanceLookupParams): Promise<OnchainBalanceReactQueryResponse> {
  const queryKey = getOnchainBalanceReactQueryKey({
    accountAddress,
    chainId,
    currencyAddress,
  })

  return SharedQueryClient.fetchQuery({
    queryKey,
    queryFn: async (): Promise<OnchainBalanceReactQueryResponse> =>
      // IMPORTANT: This API call must match the `useOnChainCurrencyBalance` implementation,
      //            given that they share the same cache.
      await fetchOnChainCurrencyBalanceInternal({
        currencyAddress,
        chainId,
        currencyIsNative,
        accountAddress,
      }),
    staleTime: ONCHAIN_BALANCE_CACHE_TIME_MS,
    gcTime: getPollingIntervalByBlocktime(chainId),
  })
}

export function useOnChainCurrencyBalance(
  currency?: Currency | null,
  accountAddress?: Address,
): { balance: CurrencyAmount<Currency> | undefined; isLoading: boolean; error: unknown } {
  const refetchInterval = getPollingIntervalByBlocktime(currency?.chainId)

  const shouldSkip = !currency || !accountAddress

  const queryKey = useMemo(
    () =>
      shouldSkip
        ? []
        : getOnchainBalanceReactQueryKey({
            accountAddress,
            chainId: currency.chainId,
            currencyAddress: getCurrencyAddress(currency),
          }),
    [shouldSkip, accountAddress, currency],
  )

  const { data, error, isLoading } = useQuery<OnchainBalanceReactQueryResponse>({
    queryKey,
    queryFn: shouldSkip
      ? skipToken
      : async (): Promise<OnchainBalanceReactQueryResponse> =>
          // IMPORTANT: This API call must match the `fetchOnChainCurrencyBalance` implementation,
          //            given that they share the same cache.
          await fetchOnChainCurrencyBalanceInternal({
            currencyAddress: getCurrencyAddress(currency),
            chainId: currency.chainId,
            currencyIsNative: currency.isNative,
            accountAddress,
          }),
    staleTime: refetchInterval,
    refetchInterval,
    gcTime: refetchInterval * 2,
  })

  return useMemo(
    () => ({
      balance: getCurrencyAmount({ value: data?.balance, valueType: ValueType.Raw, currency }) ?? undefined,
      isLoading,
      error,
    }),
    [data?.balance, currency, isLoading, error],
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
