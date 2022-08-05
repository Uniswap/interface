import React from 'react'
import styled from 'styled-components'
import { useActivePopups } from 'state/application/hooks'
import PopupItem from './PopupItem'
import { Z_INDEXS } from 'constants/styles'

const FixedPopupColumn = styled.div`
  position: fixed;
  top: 108px;
  right: 1rem;
  width: 100%;
  z-index: ${Z_INDEXS.POPUP_NOTIFICATION};
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    left: 0;
    right: 0;
    top: 15px;
    align-items: center;
  `};
`

export default function Popups() {
  const activePopups = useActivePopups()
  return (
    <FixedPopupColumn>
      {activePopups.map(item => (
        <PopupItem
          key={item.key}
          popupType={item.popupType}
          content={item.content}
          popKey={item.key}
          removeAfterMs={item.removeAfterMs}
        />
      ))}
    </FixedPopupColumn>
  )
}
