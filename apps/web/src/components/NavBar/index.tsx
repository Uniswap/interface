import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { UniIcon } from 'components/Logo/UniIcon'
import Web3Status from 'components/Web3Status'
//import { chainIdToBackendChain } from 'constants/chains'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { Trans } from 'i18n'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { GetTheAppButton } from 'pages/Landing/components/DownloadApp/GetTheAppButton'
import { ReactNode, useCallback } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'
//import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
//import { useChainId } from 'wagmi'

import { useIsNavSearchInputVisible } from '../../nft/hooks/useIsNavSearchInputVisible'
import { Bag } from './Bag'
import Blur from './Blur'
import { ChainSelector } from './ChainSelector'
import { More } from './More'
import { SearchBar } from './SearchBar'
import * as styles from './style.css'

const Nav = styled.nav`
  padding: ${({ theme }) => `${theme.navVerticalPad}px 12px`};
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: ${Z_INDEX.sticky};
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
  //const chainId = useChainId()
  //const chainName = chainIdToBackendChain({ chainId, withFallback: true })

  const isPoolActive = useIsPoolsPage()
  const isNftPage = useIsNftPage()

  const shouldDisableNFTRoutes = useDisableNFTRoutes()

  return (
    <>
      <MenuItem href="/mint" isActive={pathname.startsWith('/mint')}>
        <Trans>Mint</Trans>
      </MenuItem>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans>Swap</Trans>
      </MenuItem>
      {/*
      <MenuItem
        href={'/explore' + (chainName !== Chain.Ethereum ? `/${chainName.toLowerCase()}` : '')}
        isActive={pathname.startsWith('/explore')}
      >
        <Trans>Explore</Trans>
      </MenuItem>
      */}
      {!shouldDisableNFTRoutes && (
        <MenuItem dataTestId="nft-nav" href="/nfts" isActive={isNftPage}>
          <Trans>NFTs</Trans>
        </MenuItem>
      )}
      <MenuItem href="/pool" id="pool-nav-link" isActive={isPoolActive}>
        <Trans>Earn</Trans>
      </MenuItem>
      <Box display={{ sm: 'flex', lg: 'none', xxl: 'flex' }} width="full">
        <MenuItem href="/stake" isActive={pathname.startsWith('/stake')}>
          <Trans>Stake</Trans>
        </MenuItem>
      </Box>
      <More />
    </>
  )
}

const Navbar = ({ blur }: { blur: boolean }) => {
  const isNftPage = useIsNftPage()
  const isLandingPage = useIsLandingPage()
  const sellPageState = useProfilePageState((state) => state.state)
  const navigate = useNavigate()
  const isNavSearchInputVisible = useIsNavSearchInputVisible()

  const { account } = useWeb3React()
  const [accountDrawerOpen, toggleAccountDrawer] = useAccountDrawer()
  const handleGrgIconClick = useCallback(() => {
    if (account) {
      return
    }
    if (accountDrawerOpen) {
      toggleAccountDrawer()
    }
    navigate({
      pathname: '/',
      search: '?intro=true',
    })
  }, [account, accountDrawerOpen, navigate, toggleAccountDrawer])

  return (
    <>
      {blur && <Blur />}
      <Nav>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box as="a" href="#/mint" className={styles.logoContainer}>
              <UniIcon
                width="48"
                height="48"
                data-testid="rigoblock.logo"
                className={styles.logo}
                clickable={!account}
                onClick={handleGrgIconClick}
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
          <Box
            data-cy="center-search-container"
            className={styles.searchContainer}
            {...(isNavSearchInputVisible && {
              display: 'flex',
            })}
          >
            <SearchBar />
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box
                data-cy="right-search-container"
                position="relative"
                display={isNavSearchInputVisible ? 'none' : { sm: 'flex' }}
              >
                <SearchBar />
              </Box>
              {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
              {!isNftPage && (
                <Box display={{ sm: 'none', lg: 'flex' }}>
                  <ChainSelector />
                </Box>
              )}
              {isLandingPage && <GetTheAppButton />}
              <Web3Status />
            </Row>
          </Box>
        </Box>
      </Nav>
    </>
  )
}

export default Navbar
