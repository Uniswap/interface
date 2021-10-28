import React from 'react'
import { ArrowRightCircle } from 'react-feather'
import { ButtonPrimary, ButtonSecondary } from '../../../components/Button'
import Modal from '../../../components/Modal'
import { TYPE } from '../../../theme'
import { BridgingInitiatedModalProps, TitleWrapper, Wrapper } from './BridgingInitiatedModal'

interface BridgeDisclaimerModalProps extends BridgingInitiatedModalProps {
  onConfirm: () => void
  disclaimerText: string
}

export const BridgeDisclaimerModal = ({
  isOpen,
  onConfirm,
  onDismiss,
  amount,
  assetType,
  fromNetworkName,
  toNetworkName,
  heading,
  disclaimerText
}: BridgeDisclaimerModalProps) => (
  <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
    <Wrapper>
      <ArrowRightCircle strokeWidth={0.5} size={75} color="#0E9F6E" />
      <TitleWrapper>
        <TYPE.body fontSize="22px" fontWeight="500" color="text1" textAlign="center">
          {heading} {amount} {assetType}
        </TYPE.body>
      </TitleWrapper>
      <TYPE.main mb="16px" fontSize="16px" fontWeight="600" color="#EBE9F8" textAlign="center" lineHeight="1.6">
        You are about to {heading} {amount} {assetType} from <br /> {fromNetworkName} to {toNetworkName}
      </TYPE.main>
      <TYPE.small mb="24px" textAlign="center" fontSize="14px" lineHeight="1.6">
        {disclaimerText}
        Would you like to proceed?
      </TYPE.small>
      <ButtonPrimary mb="12px" onClick={onConfirm}>
        CONFIRM
      </ButtonPrimary>
      <ButtonSecondary onClick={onDismiss}>CANCEL</ButtonSecondary>
    </Wrapper>
  </Modal>
)
