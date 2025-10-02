import { PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { queryOptions, UseQueryResult, useQuery } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { GetPortfolioRequest, GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { transformInput, WithoutWalletAccount } from 'uniswap/src/data/rest/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export type GetPortfolioInput<TSelectData = GetPortfolioResponse> = {
  input?: WithoutWalletAccount<PartialMessage<GetPortfolioRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
} & Pick<GetPortfolioQuery<TSelectData>, 'enabled' | 'refetchInterval' | 'select'>

export interface TokenBalanceQuantityParts {
  quantity: number
}

export interface TokenBalanceMainParts {
  denominatedValue?: {
    value?: number
  }
  tokenProjectMarket?: {
    relativeChange24?: {
      value?: number
    }
  }
}

const portfolioClient = createPromiseClient(DataApiService, uniswapGetTransport)

/**
 * Wrapper around query for DataApiService/GetPortfolio
 * This fetches users portfolio and balances data
 */
export function useGetPortfolioQuery<TSelectData = GetPortfolioResponse>(
  params: GetPortfolioInput<TSelectData>,
): UseQueryResult<TSelectData, Error> {
  return useQuery(getPortfolioQuery(params))
}

type GetPortfolioQuery<TSelectData = GetPortfolioResponse> = QueryOptionsResult<
  GetPortfolioResponse | undefined,
  Error,
  TSelectData,
  readonly [ReactQueryCacheKey.GetPortfolio, Address | undefined, PartialMessage<GetPortfolioRequest> | undefined]
>

export const getPortfolioQuery = <TSelectData = GetPortfolioResponse>({
  input,
  enabled = true,
  refetchInterval,
  select,
}: GetPortfolioInput<TSelectData>): GetPortfolioQuery<TSelectData> => {
  const transformedInput = transformInput(input)

  // Changes in the modifier should not cause a refetch, so it's excluded from the queryKey
  const { modifier: _modifier, walletAccount, ...inputWithoutModifierAndWalletAccount } = transformedInput ?? {}
  const walletAccountsKey = walletAccount?.platformAddresses
    .map((platformAddress) => `${platformAddress.address}-${platformAddress.platform}`)
    .join(',')

  return queryOptions({
    queryKey: [ReactQueryCacheKey.GetPortfolio, walletAccountsKey, inputWithoutModifierAndWalletAccount],
    queryFn: () => (transformedInput ? portfolioClient.getPortfolio(transformedInput) : Promise.resolve(undefined)),
    placeholderData: (prev) => prev, // this prevents the loading skeleton from appearing when hiding/unhiding tokens
    refetchInterval,
    enabled,
    subscribed: !!enabled,
    select,
  })
}

/**
 * Gets cached quantity for a specific token balance
 * A targeted optimization to help avoid re-renders in TokenBalanceItem
 */
export function useRestTokenBalanceQuantityParts({
  currencyId,
  evmAddress,
  svmAddress,
  enabled = true,
}: {
  currencyId?: CurrencyId
  evmAddress?: string
  svmAddress?: string
  enabled?: boolean
}): UseQueryResult<TokenBalanceQuantityParts | undefined> {
  const { chains: chainIds } = useEnabledChains()

  // TODO(SWAP-388): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(enabled ? (evmAddress ?? svmAddress) : undefined)

  const selectQuantityParts = useEvent((data: GetPortfolioResponse | undefined) => {
    const balance = _findBalanceFromCurrencyId(data, currencyId)
    return balance ? { quantity: balance.amount?.amount || 0 } : undefined
  })

  return useQuery({
    ...getPortfolioQuery({ input: { evmAddress, svmAddress, chainIds, modifier } }),
    select: selectQuantityParts,
    enabled,
  })
}

/**
 * Gets cached value and price change data for a specific token balance
 * A targeted optimization to help avoid re-renders in TokenBalanceItem
 */
export function useRestTokenBalanceMainParts({
  currencyId,
  evmAddress,
  svmAddress,
  enabled = true,
}: {
  currencyId?: CurrencyId
  evmAddress?: string
  svmAddress?: string
  enabled?: boolean
}): UseQueryResult<TokenBalanceMainParts | undefined> {
  const { chains: chainIds } = useEnabledChains()

  // TODO(SWAP-388): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(enabled ? (evmAddress ?? svmAddress) : undefined)

  const selectMainParts = useEvent((data: GetPortfolioResponse | undefined) => {
    const balance = _findBalanceFromCurrencyId(data, currencyId)

    return balance
      ? {
          denominatedValue: { value: balance.valueUsd },
          tokenProjectMarket: {
            relativeChange24: { value: balance.pricePercentChange1d },
          },
        }
      : undefined
  })

  return useQuery({
    ...getPortfolioQuery({ input: { evmAddress, svmAddress, chainIds, modifier } }),
    select: selectMainParts,
    enabled,
  })
}

function _findBalanceFromCurrencyId(
  data: GetPortfolioResponse | undefined,
  currencyId?: CurrencyId,
): Balance | undefined {
  if (!data?.portfolio?.balances || !currencyId) {
    return undefined
  }

  const tokenAddress = currencyIdToAddress(currencyId)
  const chainId = currencyIdToChain(currencyId)
  const isNative = chainId && isNativeCurrencyAddress(chainId, tokenAddress)

  return data.portfolio.balances.find((bal) => {
    if (bal.token?.chainId !== chainId) {
      return false
    }

    if (isNative) {
      return isNativeCurrencyAddress(chainId, bal.token.address)
    }

    return areAddressesEqual({
      addressInput1: { address: bal.token.address, chainId },
      addressInput2: { address: tokenAddress, chainId },
    })
  })
}
