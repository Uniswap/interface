import { gql, useQuery } from '@apollo/client'
import { LiquidityMiningCampaign, Pair } from '@swapr/sdk'
import { useMemo } from 'react'
import { DateTime, Duration } from 'luxon'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { usePairLiquidityTokenTotalSupply } from '../data/Reserves'
import { toLiquidityMiningCampaign } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'
import { usePairReserveNativeCurrency } from './usePairReserveNativeCurrency'
import { useKpiTokens } from './useKpiTokens'

const QUERY = gql`
  query($pairId: ID!, $timestamp: BigInt!, $userId: ID) {
    liquidityMiningCampaigns(where: { stakablePair: $pairId, endsAt_gt: $timestamp }) {
      address: id
      duration
      startsAt
      endsAt
      locked
      stakingCap
      rewards {
        token {
          derivedNativeCurrency
          address: id
          name
          symbol
          decimals
        }
        amount
      }
      stakedAmount
      liquidityMiningPositions(where: { stakedAmount_gt: 0, user: $userId }) {
        id
      }
    }
  }
`
const EXPIRED_QUERY = gql`
  query($pairId: ID, $timestamp: BigInt!, $lowerTimeLimit: BigInt!, $userId: ID) {
    liquidityMiningCampaigns(where: { stakablePair: $pairId, endsAt_gte: $lowerTimeLimit, endsAt_lt: $timestamp }) {
      address: id
      duration
      startsAt
      endsAt
      locked
      stakingCap
      rewards {
        token {
          derivedNativeCurrency
          address: id
          name
          symbol
          decimals
        }
        amount
      }
      stakedAmount
      liquidityMiningPositions(where: { stakedAmount_gt: 0, user: $userId }) {
        id
      }
    }
  }
`

interface ExtendedSubgraphLiquidityMiningCampaign extends SubgraphLiquidityMiningCampaign {
  liquidityMiningPositions: { id: string }[]
}

export function useLiquidityMiningCampaignsForPair(
  pair?: Pair,
  lowerTimeLimit: Date = DateTime.utc()
    .minus(Duration.fromObject({ days: 30 }))
    .toJSDate()
): {
  loading: boolean
  wrappedCampaigns: { campaign: LiquidityMiningCampaign; staked: boolean; containsKpiToken: boolean }[]
  expiredLoading: boolean
  expiredWrappedCampagins: { campaign: LiquidityMiningCampaign; staked: boolean; containsKpiToken: boolean }[]
} {
  const { chainId, account } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(pair)
  const { loading: loadingReserveNativeCurrency, reserveNativeCurrency } = usePairReserveNativeCurrency(pair)
  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const memoizedLowerTimeLimit = useMemo(() => Math.floor(lowerTimeLimit.getTime() / 1000), [lowerTimeLimit])
  const pairId = useMemo(() => (pair ? pair.liquidityToken.address.toLowerCase() : ''), [pair])
  const { data, loading: loadingActiveCampaigns, error } = useQuery<{
    liquidityMiningCampaigns: ExtendedSubgraphLiquidityMiningCampaign[]
  }>(QUERY, {
    variables: {
      pairId,
      timestamp,
      userId: account ? account.toLowerCase() : ''
    }
  })
  const { data: expiredData, loading: loadingExpiredCampaigns, error: expiredError } = useQuery<{
    liquidityMiningCampaigns: ExtendedSubgraphLiquidityMiningCampaign[]
  }>(EXPIRED_QUERY, {
    variables: {
      pairId,
      timestamp,
      lowerTimeLimit: memoizedLowerTimeLimit,
      userId: account ? account.toLowerCase() : ''
    }
  })

  const kpiTokenAddresses = useMemo(() => {
    if (!data) return []
    return data.liquidityMiningCampaigns.flatMap(campaign =>
      campaign.rewards.map(reward => reward.token.address.toLowerCase())
    )
  }, [data])
  const { loading: loadingKpiTokens, kpiTokens } = useKpiTokens(kpiTokenAddresses)

  return useMemo(() => {
    if (loadingActiveCampaigns || loadingReserveNativeCurrency || loadingExpiredCampaigns || loadingKpiTokens)
      return { loading: true, wrappedCampaigns: [], expiredLoading: true, expiredWrappedCampagins: [] }
    if (error || !data || !chainId || !lpTokenTotalSupply || !pair || expiredError || !expiredData || !kpiTokens)
      return { loading: false, wrappedCampaigns: [], expiredLoading: false, expiredWrappedCampagins: [] }
    const wrappedCampaigns = []
    for (let i = 0; i < data.liquidityMiningCampaigns.length; i++) {
      const campaign = data.liquidityMiningCampaigns[i]
      const containsKpiToken = !!campaign.rewards.find(
        reward => !!kpiTokens.find(kpiToken => kpiToken.address.toLowerCase() === reward.token.address.toLowerCase())
      )
      wrappedCampaigns.push({
        campaign: toLiquidityMiningCampaign(
          chainId,
          pair,
          lpTokenTotalSupply?.raw.toString(),
          reserveNativeCurrency.raw.toString(),
          kpiTokens,
          campaign,
          nativeCurrency
        ),
        staked: campaign.liquidityMiningPositions.length > 0,
        containsKpiToken
      })
    }
    const expiredWrappedCampaigns = []
    for (let i = 0; i < expiredData.liquidityMiningCampaigns.length; i++) {
      const campaign = expiredData.liquidityMiningCampaigns[i]
      const containsKpiToken = !!campaign.rewards.find(
        reward => !!kpiTokens.find(kpiToken => kpiToken.address.toLowerCase() === reward.token.address.toLowerCase())
      )
      const campaignObject = {
        campaign: toLiquidityMiningCampaign(
          chainId,
          pair,
          lpTokenTotalSupply?.raw.toString(),
          reserveNativeCurrency.raw.toString(),
          kpiTokens,
          campaign,
          nativeCurrency
        ),
        staked: campaign.liquidityMiningPositions.length > 0,
        containsKpiToken
      }
      expiredWrappedCampaigns.push(campaignObject)
      if (campaign.liquidityMiningPositions.length > 0) wrappedCampaigns.push(campaignObject)
    }
    return { loading: false, wrappedCampaigns, expiredLoading: false, expiredWrappedCampagins: expiredWrappedCampaigns }
  }, [
    chainId,
    data,
    error,
    expiredData,
    expiredError,
    kpiTokens,
    loadingActiveCampaigns,
    loadingExpiredCampaigns,
    loadingKpiTokens,
    loadingReserveNativeCurrency,
    lpTokenTotalSupply,
    nativeCurrency,
    pair,
    reserveNativeCurrency.raw
  ])
}
