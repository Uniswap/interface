import { gql, useQuery } from '@apollo/client'
import { SupportedChainId } from '@pollum-io/widgets'
import { useMemo } from 'react'

import { apolloClient } from '../data/apollo'
import { unwrapTokenRollux } from '../data/util'

// eslint-disable-next-line import/no-unused-modules
export const TOP_TOKENS = gql`
  query TopTokensRollux {
    tokens(first: 50, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
      id
      symbol
      name
      decimals
      totalSupply
      volume
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      txCount
      poolCount
      totalValueLocked
      totalValueLockedUSD
      totalValueLockedUSDUntracked
    }
  }
`

export interface Token {
  decimals: string
  feesUSD: string
  id: string
  name: string
  poolCount: string
  symbol: string
  totalSupply: string
  totalValueLocked: string
  totalValueLockedUSD: string
  totalValueLockedUSDUntracked: string
  txCount: string
  untrackedVolumeUSD: string
  volume: string
  volumeUSD: string
}

type Tokens = Array<Token>

interface TokensResponse {
  tokens: Tokens
}

export function useNewTopTokens(): {
  loading: boolean
  error: boolean
  tokens: Tokens | undefined
} {
  const { loading, error, data } = useQuery<TokensResponse>(TOP_TOKENS, { client: apolloClient })

  const formattedData = useMemo(() => {
    if (!data) return undefined

    const unwrappedTokens = data?.tokens.map((token) => {
      return unwrapTokenRollux(SupportedChainId.ROLLUX, token)
    })

    return unwrappedTokens
  }, [data])

  return {
    loading,
    error: Boolean(error),
    tokens: formattedData,
  }
}
