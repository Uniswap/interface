/**
 * These actions are: Enter Now -> Swap Now -> Claim
 */
import { useSelector } from 'react-redux'

import { BIG_INT_ZERO } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTemporaryClaimedRefsManager from 'hooks/campaigns/useTemporaryClaimedRefsManager'
import CampaignButtonEnterNow from 'pages/Campaign/CampaignButtonEnterNow'
import CampaignButtonWithOptions from 'pages/Campaign/CampaignButtonWithOptions'
import { AppState } from 'state'
import { CampaignState } from 'state/campaigns/actions'

export default function CampaignActions() {
  const { account } = useActiveWeb3React()

  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const selectedCampaignLeaderboard = useSelector((state: AppState) => state.campaigns.selectedCampaignLeaderboard)

  const [temporaryClaimedRefs, addTemporaryClaimedRefs] = useTemporaryClaimedRefsManager()

  if (!selectedCampaign || !account || !selectedCampaignLeaderboard) return null

  if (selectedCampaign.status === 'Ongoing' && !selectedCampaignLeaderboard.isParticipated) {
    return <CampaignButtonEnterNow />
  }

  if (selectedCampaign.status === 'Upcoming') {
    return null
  }

  if (selectedCampaign.status === 'Ongoing') {
    return <CampaignButtonWithOptions campaign={selectedCampaign} type="swap_now" />
  }

  if (
    selectedCampaign.status === 'Ended' &&
    (selectedCampaign.campaignState === CampaignState.CampaignStateReady ||
      selectedCampaign.campaignState === CampaignState.CampaignStateFinalizedLeaderboard)
  ) {
    return <CampaignButtonWithOptions campaign={selectedCampaign} type="claim_rewards" disabled />
  }

  if (selectedCampaign.campaignState === CampaignState.CampaignStateDistributedRewards) {
    let isUserClaimedRewardsInThisCampaign = true
    if (selectedCampaignLeaderboard?.rewards?.length) {
      selectedCampaignLeaderboard.rewards.forEach(reward => {
        if (
          reward.rewardAmount.greaterThan(BIG_INT_ZERO) &&
          !reward.claimed &&
          !temporaryClaimedRefs.includes(reward.ref)
        ) {
          isUserClaimedRewardsInThisCampaign = false
        }
      })
    }
    return (
      <CampaignButtonWithOptions
        campaign={selectedCampaign}
        type="claim_rewards"
        disabled={isUserClaimedRewardsInThisCampaign}
        addTemporaryClaimedRefs={addTemporaryClaimedRefs}
      />
    )
  }

  return null
}
