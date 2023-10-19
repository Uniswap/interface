import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer'
import Web3Status from 'components/Web3Status'
import { chainIdToBackendName } from 'graphql/data/util'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { Dex51Icon, GithubIconMenu, TwitterIconMenu, WorldIconMenu } from 'nft/components/icons'
import { themeVars } from 'nft/css/sprinkles.css'
import { ReactNode, useCallback } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useIsNavSearchInputVisible } from '../../nft/hooks/useIsNavSearchInputVisible'
import Blur from './Blur'
import { ChainSelector } from './ChainSelector'
import * as menu from './MenuDropdown.css'
import { SearchBar } from './SearchBar'
import * as styles from './style.css'

const Nav = styled.nav`
  padding: ${({ theme }) => `${theme.navVerticalPad}px 12px`};
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: 2;
`
const NavAnalytics = styled.a`
  color: ${({ theme }) => theme.neutral2};
  padding: 6px 10px;
  text-decoration: none;
  &:hover {
    background-color: ${({ theme }) => theme.lightGrayOverlay};
    border-radius: 10px;
  }
`
const IconRow = ({ children }: { children: ReactNode }) => {
  return <Row className={menu.IconRow}>{children}</Row>
}

const Icon = ({ href, children }: { href?: string; children: ReactNode }) => {
  return (
    <>
      <Box
        as={href ? 'a' : 'div'}
        href={href ?? undefined}
        target={href ? '_blank' : undefined}
        rel={href ? 'noopener noreferrer' : undefined}
        display="flex"
        flexDirection="column"
        color="neutral1"
        background="none"
        border="none"
        justifyContent="center"
        textAlign="center"
        marginRight="4"
      >
        {children}
      </Box>
    </>
  )
}

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

  return (
    <>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans>Swap</Trans>
      </MenuItem>
      <MenuItem href={`/tokens/${chainName.toLowerCase()}`} isActive={pathname.startsWith('/tokens')}>
        <Trans>Tokens</Trans>
      </MenuItem>
      <NavAnalytics href="https://info.uniswap.org/#/" target="_blank" rel="noreferrer">
        <Trans>Analytics</Trans>
      </NavAnalytics>
      {/* <Box marginY="4">
        <MenuDropdown />
      </Box> */}
    </>
  )
}

const Navbar = ({ blur }: { blur: boolean }) => {
  const navigate = useNavigate()
  const isNavSearchInputVisible = useIsNavSearchInputVisible()

  const [accountDrawerOpen, toggleAccountDrawer] = useAccountDrawer()

  const handleDex51IconClick = useCallback(() => {
    if (accountDrawerOpen) {
      toggleAccountDrawer()
    }
    navigate({
      pathname: '/',
      search: '?intro=true',
    })
  }, [accountDrawerOpen, navigate, toggleAccountDrawer])

  return (
    <>
      {blur && <Blur />}
      <Nav>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box className={styles.logoContainer}>
              <Dex51Icon
                width="85"
                height="20"
                data-testid="uniswap-logo"
                className={styles.logo}
                onClick={handleDex51IconClick}
              />
            </Box>
            <Box display={{ sm: 'flex', lg: 'none' }}>
              <ChainSelector leftAlign={true} />
            </Box>
            <Row display={{ sm: 'none', lg: 'flex' }}>
              <PageTabs />
            </Row>
          </Box>
          <Box
            className={styles.searchContainer}
            {...(isNavSearchInputVisible && {
              display: 'flex',
            })}
          >
            <SearchBar />
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box position="relative" display={isNavSearchInputVisible ? 'none' : { sm: 'flex' }}>
                <SearchBar />
              </Box>
              <Icon href="https://a51.finance/">
                <WorldIconMenu className={menu.hover} width={15} height={15} color={themeVars.colors.neutral2} />
              </Icon>
              <Icon href="https://twitter.com/A51_Fi">
                <TwitterIconMenu className={menu.hover} width={24} height={24} color={themeVars.colors.neutral2} />
              </Icon>
              <Icon href="https://github.com/a51finance/a51-uniswap-fork">
                <GithubIconMenu className={menu.hover} width={24} height={24} color={themeVars.colors.neutral2} />
              </Icon>
              <Box display={{ sm: 'none', lg: 'flex' }}>
                <ChainSelector />
              </Box>

              <Web3Status />
            </Row>
          </Box>
        </Box>
      </Nav>
    </>
  )
}

export default Navbar
