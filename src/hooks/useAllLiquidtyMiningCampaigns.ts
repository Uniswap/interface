import { gql, useQuery } from '@apollo/client'

import { BigintIsh, Pair, SingleSidedLiquidityMiningCampaign, Token, TokenAmount } from '@swapr/sdk'
import { useCallback, useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign, SubgraphSingleSidedStakingCampaign } from '../apollo'
import { useNativeCurrency } from './useNativeCurrency'

import { toLiquidityMiningCampaign, toSingleSidedStakeCampaign } from '../utils/liquidityMining'
import { DateTime, Duration } from 'luxon'
import { useAllTokensFromActiveListsOnCurrentChain } from '../state/lists/hooks'
import { getAddress, parseUnits } from 'ethers/lib/utils'
import { useKpiTokens } from './useKpiTokens'
import { PairsFilterType } from '../components/Pool/ListFilter'
import { useSWPRToken } from './swpr/useSWPRToken'

// Native fragments will not be resovled
const CAMPAIGN_REWARDS_TOKEN_COMMON_FIEDLDS = ['address: id', 'name', 'symbol', 'decimals', 'derivedNativeCurrency']
const CAMPAIGN_COMMON_FIEDLDS = ['duration', 'startsAt', 'endsAt', 'locked', 'stakingCap', 'stakedAmount']

const SINGLE_SIDED_CAMPAIGNS = gql`
  query($userId: ID) {
    singleSidedStakingCampaigns {
      id
      owner
      ${CAMPAIGN_COMMON_FIEDLDS.join('\r\n')}
      stakeToken {
        id
        symbol
        name
        decimals
        totalSupply
        derivedNativeCurrency
      }
      rewards {
        token {
          ${CAMPAIGN_REWARDS_TOKEN_COMMON_FIEDLDS.join('\r\n')}
        }
        amount
      }
      singleSidedStakingPositions(where: { stakedAmount_gt: 0, user: $userId }) {
        id
      }
    }
  }
`
const REGULAR_CAMPAIGN = gql`
  query($userId: ID) {
    liquidityMiningCampaigns {
      address: id
      ${CAMPAIGN_COMMON_FIEDLDS.join('\r\n')}
      rewards {
        token {
          ${CAMPAIGN_REWARDS_TOKEN_COMMON_FIEDLDS.join('\r\n')}
        }
        amount
      }
      stakablePair {
        id
        reserveNativeCurrency
        reserveUSD
        totalSupply
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
      liquidityMiningPositions(where: { stakedAmount_gt: 0, user: $userId }) {
        id
      }
    }
  }
`

