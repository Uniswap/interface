import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { UniIcon } from 'components/Logo/UniIcon'
import { Bag } from 'components/NavBar/Bag'
import { ChainSelector } from 'components/NavBar/ChainSelector'
import { GetTheAppButton } from 'components/NavBar/DownloadApp/GetTheAppButton'
import Blur from 'components/NavBar/LEGACY/Blur'
import { More } from 'components/NavBar/LEGACY/Menu'
import { SearchBar } from 'components/NavBar/LEGACY/SearchBar/SearchBar'
import * as styles from 'components/NavBar/LEGACY/style.css'
import Web3Status from 'components/Web3Status'
import { chainIdToBackendChain } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useIsLimitPage } from 'hooks/useIsLimitPage'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { useIsSendPage } from 'hooks/useIsSendPage'
import { useIsSwapPage } from 'hooks/useIsSwapPage'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useProfilePageState } from 'nft/hooks'
import { useIsNavSearchInputVisible } from 'nft/hooks/useIsNavSearchInputVisible'
import { ProfilePageStateType } from 'nft/types'
import { ReactNode, useCallback } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import { Z_INDEX } from 'theme/zIndex'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const Nav = styled.nav`
  position: relative;
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
  const account = useAccount()
  const chainName = chainIdToBackendChain({ chainId: account.chainId, withFallback: true })

  const isPoolActive = useIsPoolsPage()
  const isNftPage = useIsNftPage()

  const shouldDisableNFTRoutes = useDisableNFTRoutes()

  return (
    <>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans i18nKey="common.swap" />
      </MenuItem>
      <MenuItem
        href={'/explore' + (chainName !== Chain.Ethereum ? `/${chainName.toLowerCase()}` : '')}
        isActive={pathname.startsWith('/explore')}
      >
        <Trans i18nKey="common.explore" />
      </MenuItem>
      {!shouldDisableNFTRoutes && (
        <MenuItem dataTestId="nft-nav" href="/nfts" isActive={isNftPage}>
          <Trans i18nKey="common.nfts" />
        </MenuItem>
      )}
      <Box display={{ sm: 'flex', lg: 'none', xxl: 'flex' }} width="full">
        <MenuItem href="/pool" dataTestId="pool-nav-link" isActive={isPoolActive}>
          <Trans i18nKey="common.pool" />
        </MenuItem>
      </Box>
      <More />
    </>
  )
}

const LegacyNavbar = ({ blur }: { blur: boolean }) => {
  const isNftPage = useIsNftPage()
  const isSwapPage = useIsSwapPage()
  const isSendPage = useIsSendPage()
  const isLimitPage = useIsLimitPage()
  const isLandingPage = useIsLandingPage()
  const sellPageState = useProfilePageState((state) => state.state)
  const navigate = useNavigate()
  const isNavSearchInputVisible = useIsNavSearchInputVisible()
  const multichainUXEnabled = useFeatureFlag(FeatureFlags.MultichainUX)

  const account = useAccount()
  const accountDrawer = useAccountDrawer()

  const hideChainSelector = multichainUXEnabled ? isSendPage || isSwapPage || isLimitPage || isNftPage : isNftPage

  const handleUniIconClick = useCallback(() => {
    if (account.isConnected) {
      return
    }
    accountDrawer.close()
    navigate({
      pathname: '/',
      search: '?intro=true',
    })
  }, [account.isConnected, accountDrawer, navigate])

  return (
    <>
      {blur && <Blur />}
      <Nav>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box className={styles.logoContainer}>
              <UniIcon
                width="48"
                height="48"
                data-testid="uniswap-logo"
                className={styles.logo}
                clickable={!account}
                onClick={handleUniIconClick}
              />
            </Box>
            {hideChainSelector ? null : (
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
              {hideChainSelector ? null : (
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

export default LegacyNavbar
