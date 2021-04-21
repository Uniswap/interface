import { gql, useQuery } from '@apollo/client'
import { LiquidityMiningCampaign, Pair } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { usePairLiquidityTokenTotalSupply } from '../data/Reserves'
import { toLiquidityMiningCampaign } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'
import { usePairReserveNativeCurrency } from './usePairReserveNativeCurrency'

const QUERY = gql`
  query($pairId: ID, $timestamp: BigInt!, $lowerTimeLimit: BigInt!, $userId: ID) {
    liquidityMiningCampaigns(where: { stakablePair: $pairId, endsAt_gte: $lowerTimeLimit, endsAt_lt: $timestamp }) {
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
    liquidityMiningPositions(where: { stakedAmount_gt: 0, user: $userId }) {
      id
    }
  }
`

export function useExpiredLiquidityMiningCampaignsForPair(
  pair: Pair,
  lowerTimeLimit: Date
): { loading: boolean; wrappedCampaigns: { campaign: LiquidityMiningCampaign; staked: boolean }[] } {
  const { chainId, account } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(pair)
  const { loading: loadingReserveNativeCurrency, reserveNativeCurrency } = usePairReserveNativeCurrency(pair)
  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const memoizedLowerTimeLimit = useMemo(() => Math.floor(lowerTimeLimit.getTime() / 1000), [lowerTimeLimit])
  const { data, loading: loadingExpiredCampaigns, error } = useQuery<{
    liquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[]
    liquidityMiningPositions: { id: string }[]
  }>(QUERY, {
    variables: {
      pairId: pair.liquidityToken.address.toLowerCase(),
      timestamp,
      lowerTimeLimit: memoizedLowerTimeLimit,
      userId: account ? account.toLowerCase() : ''
    }
  })

  return useMemo(() => {
    if (loadingExpiredCampaigns || loadingReserveNativeCurrency) return { loading: true, wrappedCampaigns: [] }
    if (error || !data || !chainId || !lpTokenTotalSupply) return { loading: false, wrappedCampaigns: [] }
    const wrappedCampaigns = []
    for (let i = 0; i < data.liquidityMiningCampaigns.length; i++) {
      wrappedCampaigns.push({
        campaign: toLiquidityMiningCampaign(
          chainId,
          pair,
          lpTokenTotalSupply?.raw.toString(),
          reserveNativeCurrency.raw.toString(),
          data.liquidityMiningCampaigns[i],
          nativeCurrency
        ),
        staked: data.liquidityMiningPositions.length > 0
      })
    }

    return { loading: false, wrappedCampaigns }
  }, [
    chainId,
    data,
    error,
    loadingExpiredCampaigns,
    loadingReserveNativeCurrency,
    lpTokenTotalSupply,
    nativeCurrency,
    pair,
    reserveNativeCurrency.raw
  ])
}
