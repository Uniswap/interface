import { Currency } from '@ubeswap/sdk-core'
import { memo, useCallback } from 'react'

import { useWindowSize } from '../../hooks/useWindowSize'
import Modal from '../Modal'
import { CurrencySelect } from './CurrencySelect'

interface CurrencySelectModalProps {
  isOpen: boolean
  currencies: Maybe<Currency>[]
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCurrencyAmount?: boolean
}

export default memo(function CurrencySelectModal({
  isOpen,
  currencies,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCurrencyAmount = true,
}: CurrencySelectModalProps) {
  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  const { height: windowHeight } = useWindowSize()
  // change min height if not searching
  let modalHeight: number | undefined = 80

  if (windowHeight) {
    // Converts pixel units to vh for Modal component
    modalHeight = Math.min(Math.round((680 / windowHeight) * 100), 80)
  }
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} height={modalHeight}>
      <CurrencySelect
        isOpen={isOpen}
        currencies={currencies}
        onDismiss={onDismiss}
        onCurrencySelect={handleCurrencySelect}
        selectedCurrency={selectedCurrency}
        otherSelectedCurrency={otherSelectedCurrency}
        showCurrencyAmount={showCurrencyAmount}
      />
    </Modal>
  )
})
