import React from 'react'
import styled from 'styled-components'
import { useActivePopups } from 'state/application/hooks'
import { AutoColumn } from '../Column'
import PopupItem from './PopupItem'
import { useURLWarningVisible, useRebrandingAnnouncement } from 'state/user/hooks'

const MobilePopupWrapper = styled.div<{ height: string | number }>`
  position: relative;
  max-width: 100%;
  height: ${({ height }) => height};
  margin: ${({ height }) => (height ? '20px auto;' : 0)};
  display: none;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: block;
  `};
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

const FixedPopupColumn = styled(AutoColumn)<{ extraPadding: string }>`
  position: fixed;
  top: ${({ extraPadding }) => extraPadding};
  right: 1rem;
  max-width: 355px !important;
  width: 100%;
  z-index: 4;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

export default function Popups() {
  // get all popups
  const activePopups = useActivePopups()

  const urlWarningActive = useURLWarningVisible()
  const rebrandingAnnouncement = useRebrandingAnnouncement()

  return (
    <>
      <FixedPopupColumn
        gap="20px"
        extraPadding={urlWarningActive ? '108px' : rebrandingAnnouncement ? '148px' : '88px'}
      >
        {activePopups.map(item => (
          <PopupItem key={item.key} content={item.content} popKey={item.key} removeAfterMs={item.removeAfterMs} />
        ))}
      </FixedPopupColumn>
      <MobilePopupWrapper height={activePopups?.length > 0 ? 'fit-content' : 0}>
        <MobilePopupInner>
          {activePopups // reverse so new items up front
            .slice(0)
            .reverse()
            .map(item => (
              <PopupItem key={item.key} content={item.content} popKey={item.key} removeAfterMs={item.removeAfterMs} />
            ))}
        </MobilePopupInner>
      </MobilePopupWrapper>
    </>
  )
}
