import { PartialMessage } from '@bufbuild/protobuf'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { CurrencyAmount, NativeCurrency, Token } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { fetchTokenByAddress, searchTokenToCurrencyInfo } from 'uniswap/src/data/rest/searchTokensAndPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { fetchOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import {
  DenominatedValue,
  fetchIndicativeQuote,
} from 'uniswap/src/features/portfolio/portfolioUpdates/fetchOnChainBalances'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { SolanaToken } from 'uniswap/src/features/tokens/SolanaToken'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createLogger } from 'utilities/src/logger/logger'

export type OnChainMapRest = Map<CurrencyId, PartialMessage<Balance>>

const FILE_NAME = 'fetchOnChainBalancesRest.ts'

// Fetches real-time onchain balances for multiple currencies and converts them to Balance objects
export async function fetchOnChainBalancesRest({
  cachedPortfolio,
  accountAddress,
  currencyIds,
}: {
  cachedPortfolio: NonNullable<GetPortfolioResponse['portfolio']>
  accountAddress: Address
  currencyIds: Set<CurrencyId>
}): Promise<OnChainMapRest> {
  const log = createLogger(FILE_NAME, 'fetchOnChainBalancesRest', '[REST-ITBU]')
  const onchainBalancesByCurrencyId: OnChainMapRest = new Map()

  log.debug('Fetching onchain balances', currencyIds)

  await Promise.all(
    Array.from(currencyIds).map(async (currencyId): Promise<void> => {
      const currencyAddress = currencyIdToAddress(currencyId)
      const chainId = currencyIdToChain(currencyId)

      if (!currencyAddress || !chainId) {
        log.error(new Error('Unable to parse `currencyId`'), { currencyId })
        return
      }

      try {
        const { balance: onchainBalance } = await fetchOnChainCurrencyBalance({
          currencyAddress,
          chainId,
          currencyIsNative: isNativeCurrencyAddress(chainId, currencyAddress),
          accountAddress,
        })

        const cachedBalance = findCachedBalance({ cachedPortfolio, chainId, currencyAddress })
        const token = cachedBalance?.token

        const currencyResult = await resolveCurrency({ token, currencyId })

        if (!currencyResult) {
          return
        }

        const { currency, tokenInfo } = currencyResult

        const onchainQuantityCurrencyAmount = getCurrencyAmount({
          value: onchainBalance,
          valueType: ValueType.Raw,
          currency,
        })

        const quantity = onchainQuantityCurrencyAmount?.toExact()

        const denominatedValue = onchainQuantityCurrencyAmount
          ? await getDenominatedValueRest({
              accountAddress,
              onchainQuantityCurrencyAmount,
              cachedBalance,
              cachedPortfolio,
              currencyId,
            })
          : undefined

        onchainBalancesByCurrencyId.set(currencyId, {
          token: {
            address: currencyAddress,
            chainId,
            decimals: currency.decimals,
            symbol: currency.symbol,
            name: currency.name,
            metadata: {
              logoUrl: tokenInfo?.logoUrl ?? undefined,
            },
          },
          amount: {
            amount: quantity ? parseFloat(quantity) : undefined,
            raw: onchainBalance,
          },
          valueUsd: denominatedValue?.value,
          pricePercentChange1d: undefined,
          isHidden: false,
        })
      } catch (error) {
        log.error(error, { currencyId, accountAddress })
      }
    }),
  )

  log.debug('Onchain balances fetched', {
    fetchedCount: onchainBalancesByCurrencyId.size,
    balances: Object.fromEntries(onchainBalancesByCurrencyId),
  })

  return onchainBalancesByCurrencyId
}

