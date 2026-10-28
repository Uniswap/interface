import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { logger } from 'utilities/src/logger/logger'
import { parseUnits } from '~/chains'
import { PositionField } from '~/types/position'

interface UseDefaultInitialPriceParams {
  currencies: {
    [PositionField.TOKEN0]?: Maybe<Currency>
    [PositionField.TOKEN1]?: Maybe<Currency>
  }
  skip?: boolean
}

interface DefaultInitialPriceResult {
  isLoading: boolean
  price: Price<Currency, Currency> | undefined
}

/** The market price as the initial-price field holds it, in the field's base/quote orientation. */
export function formatDefaultInitialPrice({
  price,
  priceInverted,
}: {
  price: Price<Currency, Currency> | undefined
  priceInverted: boolean
}): string {
  if (!price) {
    return ''
  }
  return priceInverted ? price.invert().toSignificant(8) : price.toSignificant(8)
}

/**
 * Seeds the "current market price" reference for the create-pool range step
 * (token1 per token0), derived from each token's live streaming USD price
 * (useUSDCPrice → @universe/prices). Both legs share the pool's chain, so their
 * USD quotes use the same stablecoin and the ratio is token1-per-token0 in human
 * units — and the reference keeps updating while the user sits on the step.
 */
export function useDefaultInitialPrice({ currencies, skip }: UseDefaultInitialPriceParams): DefaultInitialPriceResult {
  const currencyIn = currencies[PositionField.TOKEN0]
  const currencyOut = currencies[PositionField.TOKEN1]

  const enabled = !skip && !!currencyIn && !!currencyOut

  const { price: usdPriceIn, isLoading: isLoadingIn } = useUSDCPrice(enabled ? currencyIn : undefined)
  const { price: usdPriceOut, isLoading: isLoadingOut } = useUSDCPrice(enabled ? currencyOut : undefined)

  return useMemo(() => {
    // undefined while a leg is still fetching, and when a token has no USD price at all — a leg
    // that settles with no price reports isLoading:false so the range step falls back instead of
    // spinning. When disabled (skipped or missing currency) both legs are unsubscribed and idle.
    if (!currencyIn || !currencyOut || !usdPriceIn || !usdPriceOut) {
      return { price: undefined, isLoading: isLoadingIn || isLoadingOut }
    }

    try {
      // token1-per-token0 = (USD per token0) / (USD per token1)
      const oneToken0 = CurrencyAmount.fromRawAmount(
        currencyIn,
        JSBI.BigInt(parseUnits('1', currencyIn.decimals).toString()),
      )
      const usdValue = usdPriceIn.quote(oneToken0) // stablecoin value of 1 token0
      const quoteAmount = usdPriceOut.invert().quote(usdValue) // token1 amount of equal value
      return { price: new Price({ baseAmount: oneToken0, quoteAmount }), isLoading: false }
    } catch (error) {
      // The only realistic throw is a currency mismatch in the ratio math, which means the two legs
      // aren't on the same chain — the same-chain assumption this hook is built on. Warn (with both
      // chainIds) so a future cross-chain / stablecoin-config regression is debuggable instead of
      // silently falling back to no reference price.
      logger.warn(
        'useDefaultInitialPrice',
        'useDefaultInitialPrice',
        'Failed to derive initial price from USD quotes',
        {
          token0ChainId: currencyIn.chainId,
          token1ChainId: currencyOut.chainId,
          error,
        },
      )
      return { price: undefined, isLoading: false }
    }
  }, [currencyIn, currencyOut, usdPriceIn, usdPriceOut, isLoadingIn, isLoadingOut])
}
