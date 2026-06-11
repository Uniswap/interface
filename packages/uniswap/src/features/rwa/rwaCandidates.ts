import type { Currency } from '@uniswap/sdk-core'
import type { RWACandidate } from 'uniswap/src/features/rwa/rwaMatch'

export function getRWACandidatesFromCurrency(currency: Currency): RWACandidate[] {
  if (currency.isNative) {
    return []
  }

  return [{ chainId: currency.chainId, address: currency.address }]
}
