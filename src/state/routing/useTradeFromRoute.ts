import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { useEffect, useState } from 'react'

import { computeRoutes } from './utils'

/** Wrapper around `Trade.fromRoutes` which returns a `Promise` */
export function useTradeFromRoute<TTradeType extends TradeType>(
  routes:
    | {
        route: ReturnType<typeof computeRoutes>
        tradeType: TTradeType
      }
    | undefined
) {
  const [trade, setTrade] = useState<Trade<Currency, Currency, TTradeType> | undefined>()

  useEffect(() => {
    if (!routes || !routes.route) {
      return
    }

    const { route, tradeType } = routes

    Trade.fromRoutes<Currency, Currency, TTradeType>(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      route.filter((r) => r.routev2 !== null).map(({ routev2, amount }) => ({ routev2: routev2!, amount })),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      route.filter((r) => r.routev3 !== null).map(({ routev3, amount }) => ({ routev3: routev3!, amount })),
      tradeType
    ).then((trade) => setTrade(trade))
  }, [routes, setTrade])

  return trade
}
