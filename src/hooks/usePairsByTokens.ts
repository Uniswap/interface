import { gql, useQuery } from '@apollo/client'
import { Pair, Token, TokenAmount } from '@swapr/sdk'
import { getAddress, parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { toLiquidityMiningCampaigns } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'

const QUERY = gql`
  fragment GetPair on Pair {
    address: id
    reserve0
    reserve1
    reserveNativeCurrency
    totalSupply
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
    liquidityMiningCampaigns(where: { endsAt_gt: $timestamp }) {
      address: id
      duration
      startsAt
      endsAt
      locked
      stakingCap
      rewardTokens {
        derivedNativeCurrency
        address: id
        name
        symbol
        decimals
      }
      stakedAmount
      rewardAmounts
    }
  }

  query($token0Id: ID, $token1Id: ID, $timestamp: BigInt!) {
    byToken0: pairs(where: { token0: $token0Id }) {
      ...GetPair
    }
    byToken1: pairs(where: { token1: $token1Id }) {
      ...GetPair
    }
  }
`

interface SubgraphToken {
  address: string
  symbol: string
  name: string
  decimals: string
}

interface SubgraphPair {
  address: string
  reserve0: string
  reserve1: string
  reserveNativeCurrency: string
  totalSupply: string
  token0: SubgraphToken
  token1: SubgraphToken
  liquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[]
}

interface QueryResult {
  byToken0: SubgraphPair[]
  byToken1: SubgraphPair[]
}

export function usePairsByTokens(
  token0?: Token | null,
  token1?: Token | null
): {
  loading: boolean
  pairs: Pair[]
} {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const { error, loading: loadingPairs, data } = useQuery<QueryResult>(QUERY, {
    variables: {
      token0Id: token0 ? token0.address.toLowerCase() : '',
      token1Id: token1 ? token1.address.toLowerCase() : '',
      timestamp: Math.floor(Date.now() / 1000)
    }
  })

  return useMemo(() => {
    if (!chainId || loadingPairs) return { loading: true, pairs: [] }
    if (!data || error) return { loading: false, pairs: [] }
    return {
      loading: false,
      pairs: data.byToken0.concat(data.byToken1).map(rawPair => {
        const {
          token0,
          token1,
          reserve0,
          reserve1,
          reserveNativeCurrency,
          totalSupply,
          liquidityMiningCampaigns
        } = rawPair
        const properToken0 = new Token(
          chainId,
          getAddress(token0.address),
          parseInt(token0.decimals),
          token0.symbol,
          token0.name
        )
        const properToken1 = new Token(
          chainId,
          getAddress(token1.address),
          parseInt(token1.decimals),
          token1.symbol,
          token1.name
        )
        const pair = new Pair(
          new TokenAmount(properToken0, parseUnits(reserve0, token0.decimals).toString()),
          new TokenAmount(properToken1, parseUnits(reserve1, token1.decimals).toString())
        )
        const campaigns = toLiquidityMiningCampaigns(
          chainId,
          pair,
          totalSupply,
          reserveNativeCurrency,
          liquidityMiningCampaigns,
          nativeCurrency
        )
        pair.liquidityMiningCampaigns = campaigns
        return pair
      })
    }
  }, [chainId, loadingPairs, data, error, nativeCurrency])
}