async function getDenominatedValueRest({
  accountAddress,
  onchainQuantityCurrencyAmount,
  cachedBalance,
  cachedPortfolio,
  currencyId,
}: {
  accountAddress: Address
  onchainQuantityCurrencyAmount: CurrencyAmount<NativeCurrency | Token>
  cachedBalance?: Balance
  cachedPortfolio: NonNullable<GetPortfolioResponse['portfolio']>
  currencyId: CurrencyId
}): Promise<DenominatedValue | undefined> {
  const log = createLogger(FILE_NAME, 'getDenominatedValueRest', '[REST-ITBU]')

  const inferredDenominatedValue = getInferredCachedDenominatedValueRest({
    cachedPortfolio,
    cachedBalance,
    onchainQuantityCurrencyAmount,
    currencyId,
  })

  if (inferredDenominatedValue) {
    return inferredDenominatedValue
  }

  // If we don't have enough data to calculate the USD value, we continue by fetching an indicative quote.

  const chainId = toTradingApiSupportedChainId(onchainQuantityCurrencyAmount.currency.chainId)

  if (!chainId) {
    log.error(new Error('No `chainId` found'), { currencyId, onchainQuantityCurrencyAmount })
    return undefined
  }

  const universeChainId = onchainQuantityCurrencyAmount.currency.chainId as UniverseChainId

  const tokenAddress = onchainQuantityCurrencyAmount.currency.isNative
    ? getNativeAddress(universeChainId)
    : onchainQuantityCurrencyAmount.currency.address

  const stablecoinCurrency = getPrimaryStablecoin(universeChainId)

  const indicativeQuote = await fetchIndicativeQuote({
    type: TradingApi.TradeType.EXACT_INPUT,
    amount: onchainQuantityCurrencyAmount.quotient.toString(),
    tokenInChainId: chainId,
    tokenOutChainId: chainId,
    tokenIn: tokenAddress,
    tokenOut: stablecoinCurrency.address,
    swapper: accountAddress,
  })

  const amountOut =
    indicativeQuote && 'output' in indicativeQuote.quote ? indicativeQuote.quote.output?.amount : undefined

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

function getInferredCachedDenominatedValueRest({
  cachedPortfolio,
  cachedBalance,
  onchainQuantityCurrencyAmount,
  currencyId: _currencyId,
}: {
  cachedPortfolio: NonNullable<GetPortfolioResponse['portfolio']>
  cachedBalance?: Balance
  onchainQuantityCurrencyAmount: CurrencyAmount<NativeCurrency | Token>
  currencyId: CurrencyId
}): DenominatedValue | undefined {
  if (!cachedBalance?.token) {
    return undefined
  }

  const cachedTokenBalance = cachedPortfolio.balances.find(
    (balance) =>
      balance.token &&
      balance.token.chainId === cachedBalance.token?.chainId &&
      areAddressesEqual({
        addressInput1: { address: balance.token.address, chainId: balance.token.chainId },
        addressInput2: { address: cachedBalance.token.address, chainId: cachedBalance.token.chainId },
      }),
  )

  if (cachedTokenBalance?.valueUsd && cachedTokenBalance.amount?.amount) {
    // If we have the cached USD quantity and USD value, we can use it to calculate the new USD value.

    const onchainQuantity = onchainQuantityCurrencyAmount.toExact()

    return {
      value: (cachedTokenBalance.valueUsd * parseFloat(onchainQuantity)) / cachedTokenBalance.amount.amount,
      currency: 'USD',
    }
  }

  return undefined
}

function findCachedBalance({
  cachedPortfolio,
  chainId,
  currencyAddress,
}: {
  cachedPortfolio: NonNullable<GetPortfolioResponse['portfolio']>
  chainId: UniverseChainId
  currencyAddress: string
}): Balance | undefined {
  return cachedPortfolio.balances.find((balance) => {
    if (!balance.token) {
      return false
    }

    if (balance.token.chainId !== chainId) {
      return false
    }

    if (isNativeCurrencyAddress(chainId, currencyAddress)) {
      return isNativeCurrencyAddress(chainId, balance.token.address)
    }

    return areAddressesEqual({
      addressInput1: { address: balance.token.address, chainId: balance.token.chainId },
      addressInput2: { address: currencyAddress, chainId },
    })
  })
}

function getCurrencyFromCache(
  token: Balance['token'],
  currencyId: CurrencyId,
): { currency: Token | SolanaToken; tokenInfo: null } | null {
  if (!token) {
    return null
  }

  const currencyAddress = currencyIdToAddress(currencyId)
  const chainId = currencyIdToChain(currencyId)

  if (!chainId) {
    return null
  }

  const currency = isSVMChain(chainId)
    ? new SolanaToken(chainId, currencyAddress, token.decimals, token.symbol, token.name)
    : new Token(chainId, currencyAddress, token.decimals, token.symbol, token.name)

  return { currency, tokenInfo: null }
}

async function fetchTokenCurrencyInfo(
  chainId: UniverseChainId,
  address: string,
): Promise<ReturnType<typeof searchTokenToCurrencyInfo> | null> {
  const searchToken = await fetchTokenByAddress({
    chainId,
    address,
  })

  return searchToken ? searchTokenToCurrencyInfo(searchToken) : null
}

// Resolves `CurrencyInfo` either from cache or via REST search
async function resolveCurrency({
  token,
  currencyId,
}: {
  token?: Balance['token']
  currencyId: CurrencyId
}): Promise<{ currency: Token | SolanaToken; tokenInfo: ReturnType<typeof searchTokenToCurrencyInfo> | null } | null> {
  const log = createLogger(FILE_NAME, 'resolveCurrency', '[REST-ITBU]')

  // Try cache first
  if (token) {
    const cached = getCurrencyFromCache(token, currencyId)
    if (cached) {
      return cached
    }
  }

  // For new tokens not in cache, fetch token metadata via REST search
  const chainId = currencyIdToChain(currencyId)
  const currencyAddress = currencyIdToAddress(currencyId)

  if (!chainId || !currencyAddress) {
    log.error(new Error('Invalid currencyId in `resolveCurrency`'), { currencyId })
    return null
  }

  const tokenInfo = await fetchTokenCurrencyInfo(chainId, currencyAddress)

  if (tokenInfo?.currency.isToken) {
    log.debug('Fetched Token via REST Search', {
      currencyId,
      currency: tokenInfo.currency,
    })
    return { currency: tokenInfo.currency, tokenInfo }
  } else {
    log.warn('Failed to fetch Token via REST search', { currencyId })
    return null
  }
}
