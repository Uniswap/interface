import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency, Price } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import {
  formatDefaultInitialPrice,
  useDefaultInitialPrice,
} from '~/features/Liquidity/Create/hooks/useDefaultInitialPrice'
import { usePoolDisplayCurrencies } from '~/features/Liquidity/Create/hooks/usePoolDisplayCurrencies'
import {
  exceedsMaxInitialPriceDeviation,
  getInitialPriceChangePercent,
  reapplyRangeToInitialPrice,
} from '~/features/Liquidity/utils/initialPriceAcceptance'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { PositionField } from '~/types/position'

export interface InitialPriceAcceptance {
  /** The current market price, oriented like the initial-price field. */
  updatedPrice?: Price<Currency, Currency>
  /** Signed % move from the starting price under review to `updatedPrice`. */
  priceChangePercent?: number
  /** The market moved past the deviation bound: creating the pool waits for `acceptUpdatedPrice`. */
  requiresAcceptance: boolean
  acceptUpdatedPrice: () => void
}

/**
 * A new pool's starting price follows the market until the user types one. While the review screen is
 * open it holds still (see InitialPriceInput), so the reviewed price is what gets signed; this reports
 * how far the market has moved since, and accepting moves the starting price and range to it.
 * Read by the review screen's callers that can create a pool (create, migrate) and passed to ReviewModal.
 */
export function useInitialPriceAcceptance(): InitialPriceAcceptance {
  const { creatingPoolOrPair, protocolVersion, poolOrPair, priceRangeState, setPriceRangeState } =
    useCreateLiquidityContext()
  const poolCurrencies = usePoolDisplayCurrencies()

  const isFollowingMarket =
    Boolean(creatingPoolOrPair) && protocolVersion !== ProtocolVersion.V2 && !priceRangeState.isInitialPriceDirty

  const { price: marketPrice } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: poolCurrencies.TOKEN0,
      [PositionField.TOKEN1]: poolCurrencies.TOKEN1,
    },
    skip: !isFollowingMarket,
  })

  const { priceInverted, initialPrice } = priceRangeState
  const formattedMarketPrice = formatDefaultInitialPrice({ price: marketPrice, priceInverted })

  const priceChangePercent = isFollowingMarket
    ? getInitialPriceChangePercent({ acceptedPrice: initialPrice, marketPrice: formattedMarketPrice })
    : undefined

  // The spacing the create tx encodes (pool.tickSpacing) and the range step clamps the ticks to.
  const tickSpacing = poolOrPair && 'tickSpacing' in poolOrPair ? poolOrPair.tickSpacing : undefined

  const acceptUpdatedPrice = useEvent(() => {
    if (!formattedMarketPrice || tickSpacing === undefined) {
      return
    }
    setPriceRangeState((prev) =>
      reapplyRangeToInitialPrice({ priceRangeState: prev, initialPrice: formattedMarketPrice, tickSpacing }),
    )
  })

  const updatedPrice = useMemo(
    () => (priceInverted ? marketPrice?.invert() : marketPrice),
    [marketPrice, priceInverted],
  )

  return {
    updatedPrice: priceChangePercent === undefined ? undefined : updatedPrice,
    priceChangePercent,
    requiresAcceptance: exceedsMaxInitialPriceDeviation(priceChangePercent),
    acceptUpdatedPrice,
  }
}
