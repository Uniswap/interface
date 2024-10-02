import { useMemo } from 'react'
import { useTradingApiSwappableTokensQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import { tradingApiSwappableTokenToCurrencyInfo } from 'uniswap/src/data/apiClients/tradingApi/utils/tradingApiSwappableTokenToCurrencyInfo'
import { GetSwappableTokensResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import {
  getTokenAddressFromChainForTradingApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

export function useSwappableTokenWithHighestBalance({
  currencyAddress,
  currencyChainId,
  otherChainBalances,
}: {
  currencyAddress: Address
  currencyChainId: WalletChainId
  otherChainBalances: PortfolioBalance[] | null
}):
  | {
      token: GetSwappableTokensResponse['tokens'][number]
      balance: PortfolioBalance
      currencyInfo: CurrencyInfo
    }
  | undefined {
  const isBridgingEnabled = useFeatureFlag(FeatureFlags.Bridging)

  const tokenIn = currencyAddress ? getTokenAddressFromChainForTradingApi(currencyAddress, currencyChainId) : undefined
  const tokenInChainId = toTradingApiSupportedChainId(currencyChainId)

  const { data: swappableTokens } = useTradingApiSwappableTokensQuery({
    params:
      otherChainBalances && otherChainBalances?.length > 0 && tokenIn && tokenInChainId && isBridgingEnabled
        ? {
            tokenIn,
            tokenInChainId,
          }
        : undefined,
  })

  return useMemo(() => {
    if (!otherChainBalances || !swappableTokens?.tokens) {
      return undefined
    }

    const tokenWithHighestBalance = swappableTokens.tokens.reduce<
      ReturnType<typeof useSwappableTokenWithHighestBalance> | undefined
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
            tags: { file: 'TokenDetailsScreen.tsx', function: 'useSwappableTokenWithHighestBalance' },
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

    return tokenWithHighestBalance
  }, [otherChainBalances, swappableTokens])
}
