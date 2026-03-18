import { type UseFragmentResult, useFragment } from '@apollo/client'
import type {
  TokenBasicInfoPartsFragment,
  TokenBasicProjectPartsFragment,
  TokenMarketPartsFragment,
  TokenProjectMarketsPartsFragment,
  TokenProjectUrlsPartsFragment,
} from '@universe/api/src/clients/graphql/__generated__/operations'
import {
  TokenBasicInfoPartsFragmentDoc,
  TokenBasicProjectPartsFragmentDoc,
  TokenMarketPartsFragmentDoc,
  TokenProjectMarketsPartsFragmentDoc,
  TokenProjectUrlsPartsFragmentDoc,
} from '@universe/api/src/clients/graphql/__generated__/react-hooks'
import type { Token } from '@universe/api/src/clients/graphql/__generated__/schema-types'

export interface UseTokenFragmentParams {
  address: string | null
  chain: string
}

export function useTokenBasicInfoPartsFragment({
  address,
  chain,
}: UseTokenFragmentParams): UseFragmentResult<TokenBasicInfoPartsFragment> {
  return useFragment<TokenBasicInfoPartsFragment>({
    fragment: TokenBasicInfoPartsFragmentDoc,
    fragmentName: 'TokenBasicInfoParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      address,
      chain,
    },
  })
}

export function useTokenMarketPartsFragment({
  address,
  chain,
}: UseTokenFragmentParams): UseFragmentResult<TokenMarketPartsFragment> {
  return useFragment<TokenMarketPartsFragment>({
    fragment: TokenMarketPartsFragmentDoc,
    fragmentName: 'TokenMarketParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      address,
      chain,
    },
  })
}

export function useTokenBasicProjectPartsFragment({
  address,
  chain,
}: UseTokenFragmentParams): UseFragmentResult<TokenBasicProjectPartsFragment> {
  return useFragment<TokenBasicProjectPartsFragment>({
    fragment: TokenBasicProjectPartsFragmentDoc,
    fragmentName: 'TokenBasicProjectParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      address,
      chain,
    },
  })
}

export function useTokenProjectUrlsPartsFragment({
  address,
  chain,
}: UseTokenFragmentParams): UseFragmentResult<TokenProjectUrlsPartsFragment> {
  return useFragment<TokenProjectUrlsPartsFragment>({
    fragment: TokenProjectUrlsPartsFragmentDoc,
    fragmentName: 'TokenProjectUrlsParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      address,
      chain,
    },
  })
}

export function useTokenProjectMarketsPartsFragment({
  address,
  chain,
}: UseTokenFragmentParams): UseFragmentResult<TokenProjectMarketsPartsFragment> {
  return useFragment<TokenProjectMarketsPartsFragment>({
    fragment: TokenProjectMarketsPartsFragmentDoc,
    fragmentName: 'TokenProjectMarketsParts',
    from: {
      __typename: 'Token' satisfies Token['__typename'],
      address,
      chain,
    },
  })
}
