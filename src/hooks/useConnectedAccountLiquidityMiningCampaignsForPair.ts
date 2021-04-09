import { gql, useQuery } from '@apollo/client'
import { LiquidityMiningCampaign, Pair } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { usePairLiquidityTokenTotalSupply } from '../data/Reserves'
import { toLiquidityMiningCampaigns } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'
import { usePairReserveNativeCurrency } from './usePairReserveNativeCurrency'

const QUERY = gql`
  query($accountId: ID!, $pairId: ID!) {
    liquidityMiningPositions(where: { user: $accountId, stakedAmount_gt: 0, targetedPair: $pairId }) {
      liquidityMiningCampaign {
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
    }
  }
`

interface QueryResult {
  liquidityMiningPositions: {
    liquidityMiningCampaign: SubgraphLiquidityMiningCampaign
  }[]
}

export function useConnectedAccountLiquidityMiningCampaignsForPair(
  pair: Pair
): { loading: boolean; liquidityMiningCampaigns: LiquidityMiningCampaign[] } {
  const { chainId, account } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(pair)
  const { loading: loadingReserveNativeCurrency, reserveNativeCurrency } = usePairReserveNativeCurrency(pair)
  const { data, loading: loadingActiveCampaigns, error } = useQuery<QueryResult>(QUERY, {
    variables: { accountId: account?.toLowerCase(), pairId: pair.liquidityToken.address.toLowerCase() }
  })

  return useMemo(() => {
    if (!account) return { loading: false, liquidityMiningCampaigns: [] }
    if (loadingActiveCampaigns || loadingReserveNativeCurrency) return { loading: true, liquidityMiningCampaigns: [] }
    if (error || !data || !chainId || !lpTokenTotalSupply) return { loading: false, liquidityMiningCampaigns: [] }
    return {
      loading: false,
      liquidityMiningCampaigns: toLiquidityMiningCampaigns(
        chainId,
        pair,
        lpTokenTotalSupply?.raw.toString(),
        reserveNativeCurrency.raw.toString(),
        data.liquidityMiningPositions.map(position => position.liquidityMiningCampaign),
        nativeCurrency
      )
    }
  }, [
    account,
    chainId,
    data,
    error,
    loadingActiveCampaigns,
    loadingReserveNativeCurrency,
    lpTokenTotalSupply,
    nativeCurrency,
    pair,
    reserveNativeCurrency.raw
  ])
}
