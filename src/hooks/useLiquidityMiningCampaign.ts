import { LiquidityMiningCampaign, Pair } from '@swapr/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { usePairLiquidityTokenTotalSupply } from '../data/Reserves'
import { useNativeCurrency } from './useNativeCurrency'
import { usePairReserveNativeCurrency } from './usePairReserveNativeCurrency'
import { gql, useQuery } from '@apollo/client'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { useKpiTokens } from './useKpiTokens'
import { toLiquidityMiningCampaign } from '../utils/liquidityMining'

const QUERY = gql`
  query($id: ID) {
    liquidityMiningCampaign(id: $id) {
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
    }
  }
`

interface QueryResult {
  liquidityMiningCampaign: SubgraphLiquidityMiningCampaign
}

// the id is the campaign's smart contract address
export function useLiquidityMiningCampaign(
  targetedPair?: Pair,
  id?: string
): { loading: boolean; campaign: LiquidityMiningCampaign | null; containsKpiToken: boolean } {
  const { chainId } = useActiveWeb3React()
  const { loading, error, data } = useQuery<QueryResult>(QUERY, {
    variables: { id: id?.toLowerCase() || '' }
  })
  const nativeCurrency = useNativeCurrency()
  const rewardAddresses = useMemo(() => {
    if (!data || !data.liquidityMiningCampaign) return []
    return data.liquidityMiningCampaign.rewards.map(reward => reward.token.address.toLowerCase())
  }, [data])
  const { loading: loadingKpiTokens, kpiTokens } = useKpiTokens(rewardAddresses)
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(targetedPair)
  const { reserveNativeCurrency: targetedPairReserveNativeCurrency } = usePairReserveNativeCurrency(targetedPair)

  return useMemo(() => {
    if (loading || loadingKpiTokens || !chainId || !targetedPair || !lpTokenTotalSupply || loading || !kpiTokens)
      return { loading: true, campaign: null, containsKpiToken: false }
    if (error || !data) return { loading: false, campaign: null, containsKpiToken: false }
    return {
      loading: false,
      campaign: toLiquidityMiningCampaign(
        chainId,
        targetedPair,
        lpTokenTotalSupply.raw.toString(),
        targetedPairReserveNativeCurrency.raw.toString(),
        kpiTokens,
        data.liquidityMiningCampaign,
        nativeCurrency
      ),
      containsKpiToken: kpiTokens.length > 0
    }
  }, [
    chainId,
    data,
    error,
    kpiTokens,
    loading,
    loadingKpiTokens,
    lpTokenTotalSupply,
    nativeCurrency,
    targetedPair,
    targetedPairReserveNativeCurrency
  ])
}
