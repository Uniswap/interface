// import { Currency, Token } from '@uniswap/sdk-core'
// import { TokenList } from '@uniswap/token-lists'
// import usePrevious from 'hooks/usePrevious'
import { useEffect, useState } from 'react'

import Modal from '../../components/Modal'
import useLast from '../../hooks/useLast'

interface ExploreTokenWarningModalProps {
  isOpen: boolean
  onProceed: () => void
  onCancel: () => void
}

export enum CurrencyModalView {
  search,
  manage,
  importToken,
  importList,
}

export default function ExploreTokenWarningModal({ isOpen, onProceed, onCancel }: ExploreTokenWarningModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.manage)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.search)
    }
  }, [isOpen, lastOpen])

  // change min height if not searching
  const minHeight = modalView === CurrencyModalView.importToken || modalView === CurrencyModalView.importList ? 40 : 80

  return (
    <Modal isOpen={isOpen} onDismiss={onCancel} maxHeight={80} minHeight={minHeight}>
      <div>hey</div>
    </Modal>
  )
}
