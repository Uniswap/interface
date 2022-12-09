import { Currency, CurrencyAmount, Price, TokenAmount } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import JSBI from 'jsbi'
import { stringify } from 'querystring'
import useSWR from 'swr'

import { ETHER_ADDRESS, ZERO_ADDRESS, sentryRequestId } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { tryParseAmount } from 'state/swap/hooks'

// 1 knc = ?? usdt
export default function useBaseTradeInfo(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const { account, chainId } = useActiveWeb3React()
  const tokenInAddress = currencyIn?.isNative ? ETHER_ADDRESS : currencyIn?.wrapped.address ?? ''
  const tokenOutAddress = currencyOut?.isNative ? ETHER_ADDRESS : currencyOut?.wrapped.address ?? ''
  const amountIn = tryParseAmount('1', currencyIn)

  const { data, isValidating } = useSWR(
    tokenInAddress && tokenOutAddress && chainId
      ? `${NETWORKS_INFO[chainId].routerUri}?${stringify({
          tokenIn: tokenInAddress.toLowerCase(),
          tokenOut: tokenOutAddress.toLowerCase(),
          amountIn: amountIn?.quotient?.toString() ?? '',
          to: account ?? ZERO_ADDRESS,
        })}`
      : null,
    async (url: string) => {
      if (!currencyOut || !currencyIn || !url) return
      try {
        const { data } = await axios.get(url, {
          headers: {
            'X-Request-Id': sentryRequestId,
            'Accept-Version': 'Latest',
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
      } catch (error) {
        console.error(error)
      }
      return
    },
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  return { loading: isValidating, tradeInfo: data }
}
