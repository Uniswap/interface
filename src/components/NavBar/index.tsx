import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Web3Status from 'components/Web3Status'
import { chainIdToBackendName } from 'graphql/utils/util'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { useAtomValue } from 'jotai'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { PegasysIcon } from 'nft/components/icons'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import styled, { useTheme } from 'styled-components/macro'

import { Bag } from './Bag'
import Blur from './Blur'
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

const NavBody = styled.div`
  display: flex;
  border-radius: 30px;
  align-items: center;
  gap: 5px;
`

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
  dataTestId?: string
  background: string
}

const MenuItem = ({ href, dataTestId, id, isActive, children, background }: MenuItemProps) => {
  return (
    <NavLink
      to={href}
      className={isActive ? styles.activeMenuItem : styles.menuItem}
      id={id}
      style={{ textDecoration: 'none', background }}
      data-testid={dataTestId}
    >
      {children}
    </NavLink>
  )
}

export const PageTabs = () => {
  const { pathname } = useLocation()
  const { chainId: connectedChainId } = useWeb3React()
  const chainName = chainIdToBackendName(connectedChainId)?.toLowerCase() ?? ''
  const theme = useTheme()
  const isPoolActive = useIsPoolsPage()
  const isNftPage = useIsNftPage()

  const shouldDisableNFTRoutes = useAtomValue(shouldDisableNFTRoutesAtom)

  return (
    <NavBody>
      <MenuItem
        href="/swap"
        isActive={pathname.startsWith('/swap')}
        background={pathname.startsWith('/swap') ? theme.backgroundNavBarButton : 'none'}
      >
        <Trans>Swap</Trans>
      </MenuItem>
      <MenuItem
        href="/farm"
        isActive={pathname.startsWith('/farm')}
        background={pathname.startsWith('/farm') ? theme.backgroundNavBarButton : 'none'}
      >
        <Trans>Farm</Trans>
      </MenuItem>
      <MenuItem
        href={`/tokens/${chainName}`}
        isActive={pathname.startsWith('/tokens')}
        background={pathname.startsWith('/tokens') ? theme.backgroundNavBarButton : 'none'}
      >
        <Trans>Tokens</Trans>
      </MenuItem>
      {!shouldDisableNFTRoutes && (
        <MenuItem
          dataTestId="nft-nav"
          href="/nfts"
          isActive={isNftPage}
          background={isNftPage ? theme.backgroundNavBarButton : 'none'}
        >
          <Trans>NFTs</Trans>
        </MenuItem>
      )}
      <Box display={{ sm: 'flex', lg: 'none', xxl: 'flex' }} width="full">
        <MenuItem
          href="/pools"
          dataTestId="pool-nav-link"
          isActive={isPoolActive}
          background={isPoolActive ? theme.backgroundNavBarButton : 'none'}
        >
          <Trans>Pools</Trans>
        </MenuItem>
      </Box>
      <Box marginY={{ sm: '4', md: 'unset' }}>
        <MenuDropdown />
      </Box>
    </NavBody>
  )
}

const Navbar = ({ blur }: { blur: boolean }) => {
  const isNftPage = useIsNftPage()
  const sellPageState = useProfilePageState((state) => state.state)
  const navigate = useNavigate()

  return (
    <>
      {blur && <Blur />}
      <Nav>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box className={styles.logoContainer}>
              <PegasysIcon
                width="48"
                height="48"
                data-testid="pegasys-logo"
                className={styles.logo}
                onClick={() => {
                  navigate({
                    pathname: '/',
                    search: '?intro=true',
                  })
                }}
              />
            </Box>
            {!isNftPage && (
              <Box display={{ sm: 'flex', lg: 'none' }}>
                <ChainSelector leftAlign={true} />
              </Box>
            )}
            <Row display={{ sm: 'none', lg: 'flex' }}>
              <PageTabs />
            </Row>
          </Box>
          <Box className={styles.searchContainer}>
            <SearchBar />
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box position="relative" display={{ sm: 'flex', navSearchInputVisible: 'none' }}>
                <SearchBar />
              </Box>
              {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
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
