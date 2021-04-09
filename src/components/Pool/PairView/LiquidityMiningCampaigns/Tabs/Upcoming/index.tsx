import React from 'react'
import { Pair } from 'dxswap-sdk'
import { useUpcomingLiquidityMiningCampaignsForPair } from '../../../../../../hooks/useUpcomingLiquidityMiningCampaignsForPair'
import List from '../../List'

interface UpcomingTabProps {
  pair: Pair
}

export default function UpcomingTab({ pair }: UpcomingTabProps) {
  const { loading, liquidityMiningCampaigns } = useUpcomingLiquidityMiningCampaignsForPair(pair)

  return <List loading={loading} stakablePair={pair} items={liquidityMiningCampaigns} />
}
