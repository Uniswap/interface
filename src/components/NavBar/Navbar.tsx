import Web3Status from 'components/Web3Status'
import { NftVariant, useNftFlag } from 'featureFlags/flags/nft'
import { useWindowSize } from 'hooks/useWindowSize'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation } from 'react-router-dom'

import { Box } from '../../nft/components/Box'
import { Row } from '../../nft/components/Flex'
import { UniIcon, UniIconMobile } from '../../nft/components/icons'
import { breakpoints } from '../../nft/css/sprinkles.css'
import { ChainSwitcher } from './ChainSwitcher'
import { MenuDropdown } from './MenuDropdown'
import { MobileSideBar } from './MobileSidebar'
import * as styles from './Navbar.css'
import { SearchBar } from './SearchBar'

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
}

const MenuItem = ({ href, id, isActive, children }: MenuItemProps) => {
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
        <Web3Status />
      </Box>
    </>
  )
}

const Navbar = () => {
  const { width: windowWidth } = useWindowSize()
  const { pathname } = useLocation()
  const nftFlag = useNftFlag()

  if (windowWidth && windowWidth < breakpoints.desktopXl) {
    return <MobileNavbar />
  }

  const isPoolActive =
    pathname.startsWith('/pool') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/remove') ||
    pathname.startsWith('/increase') ||
    pathname.startsWith('/find')

  return (
    <nav className={styles.nav}>
      <Box display="flex" height="full" flexWrap="nowrap" alignItems="stretch">
        <Box className={styles.leftSideContainer}>
          <Box as="a" href="#/swap" className={styles.logoContainer}>
            <UniIcon width="48" height="48" className={styles.logo} />
          </Box>
          <Row gap="8">
            <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
              Swap
            </MenuItem>
            <MenuItem href="/tokens" isActive={pathname.startsWith('/tokens')}>
              Tokens
            </MenuItem>
            {nftFlag === NftVariant.Enabled && (
              <MenuItem href="/nfts" isActive={pathname.startsWith('/nfts')}>
                NFTs
              </MenuItem>
            )}
            <MenuItem href="/pool" id={'pool-nav-link'} isActive={isPoolActive}>
              Pool
            </MenuItem>
          </Row>
        </Box>
        <Box className={styles.middleContainer}>
          <SearchBar />
        </Box>
        <Box className={styles.rightSideContainer}>
          <Row gap="12">
            <MenuDropdown />
            <ChainSwitcher />
            <Web3Status />
          </Row>
        </Box>
      </Box>
    </nav>
  )
}

export default Navbar
