import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { useSelector } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import RegisterCampaignBg from 'assets/images/register-campaign-bg.png'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { AppState } from 'state'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useRegisterCampaignModalToggle } from 'state/application/hooks'
import { useSwapNowHandler } from 'state/campaigns/hooks'

const CustomModal = styled(Modal)`
  ${isMobile &&
  css`
    align-self: unset !important;
  `}
`

export default function ModalRegisterCampaign() {
  const isRegisterCampaignModalOpen = useModalOpen(ApplicationModal.REGISTER_CAMPAIGN)
  const toggleRegisterCampaignModal = useRegisterCampaignModalToggle()
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const handleSwapNow = useSwapNowHandler()

  return (
    <CustomModal
      isOpen={isRegisterCampaignModalOpen}
      onDismiss={toggleRegisterCampaignModal}
      maxHeight={70}
      maxWidth="calc(100vw - 32px)"
      width="fit-content"
      height="fit-content"
      bgColor="transparent"
    >
      <Flex justifyContent="center" width="100%">
        <RegisterCampaignBackground>
          <Title>
            <Trans>Success!</Trans>
          </Title>
          <Content>
            <Trans>You have successfully registered for this trading campaign. Start trading now and good luck!</Trans>
          </Content>
          <ResponsiveButtonPrimary
            maxWidth="69%"
            style={{ fontSize: '16px' }}
            onClick={() => {
              if (!selectedCampaign) return
              const firstChainId = Number(selectedCampaign.chainIds.split(',')[0]) as ChainId
              handleSwapNow(firstChainId)
              toggleRegisterCampaignModal()
            }}
          >
            <Trans>Swap Now</Trans>
          </ResponsiveButtonPrimary>
        </RegisterCampaignBackground>
      </Flex>
    </CustomModal>
  )
}

const RegisterCampaignBackground = styled.div`
  background-image: url(${RegisterCampaignBg});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 520px;
  height: 300px;
  max-width: calc(100vw - 32px);
  max-height: calc(50vw - 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 6px;
  `}
`

const Title = styled(Text)`
  color: ${({ theme }) => theme.white};
  font-weight: 500;
  font-size: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 18px;
  `}
`

const Content = styled(Text)`
  color: ${({ theme }) => theme.white};
  font-size: 16px;
  max-width: 69%;
  text-align: center;
  line-height: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
    line-height: 16px;
  `}
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  color: ${({ theme }) => theme.white};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 6px;
    padding: 6px;
    font-size: 18px;
  `}
`
