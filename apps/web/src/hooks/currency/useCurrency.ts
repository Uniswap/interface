import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useCurrencyInfo } from '~/hooks/currency/useCurrencyInfo'

type Maybe<T> = T | undefined

export function useCurrency({ address, chainId }: { address?: string; chainId?: UniverseChainId }): Maybe<Currency> {
  const currencyInfo = useCurrencyInfo(address, chainId, false)
  return currencyInfo?.currency
}
