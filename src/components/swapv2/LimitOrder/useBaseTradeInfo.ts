import { Currency, CurrencyAmount, Price, TokenAmount } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import JSBI from 'jsbi'
import { stringify } from 'querystring'
import { useRef } from 'react'
import useSWR from 'swr'

import { ETHER_ADDRESS, ZERO_ADDRESS, sentryRequestId } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { tryParseAmount } from 'state/swap/hooks'

type BaseTradeInfo = {
  price: Price<Currency, Currency>
  amountInUsd: number
  amountOutUsd: number
  routerAddress: string
}

const MAX_RETRY_COUNT = 2

// 1 knc = ?? usdt
export default function useBaseTradeInfo(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const { account, chainId } = useActiveWeb3React()
  const tokenInAddress = currencyIn?.isNative ? ETHER_ADDRESS : currencyIn?.wrapped.address ?? ''
  const tokenOutAddress = currencyOut?.isNative ? ETHER_ADDRESS : currencyOut?.wrapped.address ?? ''
  const amountIn = tryParseAmount('1', currencyIn)

  const getApiUrl = () => {
    return tokenInAddress && tokenOutAddress && chainId
      ? `${NETWORKS_INFO[chainId].routerUri}?${stringify({
          tokenIn: tokenInAddress.toLowerCase(),
          tokenOut: tokenOutAddress.toLowerCase(),
          amountIn: amountIn?.quotient?.toString() ?? '',
          to: account ?? ZERO_ADDRESS,
        })}`
      : null
  }
  const fetchData = async (url: string | null): Promise<BaseTradeInfo | undefined> => {
    if (!currencyOut || !currencyIn || !url) return
    const { data } = await axios.get(url, {
      headers: {
        'X-Request-Id': sentryRequestId,
      },
    })
    const toCurrencyAmount = function (value: string, currency: Currency): CurrencyAmount<Currency> {
      return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
    }
    const { outputAmount, amountInUsd, amountOutUsd, routerAddress } = data
    const amountOut = toCurrencyAmount(outputAmount, currencyOut)

    if (amountIn?.quotient && amountOut?.quotient) {
      return {
        price: new Price(currencyIn, currencyOut, amountIn?.quotient, amountOut?.quotient),
        amountInUsd,
        amountOutUsd,
        routerAddress,
      }
    }
    return
  }

  const retryCount = useRef(0)
  const { data, isValidating } = useSWR(
    getApiUrl(),
    async url => {
      try {
        const data = await fetchData(url)
        retryCount.current = 0
        return data
      } catch (error) {
        retryCount.current++
        if (retryCount.current <= MAX_RETRY_COUNT) {
          throw new Error(error) // retry max RETRY_COUNT times
        }
        console.error(error)
      }
      return
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: MAX_RETRY_COUNT,
      errorRetryInterval: 1500,
    },
  )

  return { loading: isValidating, tradeInfo: data }
}
