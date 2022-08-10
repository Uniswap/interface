import Modal from '../Modal'
import TokenSafety from '.'

interface TokenSafetyModalProps {
  isOpen: boolean
  tokenAddress: string | null
  secondTokenAddress?: string
  onContinue: () => void
  onCancel: () => void
}

export default function TokenSafetyModal({
  isOpen,
  tokenAddress,
  secondTokenAddress,
  onContinue,
  onCancel,
}: TokenSafetyModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onCancel}>
      <TokenSafety
        tokenAddress={tokenAddress}
        secondTokenAddress={secondTokenAddress}
        onCancel={onCancel}
        onContinue={onContinue}
      />
    </Modal>
  )
}
