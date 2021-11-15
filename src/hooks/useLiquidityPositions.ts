import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { CurrencyAmount, Pair, Percent, Token, TokenAmount, USD } from '@swapr/sdk'
import { ethers } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { DateTime, Duration } from 'luxon'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { getPairMaximumApy, toLiquidityMiningCampaign } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'
import { useKpiTokens } from './useKpiTokens'

// when a user stakes their full lp share on a certain campaign, their liquidity position
// goes to 0, and their liquidity mining position increases. In order to avoid hiding pairs where
// the user is providing liquidity when they fully commit to a campaign, we need to take this into account
const QUERY = gql`
  query($account: ID!, $lowerTimeLimit: BigInt!) {
    liquidityPositions(where: { user: $account, liquidityTokenBalance_gt: 0 }) {
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
        liquidityMiningCampaigns(where: { endsAt_gt: $lowerTimeLimit }) {
          address: id
          duration
          startsAt
          endsAt
          locked
          stakingCap
          rewards {
            token {
              address: id
              name
              symbol
              decimals
              derivedNativeCurrency
            }
            amount
          }
          stakedAmount
          liquidityMiningPositions(where: { stakedAmount_gt: 0, user: $account }) {
            id
          }
        }
      }
    }
    liquidityMiningPositions(where: { user: $account, stakedAmount_gt: 0 }) {
      pair: targetedPair {
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
        liquidityMiningCampaigns(where: { endsAt_gt: $lowerTimeLimit }) {
          address: id
          duration
          startsAt
          endsAt
          locked
          stakingCap
          rewards {
            token {
              address: id
              name
              symbol
              decimals
              derivedNativeCurrency
            }
            amount
          }
          stakedAmount
          liquidityMiningPositions(where: { stakedAmount_gt: 0, user: $account }) {
            id
          }
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

interface ExtendedSubgraphLiquidityMiningCampaign extends SubgraphLiquidityMiningCampaign {
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
  liquidityMiningCampaigns: ExtendedSubgraphLiquidityMiningCampaign[]
}

interface QueryResult {
  liquidityPositions: { pair: SubgraphPair }[]
  liquidityMiningPositions: { pair: SubgraphPair }[]
}

export function useLPPairs(
  account?: string
): {
  loading: boolean
  data: {
    pair: Pair
    liquidityUSD: CurrencyAmount
    maximumApy: Percent
    staked: boolean
  }[]
} {
  const { chainId } = useActiveWeb3React()
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
  const { loading: loadingMyPairs, data, error } = useQuery<QueryResult>(QUERY, {
    variables: {
      account: account?.toLowerCase() || '',
      lowerTimeLimit: memoizedLowerTimeLimit
    }
  })
  const rewardTokenAddresses = useMemo(() => {
    if (loadingMyPairs || !data) return []
    return data.liquidityMiningPositions.flatMap(position =>
      position.pair.liquidityMiningCampaigns.flatMap(campaign =>
        campaign.rewards.map(reward => reward.token.address.toLowerCase())
      )
    )
  }, [data, loadingMyPairs])
  const { loading: loadingKpiTokens, kpiTokens } = useKpiTokens(rewardTokenAddresses)

  return useMemo(() => {
    if (loadingMyPairs || loadingKpiTokens) return { loading: true, data: [] }
    if (
      !data ||
      !data.liquidityPositions ||
      !data.liquidityMiningPositions ||
      (data.liquidityPositions.length === 0 && data.liquidityMiningPositions.length === 0) ||
      error ||
      !chainId ||
      !kpiTokens
    )
      return { loading: false, data: [] }
    // normalize double pairs (case in which a user has staked only part of their lp tokens)
    const allPairsWithoutDuplicates = data.liquidityMiningPositions
      .concat(data.liquidityPositions)
      .reduce((accumulator: { pair: SubgraphPair }[], rawWrappedPair: { pair: SubgraphPair }): {
        pair: SubgraphPair
      }[] => {
        if (!!!accumulator.find(p => p.pair.address === rawWrappedPair.pair.address)) {
          accumulator.push(rawWrappedPair)
        }
        return accumulator
      }, [])
    return {
      loading: false,
      data: allPairsWithoutDuplicates.map(position => {
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
        pair.liquidityMiningCampaigns = liquidityMiningCampaigns.map(campaign => {
          return toLiquidityMiningCampaign(
            chainId,
            pair,
            totalSupply,
            reserveNativeCurrency,
            kpiTokens,
            campaign,
            nativeCurrency
          )
        })
        return {
          pair,
          liquidityUSD: CurrencyAmount.usd(
            parseUnits(new Decimal(reserveUSD).toFixed(USD.decimals), USD.decimals).toString()
          ),
          maximumApy: getPairMaximumApy(pair),
          staked: position.pair.liquidityMiningCampaigns.some(campaign => campaign.liquidityMiningPositions.length > 0)
        }
      })
    }
  }, [chainId, data, error, kpiTokens, loadingKpiTokens, loadingMyPairs, nativeCurrency])
}
