import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { selectTokensVisibility } from 'uniswap/src/features/visibility/selectors'
import type { CurrencyId } from 'uniswap/src/types/currency'

/**
 * Hook to determine token visibility by checking Redux state first, then falling back to cached flag
 * @param currencyId - The currency ID to check visibility for
 * @param cachedIsHidden - The cached isHidden flag from the API/portfolio balance
 * @returns Whether the token should be visible
 */
export function useTokenVisibility(currencyId: CurrencyId, cachedIsHidden?: boolean | null): boolean {
  const tokensVisibility = useSelector(selectTokensVisibility)
  const normalizedCurrencyId = useMemo(() => normalizeCurrencyIdForMapLookup(currencyId), [currencyId])
  const manualVisibility = tokensVisibility[normalizedCurrencyId]

  // Check Redux state first, then fall back to cached isHidden flag
  return manualVisibility?.isVisible !== undefined ? manualVisibility.isVisible : !cachedIsHidden
}
