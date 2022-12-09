import { useCallback } from 'react'

import Modal from 'components/Modal'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import CurrencySearchBridge from './CurrencySearchBridge'

interface CurrencySearchModalBridgeProps {
  isOpen: boolean
  isOutput: boolean
  onDismiss: () => void
  onCurrencySelect: (currency: WrappedTokenInfo) => void
}

export default function CurrencySearchModalBridge({
  isOpen,
  isOutput,
  onDismiss,
  onCurrencySelect,
}: CurrencySearchModalBridgeProps) {
  const handleCurrencySelect = useCallback(
    (currency: WrappedTokenInfo) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect],
  )

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      margin="auto"
      maxHeight={80}
      height={isOutput ? undefined : '95vh'}
      minHeight={isOutput ? undefined : 80}
    >
      <CurrencySearchBridge
        isOutput={isOutput}
        isOpen={isOpen}
        onDismiss={onDismiss}
        onCurrencySelect={handleCurrencySelect}
      />
    </Modal>
  )
}
