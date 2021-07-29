import React from 'react'
import { PopupContent } from '../../state/application/actions'
import TransactionPopup from './TransactionPopup'
import NewNetworkPopup from './NewNetworkPopup'

export default function PopupItem({ content }: { content: PopupContent }) {
  let popupContent
  if ('txn' in content) {
    popupContent = <TransactionPopup {...content.txn} />
  } else if ('newNetworkChainId' in content) {
    const { newNetworkChainId } = content
    popupContent = <NewNetworkPopup chainId={newNetworkChainId} />
  }

  return <>{popupContent}</>
}
