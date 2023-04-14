import { useEffect } from 'react'
import { X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import { useRemovePopup } from '../../state/application/hooks'
import { PopupContent } from '../../state/application/reducer'
import FailedNetworkSwitchPopup from './FailedNetworkSwitchPopup'
import TransactionPopup from './TransactionPopup'

const StyledClose = styled(X)<{ isTransactionPopup: boolean }>`
  position: absolute;
  right: ${({ isTransactionPopup }) => (isTransactionPopup ? '16px' : '20px')};
  top: ${({ isTransactionPopup }) => (isTransactionPopup ? '16px' : '20px')};

  :hover {
    cursor: pointer;
  }
`
const Popup = styled.div<{ isTransactionPopup: boolean; show: boolean }>`
  display: inline-block;
  width: 100%;
  visibility: ${({ show }) => (show ? 'visible' : 'hidden')};
  background-color: ${({ theme }) => theme.backgroundSurface};
  position: relative;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  padding: ${({ isTransactionPopup }) => (!isTransactionPopup ? '20px 35px 20px 20px' : '2px 0px')};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.deepShadow};
  transition: ${({ theme }) => `visibility ${theme.transition.duration.fast} ease-in-out`};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    min-width: 290px;
    &:not(:last-of-type) {
      margin-right: 20px;
    }
  `}
`

export default function PopupItem({
  removeAfterMs,
  content,
  popKey,
}: {
  removeAfterMs: number | null
  content: PopupContent
  popKey: string
}) {
  const removePopup = useRemovePopup()
  const theme = useTheme()

  useEffect(() => {
    if (removeAfterMs === null) return undefined

    const timeout = setTimeout(() => {
      removePopup(popKey)
    }, removeAfterMs)

    return () => {
      clearTimeout(timeout)
    }
  }, [popKey, removeAfterMs, removePopup])
  const isTxnPopup = 'txn' in content

  let popupContent
  if (isTxnPopup) {
    popupContent = <TransactionPopup hash={content.txn.hash} />
  } else if ('failedSwitchNetwork' in content) {
    popupContent = <FailedNetworkSwitchPopup chainId={content.failedSwitchNetwork} />
  }

  return (
    <Popup isTransactionPopup={isTxnPopup} show={!!popupContent}>
      <StyledClose isTransactionPopup={isTxnPopup} color={theme.textSecondary} onClick={() => removePopup(popKey)} />
      {popupContent}
    </Popup>
  )
}
