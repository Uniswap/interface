import { useMemo } from 'react'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { useOrderedMultichainEntries } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'

/**
 * Resolves the `CurrencyId[]` on `CurrencyInfo.searchMultichainParent.tokenCurrencyIds` into
 * ordered per-chain address entries, for surfaces that only have the parent currency's
 * multichain sibling ids (e.g. TokenHoverCard) rather than full `CurrencyInfo[]` already in hand.
 */
export function useMultichainEntriesFromCurrencyIds(
  currencyIds: CurrencyId[],
  options?: { skip?: boolean },
): MultichainTokenEntry[] {
  const currencyInfos = useCurrencyInfos(currencyIds, { skip: options?.skip })

  const entries = useMemo<MultichainTokenEntry[]>(
    () =>
      currencyInfos
        .filter((ci): ci is NonNullable<typeof ci> => !!ci)
        .map((ci) => ({
          chainId: ci.currency.chainId,
          address: currencyAddress(ci.currency),
          isNative: ci.currency.isNative,
        })),
    [currencyInfos],
  )

  return useOrderedMultichainEntries(entries)
}
