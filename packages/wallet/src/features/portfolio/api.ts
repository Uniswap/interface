import { Currency, CurrencyAmount, NativeCurrency as NativeCurrencyClass } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { useRestQuery } from 'uniswap/src/data/rest'
import { getPollingIntervalByBlocktime } from 'uniswap/src/features/chains/utils'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { WalletChainId } from 'uniswap/src/types/chains'
import { currencyAddress as getCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createEthersProvider } from 'wallet/src/features/providers/createEthersProvider'
import { walletContextValue } from 'wallet/src/features/wallet/context'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

// stub endpoint to conform to REST endpoint styles
// Rest link should intercept and use custom fetcher instead
export const STUB_ONCHAIN_BALANCES_ENDPOINT = '/onchain-balances'

export type BalanceLookupParams = {
  currencyAddress?: Address
  chainId?: WalletChainId
  currencyIsNative?: boolean
  accountAddress?: string
}

/** Custom fetcher that uses an ethers provider to fetch. */
export const getOnChainBalancesFetch = async (params: BalanceLookupParams): Promise<Response> => {
  const { currencyAddress, chainId, currencyIsNative, accountAddress } = params
  if (!currencyAddress || !chainId || !accountAddress) {
    throw new Error(`currencyAddress, chainId, or accountAddress is not defined`)
  }

  const provider = createEthersProvider(chainId)
  if (!provider) {
    return new Response(JSON.stringify({ balance: undefined }))
  }

  // native amount lookup
  if (currencyIsNative) {
    const nativeBalance = await provider.getBalance(accountAddress)
    return new Response(JSON.stringify({ balance: nativeBalance?.toString() }))
  }

  // erc20 lookup
  const erc20Contract = walletContextValue.contracts.getOrCreateContract(chainId, currencyAddress, provider, ERC20_ABI)
  const balance = await erc20Contract.callStatic.balanceOf?.(accountAddress)
  return new Response(JSON.stringify({ balance: balance.toString() }))
}

export function useOnChainCurrencyBalance(
  currency?: Currency | null,
  accountAddress?: Address,
): { balance: CurrencyAmount<Currency> | undefined; isLoading: boolean; error: unknown } {
  const { data, error } = useRestQuery<{ balance?: string }, BalanceLookupParams>(
    STUB_ONCHAIN_BALANCES_ENDPOINT,
    {
      currencyAddress: currency ? getCurrencyAddress(currency) : undefined,
      chainId: currency?.chainId,
      currencyIsNative: currency?.isNative,
      accountAddress,
    },
    ['balance'],
    {
      pollInterval: getPollingIntervalByBlocktime(currency?.chainId),
      ttlMs: getPollingIntervalByBlocktime(currency?.chainId),
      skip: !currency,
    },
  )

  return useMemo(
    () => ({
      balance: getCurrencyAmount({ value: data?.balance, valueType: ValueType.Raw, currency }) ?? undefined,
      isLoading: !data?.balance,
      error,
    }),
    [data, currency, error],
  )
}

export function useOnChainNativeCurrencyBalance(
  chain: WalletChainId,
  accountAddress?: Address,
): { balance: CurrencyAmount<NativeCurrencyClass> | undefined; isLoading: boolean } {
  const currency = NativeCurrency.onChain(chain)
  const { balance, isLoading } = useOnChainCurrencyBalance(currency, accountAddress)
  return { balance: balance as CurrencyAmount<NativeCurrencyClass> | undefined, isLoading }
}
