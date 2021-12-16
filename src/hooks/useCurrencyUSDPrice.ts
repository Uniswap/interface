import { Currency } from '@uniswap/sdk-core'
import useUSDCPrice from 'hooks/useUSDCPrice'

export default function useCurrencyUSDPrice(baseCurrency: Currency | undefined, quoteAmount: number) {
  const currencyUSDCPrice = useUSDCPrice(baseCurrency)
  if (!currencyUSDCPrice || isNaN(quoteAmount)) return undefined

  return (Number(currencyUSDCPrice.toSignificant(6)) * quoteAmount).toFixed(2)
}
