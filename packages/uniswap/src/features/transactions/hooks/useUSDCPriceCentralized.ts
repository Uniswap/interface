import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { normalizeToken, usePrice } from '@universe/prices'
import { useMemo } from 'react'
import type { PollingInterval } from 'uniswap/src/constants/misc'
import { getPrimaryStablecoin, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { isPriceServiceSupportedChain } from 'uniswap/src/features/prices/isPriceServiceSupportedChain'
import { useUSDCPrice as useUSDCPriceLegacy } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { logger } from 'utilities/src/logger/logger'

export function useUSDCPriceCentralized(
  currency?: Currency,
  pollInterval?: PollingInterval,
): { price: Price<Currency, Currency> | undefined; isLoading: boolean } {
  const { chainId, address } = currency ? normalizeToken(currency) : { chainId: undefined, address: undefined }

  const isSupported = chainId !== undefined && isPriceServiceSupportedChain(chainId)

  // Centralized: no-ops when !isSupported (usePrice skips via enabled=false)
  const livePrice = usePrice({
    chainId: isSupported ? chainId : undefined,
    address: isSupported ? address : undefined,
  })

  // Legacy fallback: pass undefined currency to skip useTrade when centralized is active
  const legacyResult = useUSDCPriceLegacy(isSupported ? undefined : currency, pollInterval)

  const centralizedResult = useMemo(() => {
    if (!currency || !isUniverseChainId(chainId) || livePrice === undefined) {
      return { price: undefined, isLoading: false }
    }

    try {
      const stablecoin = getPrimaryStablecoin(chainId)
      // Parse human-readable amounts: 1 unit of token, and livePrice (USD per token) in stablecoin.
      // Truncate price to stablecoin decimals so parseUnits doesn't throw (e.g. USDC has 6 decimals).
      const priceString = truncateToMaxDecimals({
        value: convertScientificNotationToNumber(livePrice.toString()),
        maxDecimals: stablecoin.decimals,
      })
      const baseAmount = CurrencyAmount.fromRawAmount(currency, parseUnits('1', currency.decimals).toString())
      const quoteAmount = CurrencyAmount.fromRawAmount(
        stablecoin,
        parseUnits(priceString, stablecoin.decimals).toString(),
      )
      return {
        price: new Price({ baseAmount, quoteAmount }),
        isLoading: false,
      }
    } catch (error) {
      logger.debug('useUSDCPriceCentralized', 'centralizedResult', 'parse price failed', { error, livePrice })
      return { price: undefined, isLoading: false }
    }
  }, [currency, chainId, livePrice])

  return isSupported ? centralizedResult : legacyResult
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
