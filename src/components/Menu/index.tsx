import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { BookOpen, Check, ChevronLeft, ChevronRight, Code, Globe, Info, MessageCircle, PieChart } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'
import { useActiveWeb3React } from '../../hooks/web3'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'
import { Transition } from 'react-transition-group'

import { ExternalLink } from '../../theme'
import { ButtonPrimary } from '../Button'
import { useUserLocaleManager } from 'state/user/hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { LOCALE_LABEL, SUPPORTED_LOCALES } from 'constants/locales'

export enum FlyoutAlignment {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg2};

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg3};
  }

  svg {
    margin-top: 2px;
  }
`

const UNIbutton = styled(ButtonPrimary)`
  background-color: ${({ theme }) => theme.bg3};
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
  border: none;
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span<{ flyoutAlignment?: FlyoutAlignment }>`
  min-width: 12.125rem;
  background-color: ${({ theme }) => theme.bg2};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  z-index: 100;
  ${({ flyoutAlignment = FlyoutAlignment.RIGHT }) =>
    flyoutAlignment === FlyoutAlignment.RIGHT
      ? css`
          right: 0rem;
        `
      : css`
          left: 0rem;
        `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    top: -17.25rem;
  `};

  overflow: hidden;
  transition: height 500ms ease;
`

const LinkMenuItem = styled(ExternalLink)`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

const InternalMenuItem = styled(Link)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

const MenuItem = styled.div`
  display: grid;
  grid-template-columns: 16px auto 16px;
  grid-gap: 8px;
  align-items: center;
  padding: 0.5rem 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  cursor: pointer;
`

const MainMenu = styled.div<{ state: string }>`
  position: ${({ state }) => (['entering', 'exiting'].includes(state) ? 'absolute' : 'initial')};
  transition: all 500ms ease;
  transform: translateX(${({ state }) => (['entering', 'entered'].includes(state) ? 0 : -110)}%);
`

const LangMenu = styled.div<{ state: string }>`
  transition: all 500ms ease;
  transform: translateX(${({ state }) => (['entering', 'entered'].includes(state) ? 0 : 110)}%);
`

const Separator = styled.hr`
  border-top: 1px solid ${({ theme }) => theme.text4};
  margin: 0 0.5rem;
`

const CODE_LINK = 'https://github.com/Uniswap/uniswap-interface'

export default function Menu() {
  const { account } = useActiveWeb3React()

  const [activeMenu, setActiveMenu] = useState<'main' | 'lang'>('main')
  const [menuHeight, setMenuHeight] = useState<number | undefined>(undefined)

  const [, setUserLocale] = useUserLocaleManager()
  const activeLocale = useActiveLocale()

  const node = useRef<HTMLDivElement>()
  const menuFlyout = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  useOnClickOutside(node, open ? toggle : undefined)
  const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM)

  useEffect(() => {
    setMenuHeight((menuFlyout.current?.firstChild as HTMLElement | undefined)?.offsetHeight)
  }, [])

  function calcHeight(el: HTMLElement) {
    // programatically sets height to animate menu transitions
    setMenuHeight(el.offsetHeight)
  }

  function MenuSwitcher({
    children,
    leftIcon,
    rightIcon,
    goToMenu,
  }: {
    children?: ReactNode
    leftIcon?: ReactNode
    rightIcon?: ReactNode
    goToMenu: 'main' | 'lang'
  }) {
    return (
      <MenuItem onClick={() => goToMenu && setActiveMenu(goToMenu)}>
        {leftIcon}
        {children}
        {rightIcon}
      </MenuItem>
    )
  }

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle}>
        <StyledMenuIcon />
      </StyledMenuButton>

      {open && (
        <MenuFlyout ref={menuFlyout as any} style={{ height: menuHeight }}>
          <Transition in={activeMenu === 'main'} timeout={500} unmountOnExit onEnter={calcHeight}>
            {(state) => (
              <MainMenu state={state}>
                <MenuSwitcher goToMenu="lang" leftIcon={<Globe size={14} />} rightIcon={<ChevronRight size={18} />}>
                  Language
                </MenuSwitcher>
                <Separator />
                <LinkMenuItem href="https://uniswap.org/">
                  <Info size={14} />
                  <div>About</div>
                </LinkMenuItem>
                <LinkMenuItem href="https://docs.uniswap.org/">
                  <BookOpen size={14} />
                  <div>Docs</div>
                </LinkMenuItem>
                <LinkMenuItem href={CODE_LINK}>
                  <Code size={14} />
                  <div>Code</div>
                </LinkMenuItem>
                <LinkMenuItem href="https://discord.gg/FCfyBSbCU5">
                  <MessageCircle size={14} />
                  <div>Discord</div>
                </LinkMenuItem>
                <LinkMenuItem href="https://info.uniswap.org/">
                  <PieChart size={14} />
                  <div>Analytics</div>
                </LinkMenuItem>
                {account && (
                  <UNIbutton onClick={openClaimModal} padding="8px 16px" width="100%" borderRadius="12px" mt="0.5rem">
                    Claim UNI
                  </UNIbutton>
                )}
              </MainMenu>
            )}
          </Transition>

          <Transition in={activeMenu === 'lang'} timeout={500} unmountOnExit onEnter={calcHeight}>
            {(state) => (
              <LangMenu state={state}>
                <MenuSwitcher goToMenu="main" leftIcon={<ChevronLeft size={18} />} />
                {SUPPORTED_LOCALES.map((locale) => {
                  if (!LOCALE_LABEL[locale]) return null
                  return (
                    <MenuItem key={locale} onClick={() => setUserLocale(locale)}>
                      <div></div>
                      <div>{LOCALE_LABEL[locale]}</div>
                      {activeLocale === locale ? <Check size={16} /> : null}
                    </MenuItem>
                  )
                })}
              </LangMenu>
            )}
          </Transition>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}

interface NewMenuProps {
  flyoutAlignment?: FlyoutAlignment
  ToggleUI?: React.FunctionComponent
  menuItems: {
    content: any
    link: string
    external: boolean
  }[]
}

const NewMenuFlyout = styled(MenuFlyout)`
  top: 3rem !important;
`
const NewMenuItem = styled(InternalMenuItem)`
  width: max-content;
  text-decoration: none;
`

const ExternalMenuItem = styled(LinkMenuItem)`
  width: max-content;
  text-decoration: none;
`

export const NewMenu = ({ flyoutAlignment = FlyoutAlignment.RIGHT, ToggleUI, menuItems, ...rest }: NewMenuProps) => {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.POOL_OVERVIEW_OPTIONS)
  const toggle = useToggleModal(ApplicationModal.POOL_OVERVIEW_OPTIONS)
  useOnClickOutside(node, open ? toggle : undefined)
  const ToggleElement = ToggleUI || StyledMenuIcon
  return (
    <StyledMenu ref={node as any} {...rest}>
      <ToggleElement onClick={toggle} />
      {open && (
        <NewMenuFlyout flyoutAlignment={flyoutAlignment}>
          {menuItems.map(({ content, link, external }, i) =>
            external ? (
              <ExternalMenuItem id="link" href={link} key={link + i}>
                {content}
              </ExternalMenuItem>
            ) : (
              <NewMenuItem id="link" to={link} key={link + i}>
                {content}
              </NewMenuItem>
            )
          )}
        </NewMenuFlyout>
      )}
    </StyledMenu>
  )
}
