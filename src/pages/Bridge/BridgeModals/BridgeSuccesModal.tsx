import React from 'react'
import { ArrowRightCircle } from 'react-feather'
import styled from 'styled-components'
import { ButtonSecondary } from '../../../components/Button'
import Modal from '../../../components/Modal'
import { TYPE } from '../../../theme'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 24px 12px 12px;
  background: #181920;
`

const TitleWrapper = styled.div`
  margin: 10px 0px;
`

const ButtonsWrapper = styled.div`
  width: 100%;
  margin-top: 24px;
`

const Button = styled(ButtonSecondary)`
  margin-top: 12px;
  font-weight: 500;
  font-size: 11px;
  line-height: 13px;
`

interface BridgeSuccessModalProps {
  isOpen: boolean
  heading: string
  text: string
  onDismiss: () => void
  onTradeButtonClick: () => void
  onBackButtonClick: () => void
}

export const BridgeSuccessModal = ({ isOpen, onDismiss, heading, text }: BridgeSuccessModalProps) => {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <Wrapper>
        <ArrowRightCircle strokeWidth={0.5} size={75} color="#0E9F6E" />
        <TitleWrapper>
          <TYPE.body fontSize="22px" fontWeight="500" color={'text1'}>
            {heading}
          </TYPE.body>
        </TitleWrapper>
        <TYPE.main>{text}</TYPE.main>
        <ButtonsWrapper>
          <Button onClick={onDismiss}>Back to bridge</Button>
        </ButtonsWrapper>
      </Wrapper>
    </Modal>
  )
}
