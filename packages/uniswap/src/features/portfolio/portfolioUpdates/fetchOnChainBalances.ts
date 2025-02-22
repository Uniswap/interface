import { ApolloCache, NormalizedCacheObject } from '@apollo/client'
import { CurrencyAmount, NativeCurrency, Token } from '@uniswap/sdk-core'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { fetchTradingApiIndicativeQuoteIgnoring404 } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiIndicativeQuoteQuery'
import {
  PortfolioBalancesQuery,
  TokenDocument,
  TokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { IndicativeQuoteRequest, IndicativeQuoteResponse, TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToContractInput, gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { getOnChainBalancesFetch } from 'uniswap/src/features/portfolio/api'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { STABLECOIN_AMOUNT_OUT } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

type OnChainMap = Map<
  CurrencyId,
  {
    currencyAddress: Address
    chainId: UniverseChainId
    rawBalance?: string
    quantity?: number
    denominatedValue?: { value: number; currency: string }
  }
>

export async function fetchOnChainBalances({
  apolloCache,
  cachedPortfolio,
  accountAddress,
  currencyIds,
}: {
  apolloCache: ApolloCache<NormalizedCacheObject>
  cachedPortfolio: NonNullable<PortfolioBalancesQuery['portfolios']>[0]
  accountAddress: Address
  currencyIds: Set<CurrencyId>
}): Promise<OnChainMap> {
  const onchainBalancesByCurrencyId: OnChainMap = new Map()

  logger.debug('getOnChainBalances.ts', 'getOnChainBalances', '[ITBU] Fetching onchain balances', currencyIds)

  await Promise.all(
    Array.from(currencyIds).map(async (currencyId): Promise<void> => {
      const currencyAddress = currencyIdToAddress(currencyId)
      const chainId = currencyIdToChain(currencyId)

      if (!currencyAddress || !chainId) {
        logger.error(new Error('Unable to parse `currencyId`'), {
          tags: { file: 'fetchOnChainBalances.ts', function: 'fetchOnChainBalances' },
          extra: { currencyId },
        })
        return
      }

      const { balance: onchainBalance } = await getOnChainBalancesFetch({
        currencyAddress,
        chainId,
        currencyIsNative: isNativeCurrencyAddress(chainId, currencyAddress),
        accountAddress,
      })

      const token = apolloCache.readQuery<TokenQuery>({
        query: TokenDocument,
        variables: currencyIdToContractInput(currencyId),
      })?.token

      if (!token) {
        logger.warn('fetchOnChainBalances.ts', 'fetchOnChainBalances', 'No `token` found', { currencyId })
        return
      }

      const currencyInfo = gqlTokenToCurrencyInfo(token)

      if (!currencyInfo) {
        logger.warn('fetchOnChainBalances.ts', 'fetchOnChainBalances', 'No `currency` found')
        return
      }

      const onchainQuantityCurrencyAmount = getCurrencyAmount({
        value: onchainBalance,
        valueType: ValueType.Raw,
        currency: currencyInfo.currency,
      })

      const quantity = onchainQuantityCurrencyAmount?.toExact()

      const denominatedValue = onchainQuantityCurrencyAmount
        ? await getDenominatedValue({
            onchainQuantityCurrencyAmount,
            token,
            cachedPortfolio,
          })
        : undefined

      onchainBalancesByCurrencyId.set(currencyId, {
        currencyAddress,
        chainId,
        rawBalance: onchainBalance,
        quantity: quantity ? parseFloat(quantity) : undefined,
        denominatedValue,
      })
    }),
  )

  logger.debug(
    'getOnChainBalances.ts',
    'getOnChainBalances',
    '[ITBU] Onchain balances fetched',
    JSON.stringify(Object.fromEntries(onchainBalancesByCurrencyId)),
  )

  return onchainBalancesByCurrencyId
}

type DenominatedValue = { value: number; currency: string }

async function getDenominatedValue({
  onchainQuantityCurrencyAmount,
  token,
  cachedPortfolio,
}: {
  onchainQuantityCurrencyAmount: CurrencyAmount<NativeCurrency | Token>
  token: NonNullable<TokenQuery['token']>
  cachedPortfolio: NonNullable<PortfolioBalancesQuery['portfolios']>[0]
}): Promise<DenominatedValue | undefined> {
  const inferredDenominatedValue = getInferredCachedDenominatedValue({
    cachedPortfolio,
    token,
    onchainQuantityCurrencyAmount,
  })

  if (inferredDenominatedValue) {
    return inferredDenominatedValue
  }

  // If we don't have enough data to calculate the USD value, we continue by fetching an indicative quote.

  // For logging purposes.
  const extra = {
    cachedPortfolio,
    token,
    onchainQuantityCurrencyAmount,
  }

  const chainId = toTradingApiSupportedChainId(fromGraphQLChain(token.chain))

  if (!chainId) {
    logger.error(new Error('[ITBU] No `chainId` found'), {
      tags: {
        file: 'fetchOnChainBalances.ts',
        function: 'getDenominatedValue',
      },
      extra,
    })
    return undefined
  }

  const universeChainId = fromGraphQLChain(token.chain)

  // Skip any unsupported chains
  if (!universeChainId) {
    return undefined
  }

  const tokenAddress = token.address ?? getNativeAddress(universeChainId)

  const stablecoinCurrency = STABLECOIN_AMOUNT_OUT[universeChainId]?.currency

  if (!stablecoinCurrency) {
    logger.error(new Error('[ITBU] No `stablecoinCurrency` found'), {
      tags: {
        file: 'fetchOnChainBalances.ts',
        function: 'getDenominatedValue',
      },
      extra,
    })
    return undefined
  }

  const indicativeQuote = await fetchIndicativeQuote({
    type: TradeType.EXACT_INPUT,
    amount: onchainQuantityCurrencyAmount.quotient.toString(),
    tokenInChainId: chainId,
    tokenOutChainId: chainId,
    tokenIn: tokenAddress,
    tokenOut: stablecoinCurrency.address,
  })

  const amountOut = indicativeQuote?.output.amount

  if (!amountOut) {
    return undefined
  }

  const currencyAmountOut = getCurrencyAmount({
    value: amountOut,
    valueType: ValueType.Raw,
    currency: stablecoinCurrency,
  })

  return currencyAmountOut
    ? {
        value: parseFloat(currencyAmountOut.toFixed()),
        currency: 'USD',
      }
    : undefined
}

function getInferredCachedDenominatedValue({
  cachedPortfolio,
  token,
  onchainQuantityCurrencyAmount,
}: {
  cachedPortfolio: NonNullable<PortfolioBalancesQuery['portfolios']>[0]
  token: NonNullable<TokenQuery['token']>
  onchainQuantityCurrencyAmount: CurrencyAmount<NativeCurrency | Token>
}): DenominatedValue | undefined {
  const cachedTokenBalance = cachedPortfolio?.tokenBalances?.find(
    (balance) => balance?.token?.address === token.address && balance?.token?.chain === token.chain,
  )

  if (cachedTokenBalance?.denominatedValue && cachedTokenBalance.quantity) {
    // If we have the cached USD quantity and USD value, we can use it to calculate the new USD value.

    const onchainQuantity = onchainQuantityCurrencyAmount.toExact()

    return {
      value: (cachedTokenBalance.denominatedValue.value * parseFloat(onchainQuantity)) / cachedTokenBalance.quantity,
      currency: cachedTokenBalance.denominatedValue.currency ?? 'USD',
    }
  }

  return undefined
}

async function fetchIndicativeQuote(params: IndicativeQuoteRequest): Promise<IndicativeQuoteResponse | undefined> {
  try {
    return await fetchTradingApiIndicativeQuoteIgnoring404({ params })
  } catch (error) {
    // We log any other errors, but we don't want to throw and instead just continue with an "N/A" value.
    logger.error(error, {
      tags: {
        file: 'fetchOnChainBalances.ts',
        function: 'getIndicativeQuote',
      },
      extra: {
        params,
      },
    })
    return undefined
  }
}
