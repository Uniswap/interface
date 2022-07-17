import React from 'react'
import { CampaignState } from 'state/campaigns/actions'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import CampaignButtonWithOptions from 'pages/Campaign/CampaignButtonWithOptions'

export default function EnterNowOrClaimButton() {
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const selectedCampaignLeaderboard = useSelector((state: AppState) => state.campaigns.selectedCampaignLeaderboard)

  if (!selectedCampaign) return null

  if (selectedCampaign.status === 'Upcoming') {
    return <CampaignButtonWithOptions campaign={selectedCampaign} type="enter_now" disabled />
  }

  if (selectedCampaign.status === 'Ongoing') {
    return <CampaignButtonWithOptions campaign={selectedCampaign} type="enter_now" />
  }

  if (
    selectedCampaign.status === 'Ended' &&
    (selectedCampaign.campaignState === CampaignState.CampaignStateReady ||
      selectedCampaign.campaignState === CampaignState.CampaignStateFinalizedLeaderboard)
  ) {
    return <CampaignButtonWithOptions campaign={selectedCampaign} type="claim_rewards" disabled />
  }

  if (selectedCampaign.campaignState === CampaignState.CampaignStateDistributedRewards) {
    let isUserClaimedRewardsInThisCampaign = false
    if (selectedCampaignLeaderboard?.rewards?.length) {
      selectedCampaignLeaderboard.rewards.forEach(reward => {
        if (!reward.claimed && reward.rewardAmount > 0) {
          isUserClaimedRewardsInThisCampaign = true
        }
      })
    }
    return (
      <CampaignButtonWithOptions
        campaign={selectedCampaign}
        type="claim_rewards"
        disabled={!isUserClaimedRewardsInThisCampaign}
      />
    )
  }

  return null
}
