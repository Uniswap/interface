import React, { ReactNode, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import styled, {
  CSSProperties,
  DefaultTheme,
  FlattenInterpolation,
  FlattenSimpleInterpolation,
  ThemeProps,
  css,
} from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

const Arrow = css`
  & > div {
    position: relative;
    :after {
      bottom: 100%;
      right: 0;
      top: -40px;
      border: solid transparent;
      content: '';
      height: 0;
      width: 0;
      position: absolute;
      pointer-events: none;
      border-bottom-color: ${({ theme }) => theme.tableHeader};
      border-width: 10px;
      margin-left: -10px;
    }
  }
  ${({ theme }) => theme.mediaWidth.upToLarge`
    & > div:after {
      top: calc(100% + 20px);
      border-top-color: ${({ theme }) => theme.tableHeader};
      border-bottom-color: transparent
      border-width: 10px;
      margin-left: -10px;
    }
  `};
`

const BrowserDefaultStyle = css`
  min-width: 9rem;
  background-color: ${({ theme }) => theme.tableHeader};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3.5rem;
  right: 0rem;
  z-index: 100;
  padding: 20px;
`

const MobileDefaultStyle = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${({ theme }) => theme.background};
  padding: 20px;
`

const BrowserStyle = styled.span<{ hasArrow: boolean; customStyle: any }>`
  ${BrowserDefaultStyle}
  ${({ hasArrow }) => (hasArrow ? Arrow : '')}
  ${({ customStyle }) => customStyle}
`

const MobileStyle = styled.span<{ customStyle: any }>`
  ${MobileDefaultStyle}
  ${({ customStyle }) => customStyle}
`

type Style = FlattenInterpolation<ThemeProps<DefaultTheme>> | FlattenSimpleInterpolation | CSSProperties
/**
 * Render a MenuFlyout if it's browser view and render a Modal popout from bottom if it's mobile view with custom different css apply for each one.
 */
const MenuFlyoutLocal = (props: {
  browserCustomStyle?: Style
  mobileCustomStyle?: Style
  isOpen: boolean
  toggle: () => void
  children: ReactNode
  node: React.RefObject<HTMLDivElement>
  title?: string
  hasArrow?: boolean
  modalWhenMobile?: boolean
}) => {
  const {
    modalWhenMobile = true,
    children,
    isOpen,
    toggle,
    title,
    mobileCustomStyle,
    browserCustomStyle,
    hasArrow,
    node,
  } = props

  const isModal = isMobile && modalWhenMobile
  useOnClickOutside(node, isOpen && !isModal ? toggle : undefined)
  if (!isOpen) return null
  const content = (
    <MenuTitleWrapper toggle={toggle} title={title} fontSize={16}>
      {children}
    </MenuTitleWrapper>
  )
  if (isModal)
    return (
      <Modal isOpen={true} onDismiss={toggle} maxWidth={900}>
        <MobileStyle customStyle={mobileCustomStyle}>{content}</MobileStyle>
      </Modal>
    )
  return (
    <BrowserStyle hasArrow={!!hasArrow} customStyle={browserCustomStyle}>
      {content}
    </BrowserStyle>
  )
}

export default function MenuFlyout({
  children,
  trigger,
  hasArrow,
  customStyle,
  mobileCustomStyle,
  modalWhenMobile,
  toggle,
  isOpen,
  title,
}: {
  customStyle?: Style
  mobileCustomStyle?: Style
  title?: string
  children: ReactNode
  trigger: ReactNode
  modalWhenMobile?: boolean
  toggle?: () => void
  isOpen?: boolean
  hasArrow?: boolean
}) {
  const [isOpenLocal, setIsOpenLocal] = useState(false)
  const node = useRef<HTMLDivElement>(null)
  const toggleLocal = () => setTimeout(() => setIsOpenLocal(prev => !prev), 100)
  const onToggle = toggle ?? toggleLocal
  return (
    <div ref={node}>
      <div onClick={onToggle}>{trigger}</div>
      <MenuFlyoutLocal
        title={title}
        hasArrow={hasArrow}
        browserCustomStyle={customStyle}
        mobileCustomStyle={mobileCustomStyle ?? customStyle}
        modalWhenMobile={modalWhenMobile}
        node={node}
        isOpen={isOpen ?? isOpenLocal}
        toggle={onToggle}
      >
        {children}
      </MenuFlyoutLocal>
    </div>
  )
}

const CloseIcon = styled.div`
  position: absolute;
  right: 20px;
  top: 17px;
  color: ${({ theme }) => theme.text4};
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const MenuWrapper = styled.ul`
  list-style-type: none;
  padding-left: 0px;
  margin: 0px;
`
const MenuTitleWrapper = (props: {
  toggle: () => void
  title?: string
  children: React.ReactNode
  fontSize?: string | number
}) => {
  const theme = useTheme()

  if (!props.title) return <>{props.children}</>

  return (
    <AutoColumn gap={isMobile ? '14px' : '10px'}>
      {isMobile && (
        <CloseIcon onClick={props.toggle}>
          <Close />
        </CloseIcon>
      )}
      <Text fontWeight={500} fontSize={props.fontSize || 16} color={theme.text}>
        {props.title}
      </Text>
      <MenuWrapper>{props.children}</MenuWrapper>
    </AutoColumn>
  )
}
