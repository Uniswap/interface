import { UseFragmentResult, useFragment } from '@apollo/client'
import {
  TokenBalance,
  TokenBalanceMainPartsFragment,
  TokenBalanceMainPartsFragmentDoc,
  TokenBalanceQuantityPartsFragment,
  TokenBalanceQuantityPartsFragmentDoc,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function useTokenBalanceMainPartsFragment({
  id,
}: {
  id: string
}): UseFragmentResult<TokenBalanceMainPartsFragment> {
  return useFragment<TokenBalanceMainPartsFragment>({
    fragment: TokenBalanceMainPartsFragmentDoc,
    fragmentName: 'TokenBalanceMainParts',
    from: {
      __typename: 'TokenBalance' satisfies TokenBalance['__typename'],
      id,
    },
  })
}

export function useTokenBalanceQuantityPartsFragment({
  id,
}: {
  id: string
}): UseFragmentResult<TokenBalanceQuantityPartsFragment> {
  return useFragment<TokenBalanceQuantityPartsFragment>({
    fragment: TokenBalanceQuantityPartsFragmentDoc,
    fragmentName: 'TokenBalanceQuantityParts',
    from: {
      __typename: 'TokenBalance' satisfies TokenBalance['__typename'],
      id,
    },
  })
}
