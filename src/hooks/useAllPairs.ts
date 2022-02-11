import { gql, useQuery } from '@apollo/client'
import { Pair, Token, TokenAmount } from '@swapr/sdk'
import { getAddress, parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'

const QUERY = gql`
  query {
    pairs(first: 1000) {
      reserve0
      reserve1
      token0 {
        address: id
        name
        symbol
        decimals
      }
      token1 {
        address: id
        name
        symbol
        decimals
      }
    }
  }
`

interface SubgraphToken {
  address: string
  name: string
  symbol: string
  decimals: string
}

interface RawPair {
  reserve0: string
  reserve1: string
  token0: SubgraphToken
  token1: SubgraphToken
}

interface QueryResult {
  pairs: RawPair[]
}

export function useAllPairs(): { loading: boolean; pairs: Pair[] } {
  const { chainId } = useActiveWeb3React()
  const { loading, data, error } = useQuery<QueryResult>(QUERY)

  return useMemo(() => {
    if (loading || !chainId) return { loading: true, pairs: [] }
    if (!data || error) return { loading: false, pairs: [] }
    return {
      loading: false,
      pairs: data.pairs.reduce((pairs: Pair[], rawPair) => {
        const { token0, token1, reserve0, reserve1 } = rawPair
        const tokenAmountA = new TokenAmount(
          new Token(chainId, getAddress(token0.address), parseInt(token0.decimals), token0.symbol, token0.name),
          parseUnits(reserve0, token0.decimals).toString()
        )
        const tokenAmountB = new TokenAmount(
          new Token(chainId, getAddress(token1.address), parseInt(token1.decimals), token1.symbol, token1.name),
          parseUnits(reserve1, token1.decimals).toString()
        )
        pairs.push(new Pair(tokenAmountA, tokenAmountB))
        return pairs
      }, [])
    }
  }, [chainId, data, error, loading])
}
