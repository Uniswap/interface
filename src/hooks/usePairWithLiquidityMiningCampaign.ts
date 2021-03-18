import { gql, useQuery } from '@apollo/client'
import { Pair } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { toLiquidityMiningCampaigns } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'

const QUERY = gql`
  query($id: ID!, $timestamp: BigInt!) {
    pair(id: $id) {
      reserveNativeCurrency
      totalSupply
      liquidityMiningCampaigns(where: { endsAt_gt: $timestamp }) {
        address: id
        duration
        startsAt
        endsAt
        locked
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
  }
`

interface SubgraphPair {
  reserveNativeCurrency: string
  totalSupply: string
  liquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[]
}

interface QueryResult {
  pair: SubgraphPair
}

export function usePairWithLiquidityMiningCampaigns(pair?: Pair): { loading: boolean; pair: Pair | undefined } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const { loading, error, data } = useQuery<QueryResult>(QUERY, {
    variables: {
      id: pair?.liquidityToken.address.toLowerCase(),
      timestamp: Math.floor(Date.now() / 1000)
    }
  })

  return useMemo(() => {
    if (loading) return { loading: true, pair }
    if (!data || error || !chainId || !pair) return { loading: false, pair }
    // data used to calculate the price of the LP token
    const campaigns = toLiquidityMiningCampaigns(
      chainId,
      pair,
      data.pair.totalSupply,
      data.pair.reserveNativeCurrency,
      data.pair.liquidityMiningCampaigns,
      nativeCurrency
    )
    // updating reference pair and attaching the found liquidity mining campaigns
    pair.liquidityMiningCampaigns = campaigns
    return {
      loading: false,
      pair: pair
    }
  }, [chainId, data, error, loading, nativeCurrency, pair])
}
