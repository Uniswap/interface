import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import * as Comlink from 'comlink'
import { useActiveWeb3React } from 'hooks/web3'
import { useEffect, useMemo, useState } from 'react'
import { GetQuoteResult } from 'state/routing/types'
import Worker from 'worker-loader!./smartOrderRouter'

import { GetQuoteWorkerType } from './smartOrderRouter'

function useWorker() {
  const { chainId } = useActiveWeb3React()

  const worker = useMemo(() => {
    const worker = new Worker()
    return Comlink.wrap<GetQuoteWorkerType>(worker) 
    // update worker when chainId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  return worker
}


export function useClientSideSmartOrderRouter(
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
  amount?: CurrencyAmount<Currency>,
  currencyIn?: Currency,
  currencyOut?: Currency
) {
  // TODO interval update
  const [quote, setQuote] = useState<GetQuoteResult | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const worker = useWorker()

  useEffect(() => {
    if (!currencyIn || !currencyOut || !amount) {
      return
    }

    setIsLoading(true)
    setIsError(false)

    ; (async () => {
        try {
          const quote = await worker.getQuote({
            tradeType,
            tokenIn: { address: currencyIn.wrapped.address, chainId: currencyIn.chainId, decimals: currencyIn.decimals, symbol: currencyIn.symbol },
            tokenOut: { address: currencyOut.wrapped.address, chainId: currencyOut.chainId, decimals: currencyOut.decimals, symbol: currencyOut.symbol },
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
  }, [amount, currencyIn, currencyOut, tradeType, worker])

  return { quote, isLoading, isError }
}