import { useWeb3React } from '@web3-react/core'
import Web3Status from 'components/Web3Status'
import { useWindowSize } from 'hooks/useWindowSize'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'

import { Box } from '../../nft/components/Box'
import { Row } from '../../nft/components/Flex'
import { UniIcon, UniIconMobile } from '../../nft/components/icons'
import { breakpoints } from '../../nft/css/sprinkles.css'
import { ChainSwitcher } from './ChainSwitcher'
import { MenuDropdown } from './MenuDropdown'
import { MobileSideBar } from './MobileSidebar'
import * as styles from './Navbar.css'
import { SearchBar } from './SearchBar'

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.deprecated_bg0 : theme.deprecated_bg0)};
  border-radius: 16px;
  white-space: nowrap;
  width: 100%;
  height: 40px;

  :focus {
    border: 1px solid blue;
  }
`

interface NavLinkItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
}

const NavLinkItem = ({ href, id, isActive, children }: NavLinkItemProps) => {
  return (
    <NavLink
      to={href}
      className={isActive ? styles.activeMenuItem : styles.menuItem}
      id={id}
      style={{ textDecoration: 'none' }}
    >
      {children}
    </NavLink>
  )
}

const MobileNavbar = () => {
  return (
    <>
      <nav className={styles.nav}>
        <Box display="flex" height="full" flexWrap="nowrap" alignItems="stretch">
          <Box className={styles.leftSideMobileContainer}>
            <Box as="a" href="#/swap" className={styles.logoContainer}>
              <UniIconMobile width="44" height="44" className={styles.logo} />
            </Box>
            <ChainSwitcher isMobile={true} />
          </Box>
          <Box className={styles.rightSideMobileContainer}>
            <Row gap="16">
              <SearchBar />
              <MobileSideBar />
            </Row>
          </Box>
        </Box>
      </nav>
      <Box className={styles.mobileWalletContainer}>
        <Wallet />
      </Box>
    </>
  )
}

// TODO deprecate old wallet
const Wallet = () => {
  const { account } = useWeb3React()
  return (
    <AccountElement active={!!account}>
      <Web3Status />
    </AccountElement>
  )
}

const Navbar = () => {
  const { width: windowWidth } = useWindowSize()
  const { pathname } = useLocation()
  const isPoolActive =
    pathname.startsWith('/pool') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/remove') ||
    pathname.startsWith('/increase') ||
    pathname.startsWith('/find')

  if (windowWidth && windowWidth < breakpoints.desktopXl) {
    return <MobileNavbar />
  }

  return (
    <nav className={styles.nav}>
      <Box display="flex" height="full" flexWrap="nowrap" alignItems="stretch">
        <Box className={styles.leftSideContainer}>
          <Box as="a" href="#/swap" className={styles.logoContainer}>
            <UniIcon width="48" height="48" className={styles.logo} />
          </Box>
          <Row gap="8">
            <NavLinkItem href={'/swap'} isActive={pathname.startsWith('/swap')}>
              Swap
            </NavLinkItem>
            <NavLinkItem href={'/explore'} isActive={pathname.startsWith('/explore')}>
              Explore
            </NavLinkItem>
            <NavLinkItem href={'/pool'} id={'pool-nav-link'} isActive={isPoolActive}>
              Pool
            </NavLinkItem>
          </Row>
        </Box>
        <Box className={styles.middleContainer}>
          <SearchBar />
        </Box>
        <Box className={styles.rightSideContainer}>
          <Row gap="12">
            <MenuDropdown />
            <ChainSwitcher />
            <Wallet />
          </Row>
        </Box>
      </Box>
    </nav>
  )
}

export default Navbar
