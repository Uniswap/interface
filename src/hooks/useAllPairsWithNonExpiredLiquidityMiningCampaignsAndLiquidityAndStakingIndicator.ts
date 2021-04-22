import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { CurrencyAmount, Pair, Token, TokenAmount, USD } from 'dxswap-sdk'
import { getAddress, parseUnits } from 'ethers/lib/utils'
import { DateTime, Duration } from 'luxon'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { toLiquidityMiningCampaigns } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'

const QUERY = gql`
  query($lowerTimeLimit: BigInt!, $userId: ID) {
    pairs {
      address: id
      reserve0
      reserve1
      reserveUSD
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
      liquidityMiningCampaigns(where: { endsAt_gt: $lowerTimeLimit }) {
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
        liquidityMiningPositions(where: { stakedAmount_gt: 0, user: $userId }) {
          id
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

interface SubgraphLiquidityMiningCampaignWithPositions extends SubgraphLiquidityMiningCampaign {
  liquidityMiningPositions: { id: string }[]
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
  liquidityMiningCampaigns: SubgraphLiquidityMiningCampaignWithPositions[]
}

interface QueryResult {
  pairs: SubgraphPair[]
}

export function useAllPairsWithNonExpiredLiquidityMiningCampaignsAndLiquidityAndStakingIndicator(
  tokenFilter?: Token
): {
  loading: boolean
  wrappedPairs: {
    pair: Pair
    reserveUSD: CurrencyAmount
    staked: boolean
  }[]
} {
  const { chainId, account } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const memoizedLowerTimeLimit = useMemo(
    () =>
      Math.floor(
        DateTime.utc()
          .minus(Duration.fromObject({ days: 30 }))
          .toSeconds()
      ),
    []
  )
  const { loading, error, data } = useQuery<QueryResult>(QUERY, {
    variables: {
      lowerTimeLimit: memoizedLowerTimeLimit,
      userId: account?.toLowerCase() || ''
    }
  })
  const filterTokenAddress = useMemo(() => tokenFilter?.address.toLowerCase(), [tokenFilter])

  return useMemo(() => {
    if (loading) return { loading: true, wrappedPairs: [] }
    if (error || !data || !chainId) return { loading: false, wrappedPairs: [] }
    const rawPairs = filterTokenAddress
      ? data.pairs.filter(
          pair =>
            pair.token0.address.toLowerCase() === filterTokenAddress ||
            pair.token1.address.toLowerCase() === filterTokenAddress
        )
      : data.pairs
    return {
      loading: false,
      wrappedPairs: rawPairs.map(rawPair => {
        const {
          reserveNativeCurrency,
          reserveUSD,
          totalSupply,
          token0,
          token1,
          reserve0,
          reserve1,
          liquidityMiningCampaigns
        } = rawPair
        const tokenAmountA = new TokenAmount(
          new Token(chainId, getAddress(token0.address), parseInt(token0.decimals), token0.symbol, token0.name),
          parseUnits(reserve0, token0.decimals).toString()
        )
        const tokenAmountB = new TokenAmount(
          new Token(chainId, getAddress(token1.address), parseInt(token1.decimals), token1.symbol, token1.name),
          parseUnits(reserve1, token1.decimals).toString()
        )
        const pair = new Pair(tokenAmountA, tokenAmountB)

        const campaigns = toLiquidityMiningCampaigns(
          chainId,
          pair,
          totalSupply,
          reserveNativeCurrency,
          liquidityMiningCampaigns,
          nativeCurrency
        )
        pair.liquidityMiningCampaigns = campaigns
        return {
          pair,
          // campaign.liquidityMiningPositions only has length > 0 if the user has staked positions in the campaign itself
          staked: rawPair.liquidityMiningCampaigns.some(campaign => campaign.liquidityMiningPositions.length > 0),
          reserveUSD: CurrencyAmount.usd(
            parseUnits(new Decimal(reserveUSD).toFixed(USD.decimals), USD.decimals).toString()
          )
        }
      }, [])
    }
  }, [chainId, data, error, filterTokenAddress, loading, nativeCurrency])
}
