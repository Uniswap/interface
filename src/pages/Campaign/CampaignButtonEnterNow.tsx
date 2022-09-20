import { Trans } from '@lingui/macro'
import React from 'react'

import { Dots } from 'components/swapv2/styleds'
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

  const isVerifyingToken = campaign && campaign.id === recaptchaCampaign.id && recaptchaCampaign.loading

  if (campaign === undefined) return null

  return (
    <>
      <StyledPrimaryButton
        disabled={isVerifyingToken}
        size={size}
        onClick={e => {
          e.stopPropagation()
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
