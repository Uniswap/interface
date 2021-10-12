import React from 'react'
import { ArrowRightCircle } from 'react-feather'
import styled from 'styled-components'
import { ButtonPrimary } from '../../../components/Button'
import Modal, { ModalProps } from '../../../components/Modal'
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

interface BridgingInitiatedModalProps extends ModalProps {
  amount: string
  assetType: string
  fromNetworkName: string
  toNetworkName: string
  heading: string
}

export const BridgingInitiatedModal = ({
  isOpen,
  onDismiss,
  amount,
  assetType,
  fromNetworkName,
  toNetworkName,
  heading
}: BridgingInitiatedModalProps) => (
  <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
    <Wrapper>
      <ArrowRightCircle strokeWidth={0.5} size={75} color="#0E9F6E" />
      <TitleWrapper>
        <TYPE.body fontSize="22px" fontWeight="500" color={'text1'}>
          {heading}
        </TYPE.body>
      </TitleWrapper>
      <TYPE.main mb="24px">
        {amount} {assetType} from {fromNetworkName} to {toNetworkName}
      </TYPE.main>
      <ButtonPrimary onClick={onDismiss}>Back to Bridge</ButtonPrimary>
    </Wrapper>
  </Modal>
)
