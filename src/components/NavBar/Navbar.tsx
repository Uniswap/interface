import { Trans } from '@lingui/macro'
import Web3Status from 'components/Web3Status'
import { NftVariant, useNftFlag } from 'featureFlags/flags/nft'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation } from 'react-router-dom'

import { Box } from '../../nft/components/Box'
import { Row } from '../../nft/components/Flex'
import { UniIcon } from '../../nft/components/icons'
import { ChainSwitcher } from './ChainSwitcher'
import { MenuDropdown } from './MenuDropdown'
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

const PageTabs = () => {
  const { pathname } = useLocation()
  const nftFlag = useNftFlag()

  const isPoolActive =
    pathname.startsWith('/pool') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/remove') ||
    pathname.startsWith('/increase') ||
    pathname.startsWith('/find')

  return (
    <>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans>Swap</Trans>
      </MenuItem>
      <MenuItem href="/tokens" isActive={pathname.startsWith('/tokens')}>
        <Trans>Tokens</Trans>
      </MenuItem>
      {nftFlag === NftVariant.Enabled && (
        <MenuItem href="/nfts" isActive={pathname.startsWith('/nfts')}>
          <Trans>NFTs</Trans>
        </MenuItem>
      )}
      <MenuItem href="/pool" id={'pool-nav-link'} isActive={isPoolActive}>
        <Trans>Pool</Trans>
      </MenuItem>
    </>
  )
}

const Navbar = () => {
  return (
    <>
      <nav className={styles.nav}>
        <Box display="flex" height="full" flexWrap="nowrap" alignItems="stretch">
          <Box className={styles.leftSideContainer}>
            <Box as="a" href="#/swap" className={styles.logoContainer}>
              <UniIcon width="48" height="48" className={styles.logo} />
            </Box>
            <Box display={{ sm: 'flex', lg: 'none' }}>
              <ChainSwitcher leftAlign={true} />
            </Box>
            <Row gap="8" display={{ sm: 'none', lg: 'flex' }}>
              <PageTabs />
            </Row>
          </Box>
          <Box className={styles.middleContainer}>
            <SearchBar />
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box display={{ sm: 'flex', xl: 'none' }}>
                <SearchBar />
              </Box>
              <Box display={{ sm: 'none', lg: 'flex' }}>
                <MenuDropdown />
              </Box>
              <Box display={{ sm: 'none', lg: 'flex' }}>
                <ChainSwitcher />
              </Box>

              <Web3Status />
            </Row>
          </Box>
        </Box>
      </nav>
      <Box className={styles.mobileBottomBar}>
        <PageTabs />
        <MenuDropdown />
      </Box>
    </>
  )
}

export default Navbar
