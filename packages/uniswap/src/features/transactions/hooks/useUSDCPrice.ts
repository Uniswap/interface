import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { normalizeToken, usePrice } from '@universe/prices'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { getPrimaryStablecoin, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { isRemotePriceServiceSupportedChain } from 'uniswap/src/features/prices/isRemotePriceServiceSupportedChain'
import { useSolanaUSDCPrice } from 'uniswap/src/features/transactions/hooks/useSolanaUSDCPrice'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { logger } from 'utilities/src/logger/logger'

const MAX_TINY_PRICE_SCALING_DECIMALS = 36

export function useUSDCPrice(
  currency?: Currency,
  pollInterval: PollingInterval = PollingInterval.Fast,
): { price: Price<Currency, Currency> | undefined; isLoading: boolean } {
  const { chainId, address } = currency ? normalizeToken(currency) : { chainId: undefined, address: undefined }

  const isRemoteSupported = chainId !== undefined && isRemotePriceServiceSupportedChain(chainId)
  const stablecoin = useMemo(() => (isUniverseChainId(chainId) ? getPrimaryStablecoin(chainId) : undefined), [chainId])
  const currencyIsStablecoin = Boolean(
    stablecoin && currency && areCurrencyIdsEqual(currencyId(currency), currencyId(stablecoin)),
  )

  // Remote pricing no-ops when disabled or when the input is the chain's primary stablecoin.
  const livePrice = usePrice({
    chainId: isRemoteSupported && !currencyIsStablecoin ? chainId : undefined,
    address: isRemoteSupported && !currencyIsStablecoin ? address : undefined,
  })

  const solanaResult = useSolanaUSDCPrice(currency, pollInterval)

  const remoteResult = useMemo(() => {
    if (!currency || !stablecoin || !isUniverseChainId(chainId)) {
      return { price: undefined, isLoading: false }
    }

    if (currencyIsStablecoin) {
      return { price: new Price(stablecoin, stablecoin, '1', '1'), isLoading: false }
    }

    if (livePrice === undefined || !Number.isFinite(livePrice)) {
      return { price: undefined, isLoading: false }
    }

    try {
      // Parse human-readable amounts: 1 unit of token, and livePrice (USD per token) in stablecoin.
      // Truncate price to stablecoin decimals so parseUnits doesn't throw (e.g. USDC has 6 decimals).
      const getQuoteAmountRaw = (price: number): string =>
        parseUnits(
          truncateToMaxDecimals({
            value: convertScientificNotationToNumber(price.toString()),
            maxDecimals: stablecoin.decimals,
          }),
          stablecoin.decimals,
        ).toString()

      let baseAmountRaw = parseUnits('1', currency.decimals).toString()
      let quoteAmountRaw = getQuoteAmountRaw(livePrice)

      if (quoteAmountRaw === '0' && livePrice > 0) {
        baseAmountRaw = parseUnits(`1${'0'.repeat(MAX_TINY_PRICE_SCALING_DECIMALS)}`, currency.decimals).toString()
        quoteAmountRaw = getQuoteAmountRaw(livePrice * 10 ** MAX_TINY_PRICE_SCALING_DECIMALS)
      }

      const baseAmount = CurrencyAmount.fromRawAmount(currency, baseAmountRaw)
      const quoteAmount = CurrencyAmount.fromRawAmount(stablecoin, quoteAmountRaw)

      return {
        price: quoteAmountRaw === '0' ? undefined : new Price({ baseAmount, quoteAmount }),
        isLoading: false,
      }
    } catch (error) {
      logger.debug('useUSDCPrice', 'remoteResult', 'parse price failed', { error, livePrice })
      return { price: undefined, isLoading: false }
    }
  }, [currency, stablecoin, chainId, currencyIsStablecoin, livePrice])

  return isRemoteSupported ? remoteResult : solanaResult
}

export function useUSDCValue(
  currencyAmount: CurrencyAmount<Currency> | undefined | null,
  pollInterval: PollingInterval = PollingInterval.Fast,
): CurrencyAmount<Currency> | null {
  const { price } = useUSDCPrice(currencyAmount?.currency, pollInterval)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return null
    }
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      logger.debug('useUSDCPrice', 'useUSDCValue', 'price.quote failed', { error })
      return null
    }
  }, [currencyAmount, price])
}

export function useUSDCValueWithStatus(
  currencyAmount: CurrencyAmount<Currency> | undefined | null,
  pollInterval: PollingInterval = PollingInterval.Fast,
): {
  value: CurrencyAmount<Currency> | null
  isLoading: boolean
} {
  const { price, isLoading } = useUSDCPrice(currencyAmount?.currency, pollInterval)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return { value: null, isLoading }
    }
    try {
      return { value: price.quote(currencyAmount), isLoading }
    } catch (error) {
      logger.debug('useUSDCPrice', 'useUSDCValueWithStatus', 'price.quote failed', { error })
      return { value: null, isLoading: false }
    }
  }, [currencyAmount, isLoading, price])
}
