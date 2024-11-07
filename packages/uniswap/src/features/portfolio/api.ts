import { skipToken, useQuery } from '@tanstack/react-query'
import { Currency, CurrencyAmount, NativeCurrency as NativeCurrencyClass } from '@uniswap/sdk-core'
import { Contract } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPollingIntervalByBlocktime } from 'uniswap/src/features/chains/utils'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { currencyAddress as getCurrencyAddress } from 'uniswap/src/utils/currencyId'

const ONCHAIN_BALANCES_CACHE_KEY = 'OnchainBalances'

export type BalanceLookupParams = {
  currencyAddress?: Address
  chainId?: UniverseChainId
  currencyIsNative?: boolean
  accountAddress?: string
}

/** Custom fetcher that uses an ethers provider to fetch. */
export async function getOnChainBalancesFetch(params: BalanceLookupParams): Promise<{ balance?: string }> {
  const { currencyAddress, chainId, currencyIsNative, accountAddress } = params
  if (!currencyAddress || !chainId || !accountAddress) {
    throw new Error(`currencyAddress, chainId, or accountAddress is not defined`)
  }

  const provider = createEthersProvider(chainId)
  if (!provider) {
    return { balance: undefined }
  }

  // native amount lookup
  if (currencyIsNative) {
    const nativeBalance = await provider.getBalance(accountAddress)
    return { balance: nativeBalance?.toString() }
  }

  // erc20 lookup
  const erc20Contract = new Contract(currencyAddress, ERC20_ABI, provider)
  const balance = await erc20Contract.callStatic.balanceOf?.(accountAddress)
  return { balance: balance.toString() }
}

export function useOnChainCurrencyBalance(
  currency?: Currency | null,
  accountAddress?: Address,
): { balance: CurrencyAmount<Currency> | undefined; isLoading: boolean; error: unknown } {
  const refetchInterval = getPollingIntervalByBlocktime(currency?.chainId)

  const { data, error } = useQuery<{ balance?: string }>({
    queryKey: [ONCHAIN_BALANCES_CACHE_KEY, accountAddress, currency],
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
  const currency = NativeCurrency.onChain(chain)
  const { balance, isLoading } = useOnChainCurrencyBalance(currency, accountAddress)
  return { balance: balance as CurrencyAmount<NativeCurrencyClass> | undefined, isLoading }
}
