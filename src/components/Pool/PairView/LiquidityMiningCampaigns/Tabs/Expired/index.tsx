import React from 'react'
import { Pair } from 'dxswap-sdk'
import List from '../../List'
import { useExpiredLiquidityMiningCampaignsForPair } from '../../../../../../hooks/useExpiredLiquidityMiningCampaignsForPair'
import { DateTime, Duration } from 'luxon'

interface ExpiredTabProps {
  pair: Pair
}

export default function ExpiredTab({ pair }: ExpiredTabProps) {
  const { loading, wrappedCampaigns } = useExpiredLiquidityMiningCampaignsForPair(
    pair,
    DateTime.utc()
      .minus(Duration.fromObject({ days: 30 }))
      .toJSDate()
  )

  return <List loading={loading} stakablePair={pair} items={wrappedCampaigns} />
}
