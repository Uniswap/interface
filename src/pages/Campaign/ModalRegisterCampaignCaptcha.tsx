import { Trans } from '@lingui/macro'
import axios from 'axios'
import { createRef, memo, useCallback } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { Flex } from 'rebass'
import { mutate } from 'swr'

import { ModalCenter } from 'components/Modal'
import { GOOGLE_RECAPTCHA_KEY } from 'constants/env'
import { CAMPAIGN_BASE_URL, SWR_KEYS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import {
  useModalOpen,
  useRegisterCampaignCaptchaModalToggle,
  useRegisterCampaignSuccessModalToggle,
} from 'state/application/hooks'
import { useRecaptchaCampaignManager } from 'state/campaigns/hooks'

import { Content, RegisterCampaignBackground } from './ModalRegisterCampaignSuccess'

const ModalRegisterCampaignCaptcha = () => {
  const recaptchaRef = createRef<ReCAPTCHA>()

  const isRegisterCampaignCaptchaModalOpen = useModalOpen(ApplicationModal.REGISTER_CAMPAIGN_CAPTCHA)
  const toggleRegisterCampaignCaptchaModal = useRegisterCampaignCaptchaModalToggle()
  const toggleRegisterCampaignSuccessModal = useRegisterCampaignSuccessModalToggle()
  const [recaptchaCampaign, updateRecaptchaCampaignId, updateRecaptchaCampaignLoading] = useRecaptchaCampaignManager()

  const { account } = useActiveWeb3React()

  // Create an event handler, so you can call the verification on button click event or form submit
  const handleReCaptchaVerify = useCallback(async () => {
    if (!recaptchaCampaign.id || !account) return

    if (typeof recaptchaRef === 'function') {
      console.log("recaptchaRef is a function? Something's wrong.")
      return
    }

    if (!recaptchaRef || !recaptchaRef.current) {
      console.log('Execute recaptcha not yet available')
      return
    }

    try {
      updateRecaptchaCampaignLoading(true)
      const token = await recaptchaRef.current.getValue()
      await new Promise(r => setTimeout(r, 750))
      toggleRegisterCampaignCaptchaModal()
      const response = await axios({
        method: 'POST',
        url: `${CAMPAIGN_BASE_URL}/${recaptchaCampaign.id}/participants`,
        data: {
          token,
          address: account,
        },
      })
      if (response.status === 200) {
        await mutate([SWR_KEYS.getListCampaign, account])
        toggleRegisterCampaignSuccessModal()
      }
    } catch (err) {
      console.error(err)
    } finally {
      updateRecaptchaCampaignLoading(false)
      updateRecaptchaCampaignId(undefined)
    }
  }, [
    account,
    recaptchaCampaign.id,
    recaptchaRef,
    toggleRegisterCampaignCaptchaModal,
    toggleRegisterCampaignSuccessModal,
    updateRecaptchaCampaignId,
    updateRecaptchaCampaignLoading,
  ])

  return (
    <ModalCenter
      isOpen={isRegisterCampaignCaptchaModalOpen}
      onDismiss={() => {
        toggleRegisterCampaignCaptchaModal()
        updateRecaptchaCampaignId(undefined)
      }}
      maxWidth="calc(100vw - 32px)"
      width="fit-content"
      height="fit-content"
      bgColor="transparent"
    >
      <Flex justifyContent="center" width="100%" p="0">
        <RegisterCampaignBackground>
          <Content>
            <Trans>To continue, check the box below to verify and proceed</Trans>
          </Content>
          <ReCAPTCHA
            ref={recaptchaRef}
            size="normal"
            sitekey={GOOGLE_RECAPTCHA_KEY}
            onChange={handleReCaptchaVerify}
            style={{ minHeight: '78px' }}
          />
        </RegisterCampaignBackground>
      </Flex>
    </ModalCenter>
  )
}

export default memo(ModalRegisterCampaignCaptcha)
