import { useCallback, useMemo } from 'react'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { createEmptyTokenOptionFromBridgingToken } from 'uniswap/src/components/TokenSelector/utils'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { useTradingApiSwappableTokensQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import { tradingApiSwappableTokenToCurrencyInfo } from 'uniswap/src/data/apiClients/tradingApi/utils/tradingApiSwappableTokenToCurrencyInfo'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import { useTokenProjectsQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GetSwappableTokensResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { GqlResult } from 'uniswap/src/data/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import {
  NATIVE_ADDRESS_FOR_TRADING_API,
  getTokenAddressFromChainForTradingApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

export function useBridgingTokenWithHighestBalance({
  address,
  currencyAddress,
  currencyChainId,
}: {
  address: Address
  currencyAddress: Address
  currencyChainId: UniverseChainId
}): {
  data:
    | {
        token: GetSwappableTokensResponse['tokens'][number]
        balance: PortfolioBalance
        currencyInfo: CurrencyInfo
      }
    | undefined
  isLoading: boolean
} {
  const currencyId = buildCurrencyId(currencyChainId, currencyAddress)
  const tokenIn = currencyAddress ? getTokenAddressFromChainForTradingApi(currencyAddress, currencyChainId) : undefined
  const tokenInChainId = toTradingApiSupportedChainId(currencyChainId)

  const { data: tokenProjectsData, loading: tokenProjectsLoading } = useTokenProjectsQuery({
    variables: { contracts: [currencyIdToContractInput(currencyId)] },
  })

  const crossChainTokens = tokenProjectsData?.tokenProjects?.[0]?.tokens

  const { otherChainBalances } = useCrossChainBalances({
    address,
    currencyId,
    crossChainTokens,
    fetchPolicy: 'cache-first',
  })

  const { data: bridgingTokens, isLoading: bridgingTokensLoading } = useTradingApiSwappableTokensQuery({
    params:
      otherChainBalances && otherChainBalances.length > 0 && tokenIn && tokenInChainId
        ? {
            tokenIn,
            tokenInChainId,
          }
        : undefined,
  })

  const isLoading = tokenProjectsLoading || bridgingTokensLoading

  return useMemo(() => {
    if (!otherChainBalances || !bridgingTokens?.tokens) {
      return { data: undefined, isLoading }
    }

    const tokenWithHighestBalance = bridgingTokens.tokens.reduce<
      | {
          token: GetSwappableTokensResponse['tokens'][number]
          balance: PortfolioBalance
          currencyInfo: CurrencyInfo
        }
      | undefined
    >((currentHighest, token) => {
      const balance = otherChainBalances.find((b) => b.currencyInfo.currency.chainId === token.chainId)

      if (!balance?.balanceUSD) {
        return currentHighest
      }

      if (
        !currentHighest ||
        !currentHighest.balance.balanceUSD ||
        balance.balanceUSD > currentHighest.balance.balanceUSD
      ) {
        const currencyInfo = tradingApiSwappableTokenToCurrencyInfo(token)

        if (!currencyInfo) {
          logger.error(new Error('Failed to convert swappable token to currency info'), {
            tags: { file: 'bridging/hooks/tokens.ts', function: 'useBridgingTokenWithHighestBalance' },
            extra: { token },
          })
          return currentHighest
        }

        return {
          token,
          balance,
          currencyInfo,
        }
      }

      return currentHighest
    }, undefined)

    return { data: tokenWithHighestBalance, isLoading }
  }, [otherChainBalances, bridgingTokens, isLoading])
}

export function useBridgingTokensOptions({
  oppositeSelectedToken,
  walletAddress,
  chainFilter,
}: {
  oppositeSelectedToken: TradeableAsset | undefined
  walletAddress: Address | undefined
  chainFilter: UniverseChainId | null
}): GqlResult<TokenOption[] | undefined> & { shouldNest?: boolean } {
  const tokenIn = oppositeSelectedToken?.address
    ? getTokenAddressFromChainForTradingApi(oppositeSelectedToken.address, oppositeSelectedToken.chainId)
    : undefined
  const tokenInChainId = toTradingApiSupportedChainId(oppositeSelectedToken?.chainId)
  const {
    data: bridgingTokens,
    isLoading: loadingBridgingTokens,
    error: errorBridgingTokens,
    refetch: refetchBridgingTokens,
  } = useTradingApiSwappableTokensQuery({
    params:
      tokenIn && tokenInChainId
        ? {
            tokenIn,
            tokenInChainId,
          }
        : undefined,
  })

  // Get portfolio balance for returned tokens
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPorfolioBalancesById,
  } = usePortfolioBalancesForAddressById(walletAddress)

  const tokenOptions = useBridgingTokensToTokenOptions(bridgingTokens?.tokens, portfolioBalancesById)
  // Filter out tokens that are not on the current chain, unless the input token is the same as the current chain
  const isSameChain = oppositeSelectedToken?.chainId === chainFilter
  const shouldFilterByChain = chainFilter !== null && !isSameChain
  const filteredTokenOptions = useMemo(
    () => filter({ tokenOptions: tokenOptions ?? null, chainFilter: shouldFilterByChain ? chainFilter : null }),
    [tokenOptions, shouldFilterByChain, chainFilter],
  )

  const error = (!portfolioBalancesById && portfolioBalancesByIdError) || (!tokenOptions && errorBridgingTokens)

  const refetch = useCallback(async () => {
    portfolioBalancesByIdRefetch?.()
    await refetchBridgingTokens()
  }, [portfolioBalancesByIdRefetch, refetchBridgingTokens])

  return {
    data: filteredTokenOptions,
    loading: loadingBridgingTokens || loadingPorfolioBalancesById,
    error: error || undefined,
    refetch,
    shouldNest: !shouldFilterByChain,
  }
}

function useBridgingTokensToTokenOptions(
  bridgingTokens: GetSwappableTokensResponse['tokens'] | undefined,
  portfolioBalancesById?: Record<string, PortfolioBalance>,
): TokenOption[] | undefined {
  const { chains: enabledChainIds } = useEnabledChains()

  return useMemo(() => {
    if (!bridgingTokens) {
      return undefined
    }

    // We sort the tokens by chain in the same order as in the network selector
    const sortedBridgingTokens = [...bridgingTokens].sort((a, b) => {
      const chainIdA = toSupportedChainId(a.chainId)
      const chainIdB = toSupportedChainId(b.chainId)
      if (!chainIdA || !chainIdB) {
        return 0
      }
      return enabledChainIds.indexOf(chainIdA) - enabledChainIds.indexOf(chainIdB)
    })

    return sortedBridgingTokens
      .map((token) => {
        const chainId = toSupportedChainId(token.chainId)
        const validInput = token.address && token.chainId
        if (!chainId || !validInput) {
          return undefined
        }

        const isNative = token.address === NATIVE_ADDRESS_FOR_TRADING_API
        const currencyId = isNative ? buildNativeCurrencyId(chainId) : buildCurrencyId(chainId, token.address)
        return {
          ...(portfolioBalancesById?.[currencyId.toLowerCase()] ?? createEmptyTokenOptionFromBridgingToken(token)),
          type: OnchainItemListOptionType.Token,
        }
      })
      .filter((tokenOption): tokenOption is TokenOption => tokenOption !== undefined)
  }, [bridgingTokens, portfolioBalancesById, enabledChainIds])
}
