import Modal from '../Modal'
import TokenSafety from '.'

interface TokenSafetyModalProps {
  isOpen: boolean
  tokenAddress: string | null
  secondTokenAddress?: string
  onContinue: () => void
  onCancel: () => void
  showCancel?: boolean
}

export default function TokenSafetyModal({
  isOpen,
  tokenAddress,
  secondTokenAddress,
  onContinue,
  onCancel,
  showCancel,
}: TokenSafetyModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onCancel}>
      <TokenSafety
        tokenAddress={tokenAddress}
        secondTokenAddress={secondTokenAddress}
        onCancel={onCancel}
        onContinue={onContinue}
        showCancel={showCancel}
      />
    </Modal>
  )
}
