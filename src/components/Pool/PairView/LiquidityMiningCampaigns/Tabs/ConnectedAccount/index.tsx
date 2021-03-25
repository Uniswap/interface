import React from 'react'
import { Pair } from 'dxswap-sdk'
import List from '../../List'
import { useConnectedAccountLiquidityMiningCampaignsForPair } from '../../../../../../hooks/useConnectedAccountLiquidityMiningCampaignsForPair'

interface ActiveTabProps {
  pair: Pair
}

export default function ConnectedAccountTab({ pair }: ActiveTabProps) {
  const { loading, liquidityMiningCampaigns } = useConnectedAccountLiquidityMiningCampaignsForPair(pair)

  return <List loading={loading} stakablePair={pair} items={liquidityMiningCampaigns} />
}
