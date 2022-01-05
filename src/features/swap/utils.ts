import { Currency, Price, WETH9 } from '@uniswap/sdk-core'
import { WrapType } from 'src/features/swap/wrapSaga'
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

export function getWrapType(
  inputCurrency: Currency | null | undefined,
  outputCurrency: Currency | null | undefined
): WrapType {
  if (!inputCurrency || !outputCurrency || inputCurrency.chainId !== outputCurrency.chainId) {
    return WrapType.NOT_APPLICABLE
  }

  const weth = WETH9[inputCurrency.chainId]

  if (inputCurrency.isNative && outputCurrency.equals(weth)) {
    return WrapType.WRAP
  } else if (outputCurrency.isNative && inputCurrency.equals(weth)) {
    return WrapType.UNWRAP
  }

  return WrapType.NOT_APPLICABLE
}

export function isWrapAction(wrapType: WrapType): wrapType is WrapType.UNWRAP | WrapType.WRAP {
  return wrapType === WrapType.UNWRAP || wrapType === WrapType.WRAP
}
