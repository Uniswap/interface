import { useEffect } from 'react'
import { X } from 'react-feather'
import styled, { css, useTheme } from 'styled-components/macro'

import { useRemovePopup } from '../../state/application/hooks'
import { PopupContent } from '../../state/application/reducer'
import FailedNetworkSwitchPopup from './FailedNetworkSwitchPopup'
import TransactionPopup from './TransactionPopup'

const StyledClose = styled(X)<{ $padding: number }>`
  position: absolute;
  right: ${({ $padding }) => `${$padding}px`};
  top: ${({ $padding }) => `${$padding}px`};

  :hover {
    cursor: pointer;
  }
`
const PopupCss = css<{ show: boolean }>`
  display: inline-block;
  width: 100%;
  visibility: ${({ show }) => (show ? 'visible' : 'hidden')};
  background-color: ${({ theme }) => theme.backgroundSurface};
  position: relative;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
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

const TransactionPopupContainer = styled.div`
  ${PopupCss}
  padding: 2px 0px;
`

const FailedSwitchNetworkPopupContainer = styled.div<{ show: boolean }>`
  ${PopupCss}
  padding: 20px 35px 20px 20px;
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

  if ('txn' in content) {
    return (
      <TransactionPopupContainer show={true}>
        <StyledClose $padding={16} color={theme.textSecondary} onClick={() => removePopup(popKey)} />
        <TransactionPopup hash={content.txn.hash} />
      </TransactionPopupContainer>
    )
  } else if ('failedSwitchNetwork' in content) {
    return (
      <FailedSwitchNetworkPopupContainer show={true}>
        <StyledClose $padding={20} color={theme.textSecondary} onClick={() => removePopup(popKey)} />
        <FailedNetworkSwitchPopup chainId={content.failedSwitchNetwork} />
      </FailedSwitchNetworkPopupContainer>
    )
  }
  return null
}
