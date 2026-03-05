import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { normalizeToken, usePrice } from '@universe/prices'
import { useMemo } from 'react'
import type { PollingInterval } from 'uniswap/src/constants/misc'
import { getPrimaryStablecoin, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { logger } from 'utilities/src/logger/logger'

export function useUSDCPriceCentralized(
  currency?: Currency,
  _pollInterval?: PollingInterval,
): { price: Price<Currency, Currency> | undefined; isLoading: boolean } {
  const { chainId, address } = currency ? normalizeToken(currency) : { chainId: undefined, address: undefined }
  const livePrice = usePrice({ chainId, address })

  return useMemo(() => {
    if (!currency || !isUniverseChainId(chainId) || livePrice === undefined) {
      return { price: undefined, isLoading: false }
    }

    const stablecoin = getPrimaryStablecoin(chainId)

    const baseAmount = getCurrencyAmount({ value: '1', valueType: ValueType.Exact, currency })
    const quoteAmount = getCurrencyAmount({
      value: livePrice.toString(),
      valueType: ValueType.Exact,
      currency: stablecoin,
    })

    if (!baseAmount || !quoteAmount) {
      return { price: undefined, isLoading: false }
    }

    return {
      price: new Price({ baseAmount, quoteAmount }),
      isLoading: false,
    }
  }, [currency, chainId, livePrice])
}

export function useUSDCValueCentralized(
  currencyAmount: CurrencyAmount<Currency> | undefined | null,
  pollInterval?: PollingInterval,
): CurrencyAmount<Currency> | null {
  const { price } = useUSDCPriceCentralized(currencyAmount?.currency, pollInterval)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return null
    }
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      logger.debug('useUSDCPriceCentralized', 'useUSDCValueCentralized', 'price.quote failed', { error })
      return null
    }
  }, [currencyAmount, price])
}

export function useUSDCValueWithStatusCentralized(currencyAmount: CurrencyAmount<Currency> | undefined | null): {
  value: CurrencyAmount<Currency> | null
  isLoading: boolean
} {
  const { price, isLoading } = useUSDCPriceCentralized(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return { value: null, isLoading }
    }
    try {
      return { value: price.quote(currencyAmount), isLoading }
    } catch (error) {
      logger.debug('useUSDCPriceCentralized', 'useUSDCValueWithStatusCentralized', 'price.quote failed', { error })
      return { value: null, isLoading: false }
    }
  }, [currencyAmount, isLoading, price])
}
