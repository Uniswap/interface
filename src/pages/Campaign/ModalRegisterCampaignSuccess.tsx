import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useSelector } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import RegisterCampaignBg from 'assets/images/register-campaign-bg.png'
import { ButtonPrimary } from 'components/Button'
import { ModalCenter } from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useRegisterCampaignSuccessModalToggle } from 'state/application/hooks'
import { useSwapNowHandler } from 'state/campaigns/hooks'

export default function ModalRegisterCampaignSuccess() {
  const isRegisterCampaignSuccessModalOpen = useModalOpen(ApplicationModal.REGISTER_CAMPAIGN_SUCCESS)
  const toggleRegisterCampaignSuccessModal = useRegisterCampaignSuccessModalToggle()
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const handleSwapNow = useSwapNowHandler()
  const { chainId } = useActiveWeb3React()

  return (
    <ModalCenter
      isOpen={isRegisterCampaignSuccessModalOpen}
      onDismiss={toggleRegisterCampaignSuccessModal}
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
            style={{ fontSize: '14px' }}
            onClick={() => {
              if (!selectedCampaign) return
              const listChain: ChainId[] = selectedCampaign.chainIds.split(',').map(Number)
              handleSwapNow(listChain.includes(chainId) ? chainId : listChain[0])
              toggleRegisterCampaignSuccessModal()
            }}
          >
            <Trans>Swap Now</Trans>
          </ResponsiveButtonPrimary>
        </RegisterCampaignBackground>
      </Flex>
    </ModalCenter>
  )
}

const RegisterCampaignBackground = styled.div`
  background-image: url(${RegisterCampaignBg});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 512px;
  height: 286.5px;
  max-width: calc(100vw - 16px);
  aspect-ratio: 1 / 2;
  max-height: calc(50vw - 8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  box-shadow: 0 0 16px 1px #31cb9e;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 12px;
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
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 6px;
    padding: 6px;
    font-size: 18px;
  `}
`
