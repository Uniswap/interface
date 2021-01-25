import { Pair } from 'dxswap-sdk'
import React, { useCallback } from 'react'
import Modal from '../Modal'
import { PairSearch } from './PairSearch'

interface PairSearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedPair?: Pair | null
  onPairSelect: (pair: Pair) => void
}

export default function PairSearchModal({ isOpen, onDismiss, onPairSelect, selectedPair }: PairSearchModalProps) {
  const handlePairSelect = useCallback(
    (pair: Pair) => {
      onPairSelect(pair)
      onDismiss()
    },
    [onDismiss, onPairSelect]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <PairSearch isOpen={isOpen} onDismiss={onDismiss} onPairSelect={handlePairSelect} selectedPair={selectedPair} />
    </Modal>
  )
}
