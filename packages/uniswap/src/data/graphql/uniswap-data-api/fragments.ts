import { UseFragmentResult, useFragment } from '@apollo/client'
import {
  Token,
  TokenBasicInfoPartsFragment,
  TokenBasicInfoPartsFragmentDoc,
  TokenBasicProjectPartsFragment,
  TokenBasicProjectPartsFragmentDoc,
  TokenMarketPartsFragment,
  TokenMarketPartsFragmentDoc,
  TokenPartsFragment,
  TokenPartsFragmentDoc,
  TokenProjectMarketsPartsFragment,
  TokenProjectMarketsPartsFragmentDoc,
  TokenProjectUrlsPartsFragment,
  TokenProjectUrlsPartsFragmentDoc,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToChain, currencyIdToGraphQLAddress } from 'uniswap/src/utils/currencyId'

function currencyIdToGraphQLTokenVariables(currencyId: string): {
  // The GraphQL `address` is `null` for native ETH
  address: string | null
  chain: string
} {
  const chainId = currencyIdToChain(currencyId)
  const address = currencyIdToGraphQLAddress(currencyId)

  if (!chainId) {
    throw new Error(`Unable to find chainId for currencyId: ${currencyId}`)
  }

  return {
    address,
    chain: toGraphQLChain(chainId),
  }
}

export function useTokenPartsFragment({ currencyId }: { currencyId: string }): UseFragmentResult<TokenPartsFragment> {
  return useFragment<TokenPartsFragment>({
    fragment: TokenPartsFragmentDoc,
    fragmentName: 'TokenParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      ...currencyIdToGraphQLTokenVariables(currencyId),
    },
  })
}

export function useTokenBasicInfoPartsFragment({
  currencyId,
}: {
  currencyId: string
}): UseFragmentResult<TokenBasicInfoPartsFragment> {
  return useFragment<TokenBasicInfoPartsFragment>({
    fragment: TokenBasicInfoPartsFragmentDoc,
    fragmentName: 'TokenBasicInfoParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      ...currencyIdToGraphQLTokenVariables(currencyId),
    },
  })
}

export function useTokenMarketPartsFragment({
  currencyId,
}: {
  currencyId: string
}): UseFragmentResult<TokenMarketPartsFragment> {
  return useFragment<TokenMarketPartsFragment>({
    fragment: TokenMarketPartsFragmentDoc,
    fragmentName: 'TokenMarketParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      ...currencyIdToGraphQLTokenVariables(currencyId),
    },
  })
}

export function useTokenBasicProjectPartsFragment({
  currencyId,
}: {
  currencyId: string
}): UseFragmentResult<TokenBasicProjectPartsFragment> {
  return useFragment<TokenBasicProjectPartsFragment>({
    fragment: TokenBasicProjectPartsFragmentDoc,
    fragmentName: 'TokenBasicProjectParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      ...currencyIdToGraphQLTokenVariables(currencyId),
    },
  })
}

export function useTokenProjectUrlsPartsFragment({
  currencyId,
}: {
  currencyId: string
}): UseFragmentResult<TokenProjectUrlsPartsFragment> {
  return useFragment<TokenProjectUrlsPartsFragment>({
    fragment: TokenProjectUrlsPartsFragmentDoc,
    fragmentName: 'TokenProjectUrlsParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      ...currencyIdToGraphQLTokenVariables(currencyId),
    },
  })
}

export function useTokenProjectMarketsPartsFragment({
  currencyId,
}: {
  currencyId: string
}): UseFragmentResult<TokenProjectMarketsPartsFragment> {
  return useFragment<TokenProjectMarketsPartsFragment>({
    fragment: TokenProjectMarketsPartsFragmentDoc,
    fragmentName: 'TokenProjectMarketsParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      ...currencyIdToGraphQLTokenVariables(currencyId),
    },
  })
}
