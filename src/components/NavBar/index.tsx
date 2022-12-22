import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Web3Status from 'components/Web3Status'
import { chainIdToBackendName } from 'graphql/data/util'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { UniIcon } from 'nft/components/icons'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { Bag } from './Bag'
import { ChainSelector } from './ChainSelector'
import { MenuDropdown } from './MenuDropdown'
import { SearchBar } from './SearchBar'
import * as styles from './style.css'

const Nav = styled.nav`
  padding: 20px 12px;
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: 2;
`

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
  dataTestId?: string
}

const MenuItem = ({ href, dataTestId, id, isActive, children }: MenuItemProps) => {
  return (
    <NavLink
      to={href}
      className={isActive ? styles.activeMenuItem : styles.menuItem}
      id={id}
      style={{ textDecoration: 'none' }}
      data-testid={dataTestId}
    >
      {children}
    </NavLink>
  )
}

export const PageTabs = () => {
  const { pathname } = useLocation()
  const { chainId: connectedChainId } = useWeb3React()
  const chainName = chainIdToBackendName(connectedChainId)

  const isPoolActive =
    pathname.startsWith('/pool') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/remove') ||
    pathname.startsWith('/increase') ||
    pathname.startsWith('/find')

  const isNftPage = useIsNftPage()

  return (
    <>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans>Swap</Trans>
      </MenuItem>
      <MenuItem href={`/tokens/${chainName.toLowerCase()}`} isActive={pathname.startsWith('/tokens')}>
        <Trans>Tokens</Trans>
      </MenuItem>
      <MenuItem dataTestId="nft-nav" href="/nfts" isActive={isNftPage}>
        <Trans>NFTs</Trans>
      </MenuItem>
      <MenuItem href="/pool" id="pool-nav-link" isActive={isPoolActive}>
        <Trans>Pool</Trans>
      </MenuItem>
    </>
  )
}

const Navbar = () => {
  const isNftPage = useIsNftPage()
  const navigate = useNavigate()

  return (
    <>
      <Nav>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box className={styles.logoContainer}>
              <UniIcon
                width="48"
                height="48"
                data-testid="uniswap-logo"
                className={styles.logo}
                onClick={() => {
                  navigate({
                    pathname: '/',
                    search: '?intro=true',
                  })
                }}
              />
              <span className={styles.uniFloodHandshake}>🤝</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 161 161"
                width="35"
                height="35"
                className={styles.floodLogo}
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M80 19A75 75 0 0 0 5 94h27.273c0-.192 0-.383.003-.575.141 12.961 5.153 25.361 13.976 34.537C55.202 137.27 67.342 142.5 80 142.5c12.659 0 24.798-5.23 33.749-14.538 8.814-9.167 13.824-21.549 13.975-34.496l.003.534H155a75 75 0 0 0-75-75Zm47.57 71.133A23.862 23.862 0 0 0 80 92.863h47.714H80c0 6.582-2.514 12.895-6.989 17.549s-10.545 7.269-16.874 7.269c-6.33 0-12.4-2.615-16.874-7.269-4.37-4.544-6.87-10.668-6.986-17.08a47.726 47.726 0 0 1 81.47-33.08h.001a47.723 47.723 0 0 1 13.822 29.881Z"
                  clipRule="evenodd"
                />
              </svg>
            </Box>
            {!isNftPage && (
              <Box display={{ sm: 'flex', lg: 'none' }}>
                <ChainSelector leftAlign={true} />
              </Box>
            )}
            <Row gap={{ xl: '0', xxl: '8' }} display={{ sm: 'none', lg: 'flex' }}>
              <PageTabs />
            </Row>
          </Box>
          <Box className={styles.searchContainer}>
            <SearchBar />
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box position="relative" display={{ sm: 'flex', xl: 'none' }}>
                <SearchBar />
              </Box>
              <Box display={{ sm: 'none', lg: 'flex' }}>
                <MenuDropdown />
              </Box>
              {isNftPage && <Bag />}
              {!isNftPage && (
                <Box display={{ sm: 'none', lg: 'flex' }}>
                  <ChainSelector />
                </Box>
              )}

              <Web3Status />
            </Row>
          </Box>
        </Box>
      </Nav>
    </>
  )
}

export default Navbar
