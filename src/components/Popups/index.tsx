import React from 'react'
import styled from 'styled-components'
import { useMediaLayout } from 'use-media'
import { useActivePopups } from '../../state/application/hooks'
import { AutoColumn } from '../Column'
import PopupItem from './PopupItem'

const MobilePopupWrapper = styled.div<{ height: string | number }>`
  position: relative;
  max-width: 100%;
  height: ${({ height }) => height};
  margin: ${({ height }) => (height ? '0 auto;' : 0)};
  margin-bottom: ${({ height }) => (height ? '20px' : 0)}};
`

const MobilePopupInner = styled.div`
  height: 99%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: row;
  -webkit-overflow-scrolling: touch;
  ::-webkit-scrollbar {
    display: none;
  }
`

const FixedPopupColumn = styled(AutoColumn)`
  position: absolute;
  top: 112px;
  right: 1rem;
  max-width: 355px !important;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

export default function Popups() {
  // get all popups
  const activePopups = useActivePopups()

  // switch view settings on mobile
  const isMobile = useMediaLayout({ maxWidth: '600px' })

  if (!isMobile) {
    return (
      <FixedPopupColumn gap="20px">
        {activePopups.map(item => (
          <PopupItem key={item.key} content={item.content} popKey={item.key} />
        ))}
      </FixedPopupColumn>
    )
  }
  //mobile
  else
    return (
      <MobilePopupWrapper height={activePopups?.length > 0 ? 'fit-content' : 0}>
        <MobilePopupInner>
          {activePopups // reverse so new items up front
            .slice(0)
            .reverse()
            .map(item => (
              <PopupItem key={item.key} content={item.content} popKey={item.key} />
            ))}
        </MobilePopupInner>
      </MobilePopupWrapper>
    )
}
