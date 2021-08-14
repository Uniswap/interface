import React from 'react'
import { PopupContent } from '../../state/application/actions'
import TransactionPopup from './TransactionPopup'

export default function PopupItem({ content }: { content: PopupContent }) {
  let popupContent
  if ('txn' in content) {
    popupContent = <TransactionPopup {...content.txn} />
  }

  return <>{popupContent}</>
}