export function useAllLiquidtyMiningCampaigns(
  pair?: Pair,
  dataFilter?: PairsFilterType
): {
  loading: boolean
  miningCampaigns: any
} {
  const token0Address = useMemo(() => (pair ? pair.token0?.address.toLowerCase() : undefined), [pair])
  const token1Address = useMemo(() => (pair ? pair.token1?.address.toLowerCase() : undefined), [pair])
  const pairAddress = useMemo(() => (pair ? pair.liquidityToken.address.toLowerCase() : undefined), [pair])

  const { chainId, account } = useActiveWeb3React()
  const SWPRToken = useSWPRToken()
  const nativeCurrency = useNativeCurrency()
  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const isUpcoming = useCallback((startTime: BigintIsh) => timestamp < parseInt(startTime.toString()), [timestamp])
  const lowerTimeLimit = DateTime.utc()
    .minus(Duration.fromObject({ days: 150 }))
    .toJSDate()

  const memoizedLowerTimeLimit = useMemo(() => Math.floor(lowerTimeLimit.getTime() / 1000), [lowerTimeLimit])
  const tokensInCurrentChain = useAllTokensFromActiveListsOnCurrentChain()

  const { data: singleSidedCampaigns, loading: singleSidedLoading, error: singleSidedCampaignsError } = useQuery<{
    singleSidedStakingCampaigns: SubgraphSingleSidedStakingCampaign[]
  }>(SINGLE_SIDED_CAMPAIGNS, {
    variables: {
      userId: account?.toLowerCase()
    }
  })

  const { data: pairCampaigns, loading: campaignLoading, error: campaignError } = useQuery<{
    liquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[]
  }>(REGULAR_CAMPAIGN, {
    variables: {
      userId: account?.toLowerCase()
    }
  })
  const kpiTokenAddresses = useMemo(() => {
    if (!pairCampaigns) return []
    return pairCampaigns.liquidityMiningCampaigns.flatMap(campaign =>
      campaign.rewards.map(reward => reward.token.address.toLowerCase())
    )
  }, [pairCampaigns])
  const { loading: loadingKpiTokens, kpiTokens } = useKpiTokens(kpiTokenAddresses)

  return useMemo(() => {
    if (singleSidedLoading || chainId === undefined || campaignLoading) {
      return { loading: true, miningCampaigns: { active: [], expired: [] } }
    }
    if (
      singleSidedCampaignsError ||
      campaignError ||
      !singleSidedCampaigns ||
      !singleSidedCampaigns.singleSidedStakingCampaigns ||
      !pairCampaigns ||
      !pairCampaigns.liquidityMiningCampaigns ||
      loadingKpiTokens
    ) {
      return { loading: true, miningCampaigns: { active: [], expired: [] } }
    }
    const expiredCampaigns = []
    const activeCampaigns = []
    for (let i = 0; i < pairCampaigns.liquidityMiningCampaigns.length; i++) {
      const campaign = pairCampaigns.liquidityMiningCampaigns[i]

      if (
        (pairAddress && campaign.stakablePair.id.toLowerCase() !== pairAddress) ||
        (dataFilter === PairsFilterType.MY && campaign.liquidityMiningPositions.length === 0)
      )
        continue

      const { reserveNativeCurrency, totalSupply, token0, token1, reserve0, reserve1 } = campaign.stakablePair
      const containsKpiToken = !!campaign.rewards.find(
        reward => !!kpiTokens.find(kpiToken => kpiToken.address.toLowerCase() === reward.token.address.toLowerCase())
      )
      const token0ChecksummedAddress = getAddress(token0.address)
      const token1ChecksummedAddress = getAddress(token1.address)

      const tokenA =
        tokensInCurrentChain &&
        tokensInCurrentChain[token0ChecksummedAddress] &&
        tokensInCurrentChain[token0ChecksummedAddress].token
          ? tokensInCurrentChain[token0ChecksummedAddress].token
          : new Token(chainId, token0ChecksummedAddress, parseInt(token0.decimals), token0.symbol, token0.name)
      const tokenAmountA = new TokenAmount(tokenA, parseUnits(reserve0, token0.decimals).toString())

      const tokenB =
        tokensInCurrentChain &&
        tokensInCurrentChain[token1ChecksummedAddress] &&
        tokensInCurrentChain[token1ChecksummedAddress].token
          ? tokensInCurrentChain[token1ChecksummedAddress].token
          : new Token(chainId, token1ChecksummedAddress, parseInt(token1.decimals), token1.symbol, token1.name)
      const tokenAmountB = new TokenAmount(tokenB, parseUnits(reserve1, token1.decimals).toString())
      const pair = new Pair(tokenAmountA, tokenAmountB)
      const liquditiyCampaign = toLiquidityMiningCampaign(
        chainId,
        pair,
        totalSupply,
        reserveNativeCurrency,
        kpiTokens,
        campaign,
        nativeCurrency
      )

      const hasStake = campaign.liquidityMiningPositions.length > 0
      const isExpired = parseInt(campaign.endsAt) < timestamp || parseInt(campaign.endsAt) > memoizedLowerTimeLimit

      if (dataFilter !== PairsFilterType.SWPR || SWPRToken.equals(tokenA) || SWPRToken.equals(tokenB)) {
        if (hasStake || liquditiyCampaign.currentlyActive || isUpcoming(campaign.startsAt)) {
          activeCampaigns.push({ campaign: liquditiyCampaign, staked: hasStake, containsKpiToken: containsKpiToken })
        } else if (isExpired) {
          expiredCampaigns.push({ campaign: liquditiyCampaign, staked: hasStake, containsKpiToken: containsKpiToken })
        }
      }
    }

    for (let i = 0; i < singleSidedCampaigns.singleSidedStakingCampaigns.length; i++) {
      const campaign = singleSidedCampaigns.singleSidedStakingCampaigns[i]

      if (
        (token0Address &&
          token1Address &&
          campaign.stakeToken.id.toLowerCase() !== token0Address &&
          campaign.stakeToken.id.toLowerCase() !== token1Address) ||
        (dataFilter === PairsFilterType.MY && campaign.singleSidedStakingPositions.length === 0)
      )
        continue
      const containsKpiToken = !!campaign.rewards.find(
        reward => !!kpiTokens.find(kpiToken => kpiToken.address.toLowerCase() === reward.token.address.toLowerCase())
      )
      const stakeToken = new Token(
        chainId,
        campaign.stakeToken.id,
        parseInt(campaign.stakeToken.decimals),
        campaign.stakeToken.symbol,
        campaign.stakeToken.name
      )
      const singleSidedStakeCampaign = toSingleSidedStakeCampaign(
        chainId,
        campaign,
        stakeToken,
        campaign.stakeToken.totalSupply,
        nativeCurrency,
        campaign.stakeToken.derivedNativeCurrency
      )
      const hasStake = campaign.singleSidedStakingPositions.length > 0
      const isExpired = parseInt(campaign.endsAt) < timestamp || parseInt(campaign.endsAt) > memoizedLowerTimeLimit

      if (dataFilter !== PairsFilterType.SWPR || SWPRToken.equals(stakeToken)) {
        if (hasStake || singleSidedStakeCampaign.currentlyActive || isUpcoming(singleSidedStakeCampaign.startsAt)) {
          activeCampaigns.unshift({
            campaign: singleSidedStakeCampaign,
            staked: hasStake,
            containsKpiToken: containsKpiToken
          })
        } else if (isExpired) {
          expiredCampaigns.unshift({
            campaign: singleSidedStakeCampaign,
            staked: hasStake,
            containsKpiToken: containsKpiToken
          })
        }
      }
    }

    const sortedActiveCampaigns = activeCampaigns.sort((a, b) => {
      if (a.campaign.ended && !b.campaign.ended) return -1
      if (!a.campaign.ended && b.campaign.ended) return 1

      if (a.staked && !b.staked) return -1
      if (!a.staked && b.staked) return 1

      if (
        a.campaign instanceof SingleSidedLiquidityMiningCampaign &&
        !(b.campaign instanceof SingleSidedLiquidityMiningCampaign)
      )
        return -1

      if (
        !(a.campaign instanceof SingleSidedLiquidityMiningCampaign) &&
        b.campaign instanceof SingleSidedLiquidityMiningCampaign
      )
        return 1

      // Active above upcoming
      if (a.campaign.currentlyActive && !b.campaign.currentlyActive) return -1
      if (!a.campaign.currentlyActive && b.campaign.currentlyActive) return 1

      // TV
      if (a.campaign.staked.nativeCurrencyAmount.greaterThan(b.campaign.staked.nativeCurrencyAmount)) return -1
      if (a.campaign.staked.nativeCurrencyAmount.lessThan(b.campaign.staked.nativeCurrencyAmount)) return 1

      if (a.campaign.apy > b.campaign.apy) return -1
      if (a.campaign.apy < b.campaign.apy) return 1

      return 0
    })

    const sortedExpiredCampaigns = expiredCampaigns.sort((a, b) => {
      if (a.campaign.endsAt > b.campaign.endsAt) return -1
      if (a.campaign.endsAt < b.campaign.endsAt) return 1

      if (a.campaign.staked.nativeCurrencyAmount.greaterThan(b.campaign.staked.nativeCurrencyAmount)) return -1
      if (a.campaign.staked.nativeCurrencyAmount.lessThan(b.campaign.staked.nativeCurrencyAmount)) return 1

      return 0
    })

    return {
      loading: false,
      miningCampaigns: { active: sortedActiveCampaigns, expired: sortedExpiredCampaigns }
    }
  }, [
    singleSidedLoading,
    chainId,
    campaignLoading,
    singleSidedCampaignsError,
    campaignError,
    singleSidedCampaigns,
    pairCampaigns,
    loadingKpiTokens,
    pairAddress,
    dataFilter,
    tokensInCurrentChain,
    kpiTokens,
    nativeCurrency,
    timestamp,
    memoizedLowerTimeLimit,
    SWPRToken,
    isUpcoming,
    token0Address,
    token1Address
  ])
}
