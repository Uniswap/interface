import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { CurrencyAmount, Pair, Percent, Token, TokenAmount, USD } from 'dxswap-sdk'
import { ethers } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { getPairMaximumApy, toLiquidityMiningCampaigns } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'

const QUERY = gql`
  query($account: ID!, $timestamp: BigInt!) {
    liquidityPositions(where: { user: $account }) {
      pair {
        address: id
        reserve0
        reserve1
        reserveNativeCurrency
        reserveUSD
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
  reserveUSD: string
  totalSupply: string
  token0: SubgraphToken
  token1: SubgraphToken
  liquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[]
}

interface QueryResult {
  liquidityPositions: { pair: SubgraphPair }[]
}

export function useLPPairs(
  account?: string
): {
  loading: boolean
  data: {
    pair: Pair
    liquidityUSD: CurrencyAmount
    maximumApy: Percent
  }[]
} {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const { loading: loadingMyPairs, data, error } = useQuery<QueryResult>(QUERY, {
    variables: {
      account: account?.toLowerCase(),
      timestamp: Math.floor(Date.now() / 1000)
    }
  })

  return useMemo(() => {
    if (loadingMyPairs) return { loading: true, data: [] }
    if (!data || !data.liquidityPositions || data.liquidityPositions.length === 0 || error || !chainId)
      return { loading: false, data: [] }
    return {
      loading: false,
      data: data.liquidityPositions.map(position => {
        const {
          token0,
          token1,
          reserve0,
          reserve1,
          totalSupply,
          reserveNativeCurrency,
          reserveUSD,
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
        return {
          pair,
          liquidityUSD: CurrencyAmount.usd(
            parseUnits(new Decimal(reserveUSD).toFixed(USD.decimals), USD.decimals).toString()
          ),
          maximumApy: getPairMaximumApy(pair)
        }
      })
    }
  }, [chainId, data, error, loadingMyPairs, nativeCurrency])
}
