import React, { useMemo } from 'react'
import styled, { css } from 'styled-components'
import { BrowserView, MobileView, isMobile } from 'react-device-detect'
import Modal from 'components/Modal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { Text } from 'rebass'
import { AutoColumn } from 'components/Column'

const BrowserDefaultStyle = css`
  min-width: 9rem;
  background-color: ${({ theme }) => theme.background};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 4rem;
  right: 0rem;
  z-index: 100;
  padding: 20px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

const MobileDefaultStyle = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${({ theme }) => theme.background};
  padding: 20px;
`
/**
 * Render a MenuFlyout if it's browser view and render a Modal popout from bottom if it's mobile view with custom different css apply for each one.
 */
const MenuFlyout = (props: {
  browserCustomStyle?: any
  mobileCustomStyle?: any
  isOpen: boolean
  toggle: () => void
  children: React.ReactNode
  node: any
  translatedTitle?: string
}) => {
  useOnClickOutside(props.node, props.isOpen && !isMobile ? props.toggle : undefined)
  const BrowserStyle = useMemo(
    () => styled.span`
      ${BrowserDefaultStyle}
      ${props.browserCustomStyle}
    `,
    [props.browserCustomStyle]
  )
  const MobileStyle = useMemo(
    () => styled.span`
      ${MobileDefaultStyle}
      ${props.mobileCustomStyle}
    `,
    [props.mobileCustomStyle]
  )

  if (!props.isOpen) return <></>
  return (
    <>
      <BrowserView>
        <BrowserStyle>
          <MenuTitleWrapper toggle={props.toggle} translatedTitle={props.translatedTitle}>
            {props.children}
          </MenuTitleWrapper>
        </BrowserStyle>
      </BrowserView>
      <MobileView>
        <Modal isOpen={true} onDismiss={props.toggle} maxWidth={900}>
          <MobileStyle>
            <MenuTitleWrapper toggle={props.toggle} translatedTitle={props.translatedTitle}>
              {props.children}
            </MenuTitleWrapper>
          </MobileStyle>
        </Modal>
      </MobileView>
    </>
  )
}

export default MenuFlyout

const CloseIcon = styled.div`
  position: absolute;
  right: 20px;
  top: 17px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const MenuTitleWrapper = (props: { toggle: () => void; translatedTitle?: string; children: React.ReactNode }) => {
  const theme = useTheme()

  if (!props.translatedTitle) return <>{props.children}</>

  return (
    <AutoColumn gap="16px">
      {isMobile && (
        <CloseIcon onClick={props.toggle}>
          <CloseColor />
        </CloseIcon>
      )}
      <Text fontWeight={600} fontSize={16} color={theme.text11}>
        {props.translatedTitle}
      </Text>
      <AutoColumn
        style={{
          borderTop: `1px solid ${theme.border}`,
          paddingTop: '1rem'
        }}
      >
        {props.children}
      </AutoColumn>
    </AutoColumn>
  )
}
