import Modal from 'components/Modal'
import TokenSafety, { TokenSafetyProps } from '.'

interface TokenSafetyModalProps extends TokenSafetyProps {
  isOpen: boolean
}

export default function TokenSafetyModal({
  isOpen,
  token0,
  token1,
  onContinue,
  onCancel,
  onBlocked,
  showCancel,
}: TokenSafetyModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onCancel} maxHeight={400}>
      <TokenSafety
        token0={token0}
        token1={token1}
        onContinue={onContinue}
        onBlocked={onBlocked}
        onCancel={onCancel}
        showCancel={showCancel}
      />
    </Modal>
  )
}
