import React, { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  Code,
  Info,
  MessageCircle,
  PieChart,
  Moon,
  Sun,
  ChevronRight,
  ChevronLeft,
  Check,
  BarChart2,
  Twitter,
  Monitor,
  Image,
} from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components/macro'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'
import { useActiveWeb3React } from '../../hooks/web3'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'
import { Trans } from '@lingui/macro'
import { ExternalLink } from '../../theme'
import { ButtonPrimary } from '../Button'
import { useDarkModeManager } from 'state/user/hooks'

import { L2_CHAIN_IDS, CHAIN_INFO, SupportedChainId } from 'constants/chains'
import { LOCALE_LABEL, SupportedLocale, SUPPORTED_LOCALES } from 'constants/locales'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useWeb3React } from '@web3-react/core'
import { useTrumpBalance } from 'pages/Vote/VotePage'
import { StyledInternalLink } from 'theme/components'

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
  min-width: 196px;
  max-height: 350px;
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

export const InternalMenuItemTwo = styled(Link)`
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

const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem 0.5rem;
  justify-content: space-between;
  text-decoration: none;
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
  const showUNIClaimOption = Boolean(!!account && !!chainId && !L2_CHAIN_IDS.includes(chainId))
  const { infoLink } = CHAIN_INFO[chainId ? chainId : SupportedChainId.MAINNET]

  const [darkMode, toggleDarkMode] = useDarkModeManager()

  const [menu, setMenu] = useState<'main' | 'lang'>('main')
const babyTrumpBalance = useTrumpBalance(account);
  useEffect(() => {
    setMenu('main')
  }, [open])

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle}>
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
                <MenuFlyout>
                 <InternalLinkMenuItem to="/suite">
                 <div>
                   <Trans>TrumpTools </Trans>
                   </div>
                   <Monitor opacity={0.6} size={16} />
                   </InternalLinkMenuItem>
                 
                 <MenuItem href="https://stats.babytrumptoken.com">
                     <div>
                      <Trans>TrumpStats</Trans>
                    </div> 
                    <BarChart2  opacity={0.6} size={16} />
                 </MenuItem>
                 <InternalMenuItemTwo to="/themed-background">
                    <div>
                      <Trans>Edit background</Trans>
                    </div>
                    <Image opacity={0.6} size={16} />
                  </InternalMenuItemTwo>
                  <MenuItem href="https://babytrumptoken.com/">
                    <div>
                      <Trans>About</Trans>
                    </div>
                    <Info opacity={0.6} size={16} />
                  </MenuItem>
                  <MenuItem href="https://t.me/BabyTrumpETH/">
                    <div>
                      <Trans>Telegram</Trans>
                    </div>
                    <BookOpen opacity={0.6} size={16} />
                  </MenuItem>
                  <MenuItem href="https://www.dextools.io/app/uniswap/pair-explorer/0x409de5926a8a6879a5ee3ff594ad76c11d88e921">
                    <div>
                      <Trans>Dextools</Trans>
                    </div>
                    <BarChart2 opacity={0.6} size={16} />
                  </MenuItem>
                  <MenuItem href={'https://twitter.com/BabyTrumpETH'}>
                    <div>
                      <Trans>Twitter</Trans>
                    </div>
                    <Twitter opacity={0.6} size={16} />
                  </MenuItem>
                  <ToggleMenuItem onClick={() => setMenu('lang')}>
                    <div>
                      <Trans>Language</Trans>
                    </div>
                    <ChevronRight size={16} opacity={0.6} />
                  </ToggleMenuItem>
                  <ToggleMenuItem onClick={() => toggleDarkMode()}>
                    <div>{darkMode ? <Trans>Light Theme</Trans> : <Trans>Dark Theme</Trans>}</div>
                    {darkMode ? <Moon opacity={0.6} size={16} /> : <Sun opacity={0.6} size={16} />}
                  </ToggleMenuItem>
                </MenuFlyout>
              )
          }
        })()}
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

export const GainsMenu = () => {
  const node = useRef<HTMLDivElement>()
  const { account } = useWeb3React()
  const trumpBalance = useTrumpBalance(account)
  const [show, setShow]  = React.useState(false)
  const open = useModalOpen(ApplicationModal.GAINS)
  const toggle = useToggleModal(ApplicationModal.GAINS)
  useOnClickOutside(node, show ? () => setShow(false)  : undefined)
  const ToggleElement = StyledMenuIcon
  return (
    <StyledMenu ref={node as any}>
      <ToggleElement onClick={() => setShow(true)} />
      {show && (
        <NewMenuFlyout flyoutAlignment={FlyoutAlignment.RIGHT}>
              <NewMenuItem to={"/gains"}>
               TRUMPGAINS
              </NewMenuItem>
      <NewMenuItem  to={trumpBalance ? "/gains-tracker" : '#'}> UNIVERSAL GAINS TRACKER {!trumpBalance && <Info />}</NewMenuItem>
        </NewMenuFlyout>
      )}
    </StyledMenu>
  )
}

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
