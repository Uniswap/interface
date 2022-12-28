import { Currency, Price, TokenAmount } from '@kyberswap/ks-sdk-core'
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

  const controller = useRef(new AbortController())
  const fetchData = async (url: string | null): Promise<BaseTradeInfo | undefined> => {
    if (!currencyOut || !currencyIn || !url) return

    controller.current.abort()
    controller.current = new AbortController()
    const data = await fetch(url, {
      signal: controller.current.signal,
      headers: {
        'X-Request-Id': sentryRequestId,
      },
    }).then(data => data.json())

    const { outputAmount, amountInUsd } = data
    const amountOut = TokenAmount.fromRawAmount(currencyOut, JSBI.BigInt(outputAmount))

    if (amountIn?.quotient && amountOut?.quotient) {
      return {
        price: new Price(currencyIn, currencyOut, amountIn?.quotient, amountOut?.quotient),
        amountInUsd,
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
