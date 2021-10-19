import React from 'react'
import Modal, { ModalProps } from '../../../components/Modal'
import { DisclaimerContent } from '../../../components/TransactionConfirmationModal'

interface BridgeDisclaimerModalProps extends ModalProps {
  msg: string
}

export const BridgeDisclaimerModal = ({ isOpen, onDismiss, msg }: BridgeDisclaimerModalProps) => (
  <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
    <DisclaimerContent onDismiss={onDismiss} message={msg} />
  </Modal>
)
