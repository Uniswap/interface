import { Trans } from '@lingui/macro'
import Web3Status from 'components/Web3Status'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { ChainSelector } from './ChainSelector'
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

  const isPoolActive =
    (pathname.startsWith('/pool') ||
      pathname.startsWith('/add') ||
      pathname.startsWith('/remove') ||
      pathname.startsWith('/increase')) &&
    !pathname.startsWith('/pools')

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans>Swap</Trans>
      </MenuItem>
      <MenuItem href="/pools" isActive={pathname.startsWith('/pools')}>
        <Trans>Pools</Trans>
      </MenuItem>
      <MenuItem href="/pool" id="pool-nav-link" isActive={isPoolActive}>
        <Trans>Add Liquidity</Trans>
      </MenuItem>
    </div>
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
              <img
                onClick={() => {
                  navigate({
                    pathname: '/',
                    search: '?intro=true',
                  })
                }}
                className={styles.logo}
                style={{ width: '48px', height: '48px' }}
                src="/images/ForgeIcon.png"
              />
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

          <Box className={styles.rightSideContainer}>
            <Row gap="12">
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
