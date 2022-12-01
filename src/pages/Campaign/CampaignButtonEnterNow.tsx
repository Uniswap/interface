import { Trans } from '@lingui/macro'
import React from 'react'

import { Dots } from 'components/swapv2/styleds'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { StyledPrimaryButton } from 'pages/Campaign/CampaignButtonWithOptions'
import { useRegisterCampaignCaptchaModalToggle } from 'state/application/hooks'
import { CampaignData } from 'state/campaigns/actions'
import { useRecaptchaCampaignManager } from 'state/campaigns/hooks'

interface CampaignButtonEnterNowProps {
  size: 'small' | 'large'
  campaign?: CampaignData
}

export default function CampaignButtonEnterNow({ size, campaign }: CampaignButtonEnterNowProps) {
  const [recaptchaCampaign, updateRecaptchaCampaignId] = useRecaptchaCampaignManager()
  const toggleRegisterCampaignCaptchaModal = useRegisterCampaignCaptchaModalToggle()
  const { mixpanelHandler } = useMixpanel()

  const isVerifyingToken = campaign && campaign.id === recaptchaCampaign.id && recaptchaCampaign.loading

  if (campaign === undefined) return null

  return (
    <>
      <StyledPrimaryButton
        disabled={isVerifyingToken}
        size={size}
        onClick={e => {
          e.stopPropagation()
          mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_ENTER_NOW_CLICKED, { campaign_name: campaign?.name })
          updateRecaptchaCampaignId(campaign.id)
          toggleRegisterCampaignCaptchaModal()
        }}
      >
        <Trans>Enter Now</Trans>
        {isVerifyingToken && <Dots />}
      </StyledPrimaryButton>
    </>
  )
}
