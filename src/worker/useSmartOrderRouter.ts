import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import * as Comlink from 'comlink'
import { useActiveWeb3React } from 'hooks/web3'
import { useEffect, useMemo, useState } from 'react'
import { GetQuoteResult } from 'state/routing/types'
import Worker from 'worker-loader!./smartOrderRouter/worker'

import { GetQuoteWorkerType } from './smartOrderRouter/worker'

//TODO(judo): move to /hooks

/** Wraps router worker in Comlink to simplify ui-worker comms */
function useRouterWorker() {
  const worker = useMemo(() => {
    const worker = new Worker()
    return Comlink.wrap<GetQuoteWorkerType>(worker)
  }, [])

  return worker
}

export function useClientSideSmartOrderRouter(
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
  amount?: CurrencyAmount<Currency>,
  currencyIn?: Currency,
  currencyOut?: Currency
) {
  const { chainId } = useActiveWeb3React()

  const [quote, setQuote] = useState<GetQuoteResult | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const router = useRouterWorker()

  useEffect(() => {
    if (!currencyIn || !currencyOut || !amount || !chainId) {
      return
    }

    setIsLoading(true)
    setIsError(false)

    // TODO interval update
    ;(async () => {
      try {
        const quote = await router.getQuote({
          tradeType,
          chainId,
          tokenIn: {
            address: currencyIn.wrapped.address,
            chainId: currencyIn.chainId,
            decimals: currencyIn.decimals,
            symbol: currencyIn.symbol,
          },
          tokenOut: {
            address: currencyOut.wrapped.address,
            chainId: currencyOut.chainId,
            decimals: currencyOut.decimals,
            symbol: currencyOut.symbol,
          },
          amount: amount.quotient.toString(),
        })
        setQuote(quote)
      } catch (e) {
        setIsError(true)
        setQuote(undefined)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [amount, chainId, currencyIn, currencyOut, tradeType, router])

  return { quote, isLoading, isError }
}
