import { Currency, Token } from '@swapr/sdk'
import { TokenList } from '@uniswap/token-lists'
import React, { useCallback, useEffect, useState } from 'react'
import useLast from '../../hooks/useLast'
import usePrevious from '../../hooks/usePrevious'
import { WrappedTokenInfo } from '../../state/lists/wrapped-token-info'
import Modal from '../Modal'
import { CurrencySearch } from './CurrencySearch'
import { ImportList } from './ImportList'
import { ImportToken } from './ImportToken'
import Manage from './Manage'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showNativeCurrency?: boolean
}

export enum CurrencyModalView {
  SEARCH,
  MANAGE,
  IMPORT_TOKEN,
  IMPORT_LIST
}

export default function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases = false,
  showNativeCurrency = true
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.MANAGE)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.SEARCH)
    }
  }, [isOpen, lastOpen])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // for token import view
  const prevView = usePrevious(modalView)

  // used for import token flow
  const [importToken, setImportToken] = useState<Token | undefined>()

  // used for import list
  const [importList, setImportList] = useState<TokenList | undefined>()
  const [listURL, setListUrl] = useState<string | undefined>()

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxHeight={60}
      minHeight={
        modalView === CurrencyModalView.IMPORT_TOKEN || modalView === CurrencyModalView.IMPORT_LIST ? undefined : 60
      }
    >
      {modalView === CurrencyModalView.SEARCH ? (
        <CurrencySearch
          isOpen={isOpen}
          onDismiss={onDismiss}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={selectedCurrency}
          otherSelectedCurrency={otherSelectedCurrency}
          showCommonBases={showCommonBases}
          showImportView={() => setModalView(CurrencyModalView.IMPORT_TOKEN)}
          setImportToken={setImportToken}
          showManageView={() => setModalView(CurrencyModalView.MANAGE)}
          showNativeCurrency={showNativeCurrency}
        />
      ) : modalView === CurrencyModalView.IMPORT_TOKEN && importToken ? (
        <ImportToken
          tokens={[importToken]}
          onDismiss={onDismiss}
          list={importToken instanceof WrappedTokenInfo ? importToken.list : undefined}
          onBack={() =>
            setModalView(prevView && prevView !== CurrencyModalView.IMPORT_TOKEN ? prevView : CurrencyModalView.SEARCH)
          }
          handleCurrencySelect={handleCurrencySelect}
        />
      ) : modalView === CurrencyModalView.IMPORT_LIST && importList && listURL ? (
        <ImportList
          list={importList}
          listURI={listURL}
          onDismiss={onDismiss}
          setModalView={setModalView}
          onBack={() =>
            setModalView(prevView && prevView !== CurrencyModalView.IMPORT_LIST ? prevView : CurrencyModalView.MANAGE)
          }
        />
      ) : modalView === CurrencyModalView.MANAGE ? (
        <Manage
          onDismiss={onDismiss}
          setModalView={setModalView}
          setImportToken={setImportToken}
          setImportList={setImportList}
          setListUrl={setListUrl}
        />
      ) : (
        ''
      )}
    </Modal>
  )
}
