import {
  BarChart2,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Code,
  DollarSign,
  Info,
  List,
  Lock,
  MessageCircle,
  Moon,
  PieChart,
  Star,
  Sun,
  Tool,
  Twitter,
} from 'react-feather'
import { CHAIN_INFO, L2_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import React, { useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'

import { ApplicationModal } from '../../state/application/actions'
import { ButtonPrimary } from '../Button'
import { ExternalLink } from '../../theme'
import { Link } from 'react-router-dom'
import { LockModal } from 'components/swap/LockModal'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'
import { Trans } from '@lingui/macro'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useActiveWeb3React } from '../../hooks/web3'
import { useDarkModeManager } from 'state/user/hooks'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

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
  height: 38px;
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme }) => theme.bg0};

  padding: 0.15rem 0.5rem;
  border-radius: 12px;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    border: 1px solid ${({ theme }) => theme.bg3};
  }

  svg {
    margin-top: 2px;
  }
`

const UNIbutton = styled(ButtonPrimary)`
  background-color: ${({ theme }) => theme.bg3};
  background: ${({ theme }) => theme.bg0};
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
  min-width: 196px;
  max-height: 370px;
  overflow: auto;
  background-color: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border: 1px solid ${({ theme }) => theme.bg0};
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 16px;
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
    bottom: unset;
    right: 0;
    left: unset;
  `};
`

const MenuItem = styled(ExternalLink)`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem 0.5rem;
  justify-content: space-between;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
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

const InternalLinkMenuItem = styled(Link)`
display: flex;
flex: 1;
flex-direction: row;
align-items: center;
padding: 0.5rem 0.5rem;
justify-content: space-between;
text-decoration:none;
color: ${({ theme }) => theme.text2};
:hover {
  color: ${({ theme }) => theme.text1};
  cursor: pointer;
  text-decoration: none;
}
`

const ToggleMenuItem = styled.button`
  background-color: transparent;
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem 0.5rem;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
`

const CODE_LINK = 'https://github.com/Uniswap/uniswap-interface'

function LanguageMenuItem({ locale, active, key }: { locale: SupportedLocale; active: boolean; key: string }) {
  const { to, onClick } = useLocationLinkProps(locale)

  if (!to) return null

  return (
    <InternalLinkMenuItem onClick={onClick} key={key} to={to}>
      <div>{LOCALE_LABEL[locale]}</div>
      {active && <Check opacity={0.6} size={16} />}
    </InternalLinkMenuItem>
  )
}

function LanguageMenu({ close }: { close: () => void }) {
  const activeLocale = useActiveLocale()

  return (
    <MenuFlyout>
      <ToggleMenuItem onClick={close}>
        <ChevronLeft size={16} />
      </ToggleMenuItem>
      {SUPPORTED_LOCALES.map((locale) => (
        <LanguageMenuItem locale={locale} active={activeLocale === locale} key={locale} />
      ))}
    </MenuFlyout>
  )
}

export default function Menu() {
  const { account, chainId } = useActiveWeb3React()

  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  useOnClickOutside(node, open ? toggle : undefined)
  const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const [menu, setMenu] = useState<'main' | 'lang'>('main')
  const theme = useTheme()
  useEffect(() => {
    setMenu('main')
  }, [open])
  const [showLockModal, setShowLM] = React.useState(false)
  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton style={{ background: theme.bg0 }} onClick={toggle}>
        <StyledMenuIcon />
      </StyledMenuButton>

      {open &&
        (() => {
          switch (menu) {
            case 'lang':
              return <LanguageMenu close={() => setMenu('main')} />
            case 'main':
            default:
              return (
                <>
                  <MenuFlyout>
                    <InternalLinkMenuItem to="/fomo">
                      <div>
                        <Trans>KibaFomo</Trans>
                      </div>
                      <Star opacity={0.6} size={16} />
                    </InternalLinkMenuItem>
                    <InternalLinkMenuItem to="/honeypot-checker">
                      <div>
                        <Trans>Honeypot Checker</Trans>
                      </div>
                      <Code opacity={0.6} size={16} />
                    </InternalLinkMenuItem>
                    <InternalLinkMenuItem to="/suite">
                      <div>
                        <Trans>KibaTools</Trans>
                      </div>
                      <Tool size={16} opacity={0.6} />
                    </InternalLinkMenuItem>
                    {<InternalLinkMenuItem to="/details">
                      <div>
                        <Trans>Transactions</Trans>
                      </div>
                      <List size={16} opacity={0.6} />
                    </InternalLinkMenuItem>}
                    <MenuItem href="https://kibainu.org/">
                      <div>
                        <Trans>About</Trans>
                      </div>
                      <Info opacity={0.6} size={16} />
                    </MenuItem>
                    <MenuItem href="https://docs.kiba.tools">
                      <div>
                        <Trans>Docs</Trans>
                      </div>
                      <BookOpen opacity={0.6} size={16} />
                    </MenuItem>
                    <MenuItem href={'https://twitter.com/KibaInuWorld'}>
                      <div>
                        <Trans>Twitter</Trans>
                      </div>
                      <Twitter opacity={0.6} size={16} />
                    </MenuItem>
                    <ToggleMenuItem onClick={() => toggleDarkMode()}>
                      <div>{darkMode ? <Trans>Light Theme</Trans> : <Trans>Dark Theme</Trans>}</div>
                      {darkMode ? <Moon opacity={0.6} size={16} /> : <Sun opacity={0.6} size={16} />}
                    </ToggleMenuItem>
                    <ToggleMenuItem onClick={() => setMenu('lang')}>
                      <div>
                        <Trans>Language</Trans>
                      </div>
                      <ChevronRight size={16} opacity={0.6} />
                    </ToggleMenuItem>
                  </MenuFlyout>
                </>
              )
          }
        })()}
      <LockModal isOpen={showLockModal} setIsOpen={setShowLM} />

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

const ExternalMenuItem = styled(MenuItem)`
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
              <ExternalMenuItem href={link} key={i}>
                {content}
              </ExternalMenuItem>
            ) : (
              <NewMenuItem to={link} key={i}>
                {content}
              </NewMenuItem>
            )
          )}
        </NewMenuFlyout>
      )}
    </StyledMenu>
  )
}