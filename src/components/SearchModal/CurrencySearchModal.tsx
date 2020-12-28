import { Currency, Token } from '@uniswap/sdk'
import React, { useCallback, useEffect, useState } from 'react'
import ReactGA from 'react-ga'
import useLast from '../../hooks/useLast'
import Modal from '../Modal'
import { CurrencySearch } from './CurrencySearch'
import { ListSelect } from './ListSelect'
import ManageLocal from './ManageLocal'
import { Import } from './Import'
import usePrevious from 'hooks/usePrevious'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
}

export enum CurrencyModalView {
  search,
  listManage,
  tokenManage,
  import
}

export default function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases = false
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.search)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.search)
    }
  }, [isOpen, lastOpen])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  const handleClickBack = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Back'
    })
    setModalView(CurrencyModalView.search)
  }, [])

  const showManageListView = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Change Lists'
    })
    setModalView(CurrencyModalView.listManage)
  }, [])

  // for token import view
  const prevView = usePrevious(modalView)

  const [importToken, setImportToken] = useState<Token | undefined>()

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxHeight={80}
      minHeight={modalView === CurrencyModalView.listManage ? 40 : 80}
    >
      {modalView === CurrencyModalView.listManage ? (
        <ListSelect onDismiss={onDismiss} onBack={handleClickBack} />
      ) : modalView === CurrencyModalView.search ? (
        <CurrencySearch
          isOpen={isOpen}
          onDismiss={onDismiss}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={selectedCurrency}
          otherSelectedCurrency={otherSelectedCurrency}
          showCommonBases={showCommonBases}
          showManageListView={showManageListView}
          showManageTokensView={() => setModalView(CurrencyModalView.tokenManage)}
          showImportView={() => setModalView(CurrencyModalView.import)}
          setImportToken={setImportToken}
        />
      ) : modalView === CurrencyModalView.tokenManage ? (
        <ManageLocal
          onBack={() => setModalView(CurrencyModalView.search)}
          onDismiss={onDismiss}
          showImportView={() => setModalView(CurrencyModalView.import)}
          setImportToken={setImportToken}
        />
      ) : (
        modalView === CurrencyModalView.import &&
        importToken && (
          <Import
            token={importToken}
            onBack={() => setModalView(prevView ?? CurrencyModalView.search)}
            handleCurrencySelect={handleCurrencySelect}
          />
        )
      )}
    </Modal>
  )
}
