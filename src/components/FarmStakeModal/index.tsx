import React from 'react'
import { useTranslation } from 'react-i18next'

import Modal from 'components/Modal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useFarmStakeModalToggle } from 'state/application/hooks'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import styled from 'styled-components'

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 2rem;
  width: 100%;
  text-align: center;
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-around;
`

const FarmStakeModal = () => {
  const { t } = useTranslation()
  const farmStakeModalOpen = useModalOpen(ApplicationModal.FARM_STAKE)
  const toggleFarmStakeModal = useFarmStakeModalToggle()

  return (
    <Modal isOpen={farmStakeModalOpen} onDismiss={toggleFarmStakeModal} maxHeight="fit-content">
      <Wrapper>
        <ButtonGroup>
          <ButtonOutlined padding="8px 40px" width="fit-content" onClick={toggleFarmStakeModal}>
            {t('cancel')}
          </ButtonOutlined>
          <ButtonPrimary padding="8px 40px" width="fit-content">
            {t('stake')}
          </ButtonPrimary>
        </ButtonGroup>
      </Wrapper>
    </Modal>
  )
}

export default FarmStakeModal
