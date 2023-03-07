import Modal from '../Modal'
import TokenSafety, { TokenSafetyProps } from '.'

interface TokenSafetyModalProps extends TokenSafetyProps {
  isOpen: boolean
}

export default function TokenSafetyModal({
  isOpen,
  tokenAddress,
  secondTokenAddress,
  onContinue,
  onCancel,
  onBlocked,
  showCancel,
}: TokenSafetyModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onCancel}>
      <TokenSafety
        tokenAddress={tokenAddress}
        secondTokenAddress={secondTokenAddress}
        onContinue={onContinue}
        onBlocked={onBlocked}
        onCancel={onCancel}
        showCancel={showCancel}
      />
    </Modal>
  )
}
