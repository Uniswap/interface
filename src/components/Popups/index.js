import React from 'react'
import styled from 'styled-components'
import { useMediaLayout } from 'use-media'

import { X } from 'react-feather'
import { Text } from 'rebass'
import { TYPE } from '../../theme'
import { Hover } from '../../theme/components'
import { PinkCard } from '../Card'
import { ButtonPink } from '../Button'
import { usePopups } from '../../contexts/Application'
import { AutoColumn } from '../Column'
import { useMigrationMessageManager } from '../../contexts/LocalStorage'

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
  height: ${({ height }) => height}
  margin: ${({ height }) => (height ? '0 auto;' : 0)} 
  margin-bottom: ${({ height }) => (height ? '20px' : 0)}}
`

const MobilePopupInner = styled.div`
  height: 99%;
  box-sizing: border-box;
  white-space: nowrap;
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
  top: 80px;
  right: 20px
  width: 380px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const Popup = styled.div`
  display: inline-block;
  width: 100%;
  height: 120px;
  padding: 1em;
  box-sizing: border-box;
  background-color: white;
  margin: 0 10px;
  position: relative;
  border-radius: 10px;
  padding: 20px;
  padding-right: 35px;
  whitespace: normal;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 290px;
  `}
`

const MobileCardPink = styled(PinkCard)`
  z-index: 2;
  padding: 20px;
  white-space: normal;
`

export default function App() {
  // get all popups
  const [activePopups, , removePopup] = usePopups()

  // local storage reference to show message
  const [showMessage, hideMigrationMessage] = useMigrationMessageManager()

  // switch view settings on mobile
  const isMobile = useMediaLayout({ maxWidth: '600px' })

  if (!isMobile) {
    return (
      <FixedPopupColumn gap="20px">
        {activePopups.map(item => {
          return (
            <Popup key={item.key}>
              <StyledClose color="#888D9B" onClick={() => removePopup(item.key)} />
              {item.content}
            </Popup>
          )
        })}
        {showMessage && (
          <PinkCard padding="20px" style={{ zIndex: '2' }}>
            <AutoColumn justify={'center'} gap={'20px'}>
              <TYPE.largeHeader>Uniswap has upgraded.</TYPE.largeHeader>
              <Text textAlign="center">Are you a liquidity provider? Upgrade now using the migration helper.</Text>
              <ButtonPink width={'265px'}>Migrate your liquidity </ButtonPink>
              <Hover onClick={() => hideMigrationMessage()}>
                <Text textAlign="center">Dismiss</Text>
              </Hover>
            </AutoColumn>
          </PinkCard>
        )}
      </FixedPopupColumn>
    )
  }
  //mobile
  else
    return (
      <MobilePopupWrapper height={activePopups?.length > 0 || showMessage ? 'fit-content' : 0}>
        <MobilePopupInner>
          {activePopups // reverse so new items up front
            .slice(0)
            .reverse()
            .map(item => {
              return (
                <Popup key={item.key}>
                  <StyledClose color="#888D9B" onClick={() => removePopup(item.key)} />
                  {item.content}
                </Popup>
              )
            })}
          {showMessage && (
            <MobileCardPink>
              <AutoColumn justify={'center'} gap={'20px'}>
                <Text>Uniswap has upgraded.</Text>
                <Text textAlign="center">Are you a liquidity provider? Upgrade now using the migration helper.</Text>
                <ButtonPink width={'265px'}>Migrate your liquidity </ButtonPink>
                <Hover onClick={() => hideMigrationMessage()}>
                  <Text textAlign="center">Dismiss</Text>
                </Hover>
              </AutoColumn>
            </MobileCardPink>
          )}
        </MobilePopupInner>
      </MobilePopupWrapper>
    )
}
