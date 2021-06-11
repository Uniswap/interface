import { Pair } from 'dxswap-sdk'
import React, { useCallback } from 'react'
import Modal from '../Modal'
import { PairSearch } from './PairSearch'

interface PairSearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedPair?: Pair | null
  onPairSelect: (pair: Pair) => void
  filterPairs?: (pair: Pair) => boolean
}

export default function PairSearchModal({
  isOpen,
  onDismiss,
  onPairSelect,
  selectedPair,
  filterPairs
}: PairSearchModalProps) {
  const handlePairSelect = useCallback(
    (pair: Pair) => {
      onPairSelect(pair)
      onDismiss()
    },
    [onDismiss, onPairSelect]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={60} minHeight={60}>
      <PairSearch
        isOpen={isOpen}
        onDismiss={onDismiss}
        onPairSelect={handlePairSelect}
        selectedPair={selectedPair}
        filterPairs={filterPairs}
      />
    </Modal>
  )
}
