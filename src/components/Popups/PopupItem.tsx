import React from 'react'
import { PopupContent } from '../../state/application/actions'
import TransactionPopup from './TransactionPopup'
import NewNetworkPopup from './NewNetworkPopup'

export default function PopupItem({ content }: { content: PopupContent }) {
  let popupContent
  const { txn, newNetworkChainId } = content
  if (txn) popupContent = <TransactionPopup hash={txn.hash} success={txn.success} summary={txn.summary} />
  else if (newNetworkChainId) popupContent = <NewNetworkPopup chainId={newNetworkChainId} />

  return <>{popupContent}</>
}
