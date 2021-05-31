import React from 'react'
import { useTranslation } from 'react-i18next'

import Modal from 'components/Modal'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useFarmClaimModalToggle } from 'state/application/hooks'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import styled from 'styled-components'

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 2rem;
  width: 100%;
  text-align: center;
`

const Title = styled.div`
  margin-bottom: 2rem;
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-around;
`

const FarmClaimModal = () => {
  const { t } = useTranslation()
  const farmClaimModalOpen = useModalOpen(ApplicationModal.FARM_CLAIM)
  const toggleFarmClaimModal = useFarmClaimModalToggle()

  return (
    <Modal isOpen={farmClaimModalOpen} onDismiss={toggleFarmClaimModal} maxHeight="fit-content">
      <Wrapper>
        <Title>{t('claim')} KNC</Title>

        <ButtonGroup>
          <ButtonOutlined padding="8px 40px" width="fit-content" onClick={toggleFarmClaimModal}>
            {t('cancel')}
          </ButtonOutlined>
          <ButtonPrimary padding="8px 40px" width="fit-content">
            {t('claim')}
          </ButtonPrimary>
        </ButtonGroup>
      </Wrapper>
    </Modal>
  )
}

export default FarmClaimModal
