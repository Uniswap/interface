import { providers } from 'ethers'
import { useMemo } from 'react'
import { useWrapTransactionRequest } from 'src/features/transactions/swap/hooks'
import { DerivedSwapInfo } from 'src/features/transactions/swap/types'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { PollingInterval } from 'wallet/src/constants/misc'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useRestQuery } from 'wallet/src/data/rest'
import { CreateSwapRequest, CreateSwapResponse } from 'wallet/src/data/tradingApi/__generated__/api'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/tradingApi/client'
import { isClassicQuote } from 'wallet/src/features/transactions/swap/tradingApi/utils'
import { usePermit2Signature } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { QuoteType } from 'wallet/src/features/transactions/swap/useTrade'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { WrapType } from 'wallet/src/features/transactions/types'

interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
}

export function useTransactionRequestInfo(
  derivedSwapInfo: DerivedSwapInfo
): TransactionRequestInfo {
  const { trade: tradeWithStatus, currencyAmounts } = derivedSwapInfo
  const { trade } = tradeWithStatus || { trade: undefined }

  const permit2SignatureInfo = usePermit2Signature(currencyAmounts[CurrencyField.INPUT])

  // Format request args
  const swapRequestArgs: CreateSwapRequest | undefined = useMemo(() => {
    // TODO:api - this hook will only be used for trading api quotes, ignore other case
    if (trade?.quoteData?.quoteType === QuoteType.RoutingApi) {
      return undefined
    }

    const quote = trade?.quoteData?.quote
    if (!quote) {
      return undefined
    }

    // We need to wait until we have signature if we need it
    const requiresPermit2Sig = quote.permitData
    if (requiresPermit2Sig && !permit2SignatureInfo.data) {
      return undefined
    }

    // TODO: MOB(2438) https://linear.app/uniswap/issue/MOB-2438/uniswap-x-clean-old-trading-api-code
    if (!isClassicQuote(quote.quote)) {
      return undefined
    }

    return {
      quote: quote.quote,
      permitData: quote.permitData,
      signature: permit2SignatureInfo.data?.signature,
      includeGasInfo: true,
    }
  }, [permit2SignatureInfo.data, trade])

  const isWrapApplicable = derivedSwapInfo.wrapType !== WrapType.NotApplicable
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo)

  const skip = !swapRequestArgs || isWrapApplicable

  const { data, error } = useRestQuery<
    CreateSwapResponse,
    CreateSwapRequest | Record<string, never>
  >(
    uniswapUrls.tradingApiPaths.swap,
    swapRequestArgs ?? {},
    ['swap'],
    {
      pollInterval: PollingInterval.Fast,
      ttlMs: ONE_MINUTE_MS,
      skip,
    },
    'POST',
    TradingApiApolloClient
  )

  if (error) {
    logger.error(error, {
      tags: { file: 'useTransactionRequestInfo', function: 'useTransactionRequestInfo' },
      extra: {
        swapRequestArgs,
      },
    })
  }

  return {
    transactionRequest: isWrapApplicable ? wrapTxRequest : data?.swap,
  }
}
