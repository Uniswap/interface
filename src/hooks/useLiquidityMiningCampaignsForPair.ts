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
  wrappedCampaigns: { campaign: LiquidityMiningCampaign; staked: boolean }[]
  expiredLoading: boolean
  expiredWrappedCampagins: { campaign: LiquidityMiningCampaign; staked: boolean }[]
} {
  const { chainId, account } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(pair)
  const { loading: loadingReserveNativeCurrency, reserveNativeCurrency } = usePairReserveNativeCurrency(pair)
  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const memoizedLowerTimeLimit = useMemo(() => Math.floor(lowerTimeLimit.getTime() / 1000), [lowerTimeLimit])
  const { data, loading: loadingActiveCampaigns, error } = useQuery<{
    liquidityMiningCampaigns: ExtendedSubgraphLiquidityMiningCampaign[]
  }>(QUERY, {
    variables: {
      pairId: pair ? pair.liquidityToken.address.toLowerCase() : '',
      timestamp,
      userId: account ? account.toLowerCase() : ''
    }
  })
  const { data: expiredData, loading: loadingExpiredCampaigns, error: expiredError } = useQuery<{
    liquidityMiningCampaigns: ExtendedSubgraphLiquidityMiningCampaign[]
  }>(EXPIRED_QUERY, {
    variables: {
      pairId: pair ? pair.liquidityToken.address.toLowerCase() : '',
      timestamp,
      lowerTimeLimit: memoizedLowerTimeLimit,
      userId: account ? account.toLowerCase() : ''
    }
  })

  return useMemo(() => {
    if (loadingActiveCampaigns || loadingReserveNativeCurrency || loadingExpiredCampaigns)
      return { loading: true, wrappedCampaigns: [], expiredLoading: true, expiredWrappedCampagins: [] }
    if (error || !data || !chainId || !lpTokenTotalSupply || !pair || expiredError || !expiredData)
      return { loading: false, wrappedCampaigns: [], expiredLoading: false, expiredWrappedCampagins: [] }
    const wrappedCampaigns = []
    for (let i = 0; i < data.liquidityMiningCampaigns.length; i++) {
      const campaign = data.liquidityMiningCampaigns[i]
      wrappedCampaigns.push({
        campaign: toLiquidityMiningCampaign(
          chainId,
          pair,
          lpTokenTotalSupply?.raw.toString(),
          reserveNativeCurrency.raw.toString(),
          campaign,
          nativeCurrency
        ),
        staked: campaign.liquidityMiningPositions.length > 0
      })
    }
    const expiredWrappedCampaigns = []
    for (let i = 0; i < expiredData.liquidityMiningCampaigns.length; i++) {
      const campaign = expiredData.liquidityMiningCampaigns[i]
      const campaignObject = {
        campaign: toLiquidityMiningCampaign(
          chainId,
          pair,
          lpTokenTotalSupply?.raw.toString(),
          reserveNativeCurrency.raw.toString(),
          campaign,
          nativeCurrency
        ),
        staked: campaign.liquidityMiningPositions.length > 0
      }
      expiredWrappedCampaigns.push(campaignObject)
      if (campaign.liquidityMiningPositions.length > 0) wrappedCampaigns.push(campaignObject)
    }
    return { loading: false, wrappedCampaigns, expiredLoading: false, expiredWrappedCampagins: expiredWrappedCampaigns }
  }, [
    chainId,
    data,
    expiredData,
    loadingExpiredCampaigns,
    expiredError,
    error,
    loadingActiveCampaigns,
    loadingReserveNativeCurrency,
    lpTokenTotalSupply,
    nativeCurrency,
    pair,
    reserveNativeCurrency
  ])
}
