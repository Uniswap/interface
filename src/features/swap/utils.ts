import { Currency, Price } from '@uniswap/sdk-core'
import { formatPrice } from 'src/utils/format'

export function serializeQueryParams(
  params: Record<string, Parameters<typeof encodeURIComponent>[0]>
) {
  let queryString = []
  for (const param in params) {
    queryString.push(`${encodeURIComponent(param)}=${encodeURIComponent(params[param])}`)
  }
  return queryString.join('&')
}

export function formatExecutionPrice(price: Price<Currency, Currency> | undefined) {
  if (!price) return '-'

  return `1 ${price.quoteCurrency?.symbol} = ${formatPrice(price, { style: 'decimal' })} ${
    price?.baseCurrency.symbol
  }`
}
