import { useCallback } from 'react'
import { type RestTokens, useRestTokensQuery } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { type CurrencyKey, currencyKeyFromCurrencyId } from '~/utils/currencyKey'

export type PriceMap = { [key: CurrencyKey]: number | undefined }

const EMPTY_PRICE_MAP: PriceMap = {}

/**
 * USD spot prices for `currencyIds` in one GetTokens request, keyed by `currencyKey`.
 * Keys come from the request ids rather than the response, so natives land under
 * NATIVE_CHAIN_ID regardless of the placeholder address the backend echoes back.
 */
export function useCurrencyKeyPriceMap(currencyIds: string[]): { priceMap: PriceMap; loading: boolean } {
  const select = useCallback(
    (tokens: RestTokens): PriceMap =>
      Object.fromEntries(
        currencyIds.flatMap((currencyId, index) => {
          const key = currencyKeyFromCurrencyId(currencyId)
          return key ? [[key, tokens[index]?.price?.spotUsd]] : []
        }),
      ),
    [currencyIds],
  )

  const { data, isLoading } = useRestTokensQuery(currencyIds, { select })

  return { priceMap: data ?? EMPTY_PRICE_MAP, loading: isLoading }
}
