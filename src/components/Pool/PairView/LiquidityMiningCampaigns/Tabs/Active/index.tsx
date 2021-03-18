import React from 'react'
import { Pair } from 'dxswap-sdk'
import { useActiveLiquidityMiningCampaignsForPair } from '../../../../../../hooks/useActiveLiquidityMiningCampaignsForPair'
import List from '../../List'

interface ActiveTabProps {
  pair: Pair
}

export default function ActiveTab({ pair }: ActiveTabProps) {
  const { loading, liquidityMiningCampaigns } = useActiveLiquidityMiningCampaignsForPair(pair)

  return <List loading={loading} stakablePair={pair} items={liquidityMiningCampaigns} />
}
