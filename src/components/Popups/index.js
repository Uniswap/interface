import React from 'react'
import styled from 'styled-components'
import { useMediaLayout } from 'use-media'

import { X } from 'react-feather'
import { usePopups } from '../../contexts/Application'
import { AutoColumn } from '../Column'

const StyledClose = styled(X)`
  position: absolute;
  right: 10px;
  top: 10px;

  :hover {
    cursor: pointer;
  }
`

const MobilePopupWrapper = styled.div`
  position: relative;
  max-width: 100%;
  height: ${({ height }) => height};
  margin: ${({ height }) => (height ? '0 auto;' : 0)};
  margin-bottom: ${({ height }) => (height ? '20px' : 0)}};
`

const MobilePopupInner = styled.div`
  height: 99%;
  box-sizing: border-box;
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
  width: 355px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const Popup = styled.div`
  display: inline-block;
  width: 100%;
  padding: 1em;
  box-sizing: border-box;
  background-color: white;
  position: relative;
  border-radius: 10px;
  padding: 20px;
  padding-right: 35px;
  z-index: 2;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 290px;
  `}
`

export default function App() {
  // get all popups
  const [activePopups, , removePopup] = usePopups()

  // switch view settings on mobile
  const isMobile = useMediaLayout({ maxWidth: '600px' })

  if (!isMobile) {
    return (
      <FixedPopupColumn gap="20px">
        {activePopups.map(item => {
          return (
            <Popup key={item.key}>
              <StyledClose color="#888D9B" onClick={() => removePopup(item.key)} />
              {React.cloneElement(item.content, { popKey: item.key })}
            </Popup>
          )
        })}
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
            .map(item => {
              return (
                <Popup key={item.key}>
                  <StyledClose color="#888D9B" onClick={() => removePopup(item.key)} />
                  {React.cloneElement(item.content, { popKey: item.key })}
                </Popup>
              )
            })}
        </MobilePopupInner>
      </MobilePopupWrapper>
    )
}
