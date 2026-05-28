import { GraphQLApi } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { shuffleArray } from 'uniswap/src/components/IconCloud/utils'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { approvedERC20, InteractiveToken } from '~/pages/Landing/assets/approvedTokens'

const tokenList = shuffleArray(approvedERC20) as InteractiveToken[]

/** GraphQL returns lowercase addresses; approved list uses EIP-55 checksum — keys must match. */
function tokensPromoLookupKey(chain: string, address: string): string {
  if (address === NATIVE_CHAIN_ID) {
    return chain
  }
  return chain + address.toLowerCase()
}

export function usePromoTokensData(): {
  tokenList: InteractiveToken[]
  getTokenPrice: (chain: string, address: string) => number
  getTokenPricePercentChange: (chain: string, address: string) => number
} {
  const tokenCloudPromoContracts = useMemo((): GraphQLApi.ContractInput[] => {
    return tokenList.map((t) => ({
      chain: t.chain,
      address: t.address !== NATIVE_CHAIN_ID ? t.address : undefined,
    }))
  }, [])

  const { data: tokenPromosData } = GraphQLApi.useTokensPromoQuery({
    variables: { contracts: tokenCloudPromoContracts },
  })

  const indexedTokensPromoData = useMemo(
    () =>
      tokenPromosData?.tokens?.reduce(
        (acc, token) => {
          if (!token) {
            return acc
          }
          const key = tokensPromoLookupKey(token.chain, token.address ?? NATIVE_CHAIN_ID)
          acc[key] = token
          return acc
        },
        {} as Record<string, NonNullable<NonNullable<GraphQLApi.TokensPromoQuery['tokens']>[number]>>,
      ),
    [tokenPromosData],
  )

  const getTokenPrice = useCallback(
    (chain: string, address: string) => {
      const key = tokensPromoLookupKey(chain, address)
      return indexedTokensPromoData?.[key]?.market?.price?.value ?? 0
    },
    [indexedTokensPromoData],
  )

  const getTokenPricePercentChange = useCallback(
    (chain: string, address: string) => {
      const key = tokensPromoLookupKey(chain, address)
      return indexedTokensPromoData?.[key]?.market?.pricePercentChange?.value ?? 0
    },
    [indexedTokensPromoData],
  )

  return { tokenList, getTokenPrice, getTokenPricePercentChange }
}
