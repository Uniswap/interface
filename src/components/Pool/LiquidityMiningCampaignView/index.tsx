import React from 'react'
import { LiquidityMiningCampaign } from 'dxswap-sdk'
import { DarkCard } from '../../Card'
import Information from './Information'
import StakeCard from './StakeCard'
import { AutoColumn } from '../../Column'

interface PairViewProps {
  campaign?: LiquidityMiningCampaign | null
}

function LiquidityMiningCampaignView({ campaign }: PairViewProps) {
  return (
    <DarkCard padding="32px">
      <AutoColumn gap="18px">
        <Information
          targetedPair={campaign?.targetedPair}
          stakingCap={campaign?.stakingCap}
          rewards={campaign?.rewards}
          remainingRewards={campaign?.remainingRewards}
          locked={campaign?.locked}
          startsAt={campaign ? parseInt(campaign.startsAt.toString()) : undefined}
          endsAt={campaign ? parseInt(campaign.endsAt.toString()) : undefined}
          apy={campaign?.apy}
          staked={campaign?.staked}
        />
        <StakeCard campaign={campaign || undefined} />
      </AutoColumn>
    </DarkCard>
  )
}

export default LiquidityMiningCampaignView
