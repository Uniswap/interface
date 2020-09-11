import { Currency } from 'swap-sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { selectList } from '../../state/lists/actions'
import { AppDispatch } from '../../state'
import { DEFAULT_TOKEN_LIST_URL } from '../../constants/lists'

import useLast from '../../hooks/useLast'
import Modal from '../Modal'
import { CurrencySearch } from './CurrencySearch'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
}

export default function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases = false
}: CurrencySearchModalProps) {
  const [listView, setListView] = useState<boolean>(false)
  const dispatch = useDispatch<AppDispatch>()
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (dispatch && selectList && isOpen && !lastOpen) {
      dispatch(selectList(DEFAULT_TOKEN_LIST_URL))
      setListView(false)
    }
  }, [dispatch, selectList, isOpen, lastOpen])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} minHeight={listView ? 40 : 80}>
      <CurrencySearch
        isOpen={isOpen}
        onDismiss={onDismiss}
        onCurrencySelect={handleCurrencySelect}
        selectedCurrency={selectedCurrency}
        otherSelectedCurrency={otherSelectedCurrency}
        showCommonBases={showCommonBases}
      />
    </Modal>
  )
}
