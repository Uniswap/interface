import React from 'react'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary, ButtonSecondary } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'
import { Break } from './styled'

const ModalContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 20px;
`

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }
  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

interface RemoveFarmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function RemoveFarmModal({ isOpen, onClose, onConfirm }: RemoveFarmModalProps) {
  const { t } = useTranslation()

  const onDismiss = () => {
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={100}>
      <ModalContentWrapper>
        <AutoColumn gap="lg">
          <RowBetween style={{ padding: '0 2rem' }}>
            <div />
            <Text fontWeight={500} fontSize={20}>
              {t('AreYouSure')}
            </Text>
            <StyledCloseIcon onClick={() => onClose()} />
          </RowBetween>
          <Break />
          <AutoColumn gap="lg" style={{ padding: '0 2rem' }}>
            <Text fontWeight={400} fontSize={16} mb={'1rem'}>
              Selected Farm will be removed from your browser.
              <br />
              You can import it later whenever you want.
            </Text>
            <RowBetween>
              <ButtonSecondary mr="0.5rem" padding="18px" onClick={onDismiss}>{`${t('cancel')}`}</ButtonSecondary>
              <ButtonPrimary borderRadius="12px" onClick={onConfirm}>{`${t('continue')}`}</ButtonPrimary>
            </RowBetween>
          </AutoColumn>
        </AutoColumn>
      </ModalContentWrapper>
    </Modal>
  )
}
