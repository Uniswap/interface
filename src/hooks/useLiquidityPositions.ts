import { gql, useQuery } from '@apollo/client'
import { Pair, Token, TokenAmount } from 'dxswap-sdk'
import { ethers } from 'ethers'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { PairWithNonExpiredLiquidityMiningCampaigns } from '../apollo/queries'
import { toLiquidityMiningCampaigns } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'

const QUERY = gql`
  query($account: ID!, $timestamp: BigInt!) {
    liquidityPositions(where: { user: $account }) {
      pair {
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
          rewardTokens {
            address: id
            name
            symbol
            decimals
            derivedNativeCurrency
          }
          stakedAmount
          rewardAmounts
        }
      }
    }
  }
`

export function useLPPairs(account?: string): { loading: boolean; pairs: Pair[] } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const { loading, data, error } = useQuery<{
    liquidityPositions: { pair: PairWithNonExpiredLiquidityMiningCampaigns }[]
  }>(QUERY, {
    variables: {
      account: account?.toLowerCase(),
      timestamp: Math.floor(Date.now() / 1000)
    }
  })

  return useMemo(() => {
    if (loading) return { loading: true, pairs: [] }
    console.log(data, error)
    if (!data || !data.liquidityPositions || data.liquidityPositions.length === 0 || error || !chainId)
      return { loading: false, pairs: [] }
    return {
      loading,
      pairs: data.liquidityPositions.map(position => {
        const {
          token0,
          token1,
          reserve0,
          reserve1,
          totalSupply,
          reserveNativeCurrency,
          liquidityMiningCampaigns
        } = position.pair
        const tokenAmountA = new TokenAmount(
          new Token(
            chainId,
            ethers.utils.getAddress(token0.address),
            parseInt(token0.decimals),
            token0.symbol,
            token0.name
          ),
          ethers.utils.parseUnits(reserve0, token0.decimals).toString()
        )
        const tokenAmountB = new TokenAmount(
          new Token(
            chainId,
            ethers.utils.getAddress(token1.address),
            parseInt(token1.decimals),
            token1.symbol,
            token1.name
          ),
          ethers.utils.parseUnits(reserve1, token1.decimals).toString()
        )
        const pair = new Pair(tokenAmountA, tokenAmountB)
        pair.liquidityMiningCampaigns = toLiquidityMiningCampaigns(
          chainId,
          pair,
          totalSupply,
          reserveNativeCurrency,
          liquidityMiningCampaigns,
          nativeCurrency
        )
        return pair
      })
    }
  }, [chainId, data, error, loading, nativeCurrency])
}
