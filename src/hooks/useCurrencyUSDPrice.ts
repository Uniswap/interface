import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import useUSDCPrice from 'hooks/useUSDCPrice'

export default function useCurrencyUSDPrice(currencyAmount: CurrencyAmount<Currency> | undefined) {
  const price = useUSDCPrice(currencyAmount?.currency)
  if (!price || !currencyAmount) return undefined

  return price.quote(currencyAmount)
}
