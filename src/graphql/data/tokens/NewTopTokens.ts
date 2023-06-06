import { gql, useQuery } from '@apollo/client'
import { SupportedChainId } from '@pollum-io/widgets'
import { useMemo } from 'react'

import { apolloClient } from '../apollo'
import { unwrapTokenRollux } from '../util'

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
interface Token {
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

export function useTopTokenAddresses(): {
  loading: boolean
  error: boolean
  tokens: Tokens | undefined
} {
  const { loading, error, data } = useQuery<Tokens>(TOP_TOKENS, { client: apolloClient })

  const formattedData = useMemo(() => {
    if (!data) return undefined
    const unwrappedTokens = data?.map((token) => {
      return unwrapTokenRollux(SupportedChainId.ROLLUX, token)
    })
    return unwrappedTokens
  }, [data])

  console.log('=================test query===================')
  // console.log('loading', loading)
  // console.log('error', error)
  // console.log('Test', formattedData)
  console.log('====================================')

  return {
    loading,
    error: Boolean(error),
    tokens: formattedData,
  }
}
