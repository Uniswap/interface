import { useCallback } from 'react'
import { shuffleArray } from 'uniswap/src/components/IconCloud/utils'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { type RestTokens, useRestTokensQuery } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { approvedERC20, InteractiveToken } from '~/pages/Landing/assets/approvedTokens'

const tokenList = shuffleArray(approvedERC20) as InteractiveToken[]

function promoTokenLookupKey(chain: string, address: string): string {
  return `${chain}-${address}`
}

function promoTokenToCurrencyId({ chain, address }: InteractiveToken): string | undefined {
  const chainId = fromGraphQLChain(chain)
  if (!chainId) {
    return undefined
  }
  return address === NATIVE_CHAIN_ID ? buildNativeCurrencyId(chainId) : buildCurrencyId(chainId, address)
}

// Resolved once at module scope so the request and the positional response indexing share one
// ordering, and so `select` stays referentially stable for React Query.
const promoTokens = tokenList.flatMap((token) => {
  const currencyId = promoTokenToCurrencyId(token)
  return currencyId ? [{ key: promoTokenLookupKey(token.chain, token.address), currencyId }] : []
})
const promoCurrencyIds = promoTokens.map(({ currencyId }) => currencyId)

interface PromoTokenPrice {
  price: number
  pricePercentChange: number
}

function selectPromoTokenPricesByKey(tokens: RestTokens): Record<string, PromoTokenPrice> {
  return Object.fromEntries(
    promoTokens.map(({ key }, index) => [
      key,
      {
        price: tokens[index]?.price?.spotUsd ?? 0,
        pricePercentChange: tokens[index]?.price?.percentChange1d ?? 0,
      },
    ]),
  )
}

export function usePromoTokensData(): {
  tokenList: InteractiveToken[]
  getTokenPrice: (chain: string, address: string) => number
  getTokenPricePercentChange: (chain: string, address: string) => number
} {
  const { data: promoTokenPricesByKey } = useRestTokensQuery(promoCurrencyIds, {
    select: selectPromoTokenPricesByKey,
  })

  const getTokenPrice = useCallback(
    (chain: string, address: string) => promoTokenPricesByKey?.[promoTokenLookupKey(chain, address)]?.price ?? 0,
    [promoTokenPricesByKey],
  )

  const getTokenPricePercentChange = useCallback(
    (chain: string, address: string) =>
      promoTokenPricesByKey?.[promoTokenLookupKey(chain, address)]?.pricePercentChange ?? 0,
    [promoTokenPricesByKey],
  )

  return { tokenList, getTokenPrice, getTokenPricePercentChange }
}
