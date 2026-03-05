import { usePrice } from '@universe/prices'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'

export function useTokenSpotPriceCentralized(currencyId: CurrencyId): number | undefined {
  const chainId = currencyIdToChain(currencyId) ?? undefined
  const address = currencyIdToAddress(currencyId)
  return usePrice({ chainId, address })
}
