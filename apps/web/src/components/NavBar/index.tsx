import { useWeb3React } from '@web3-react/core'
import { UniIcon } from 'components/Logo/UniIcon'
import Web3Status from 'components/Web3Status'
// import { chainIdToBackendName } from 'graphql/data/util'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
// import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { Trans, t } from 'i18n'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { Text } from 'rebass'
// import { GetTheAppButton } from 'pages/Landing/components/DownloadApp/GetTheAppButton'
import { ReactNode, useCallback, useState } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Z_INDEX } from 'theme/zIndex'
// import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useIsNavSearchInputVisible } from '../../nft/hooks/useIsNavSearchInputVisible'
import { Bag } from './Bag'
import Blur from './Blur'
import { ChainSelector } from './ChainSelector'
import { More } from './More'
// import { SearchBar } from './SearchBar'
import { ChainId } from '@ubeswap/sdk-core'
import Modal from 'components/Modal'
import { UBE } from 'constants/tokens'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { Moon, Sun } from 'react-feather'
import { HideSmall, ThemedText } from 'theme/components'
import { ThemeMode, useDarkModeManager } from 'theme/components/ThemeToggle'
import { relevantDigits } from 'utils/relevantDigits'
import UbeBalanceContent from './UbeBalanceContent'
import * as styles from './style.css'

const Nav = styled.nav`
  padding: ${({ theme }) => `${theme.navVerticalPad}px 12px`};
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: ${Z_INDEX.sticky};
`

export const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};
  margin-left: 8px;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 12px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`

const UBEAmount = styled(AccountElement)`
  color: white;
  padding: 4px 8px;
  height: 36px;
  font-weight: 500;
  background: radial-gradient(
      174.47% 188.91% at 1.84% 0%,
      ${({ theme }) => theme.primary1} 0%,
      ${({ theme }) => theme.primary3} 100%
    ),
    #edeef2;
`

const UBEWrapper = styled.span`
  width: fit-content;
  display: flex;
  gap: 2px;
  position: relative;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
  :active {
    opacity: 0.9;
  }
`

// RocketIcon  tip tanımlaması
interface RocketIconProps {
  isClickable?: boolean
  onClick?: () => void
  className?: string
  'data-testid'?: string
}

// Roket ikonunu stil ve özellikler
const RocketIcon = styled.img<RocketIconProps>`
  width: 28px;
  height: 28px;
  cursor: default;
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
  // const { chainId: connectedChainId } = useWeb3React()
  // const chainName = chainIdToBackendName(connectedChainId)

  const isPoolActive = useIsPoolsPage()
  const isNftPage = useIsNftPage()

  const shouldDisableNFTRoutes = useDisableNFTRoutes()

  return (
    <>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans>Swap</Trans>
      </MenuItem>
      <Box display={{ sm: 'flex', lg: 'none', xxl: 'flex' }} width="full">
        <MenuItem href="/pool" dataTestId="pool-nav-link" isActive={isPoolActive}>
          <Trans>Pool</Trans>
        </MenuItem>
      </Box>
      <MenuItem href="/earn" isActive={pathname.startsWith('/earn')}>
        <Trans>Earn</Trans>
      </MenuItem>
      <MenuItem href="/claim-new-ube" isActive={pathname.startsWith('/claim-new')}>
        <Trans>Convert</Trans>
      </MenuItem>
      {/*<MenuItem href="/stake" isActive={pathname.startsWith('/stake')}>
        <Trans>Stake</Trans>
      </MenuItem>
      <MenuItem href="/farm" isActive={pathname.startsWith('/farm')}>
        <Trans>Farm</Trans>
      </MenuItem>*/}
      {!shouldDisableNFTRoutes && (
        <MenuItem dataTestId="nft-nav" href="/nfts" isActive={isNftPage}>
          <Trans>NFTs</Trans>
        </MenuItem>
      )}
      {/*<MenuItem
          href={'/explore' + (chainName !== Chain.Ethereum ? `/${chainName.toLowerCase()}` : '')}
          isActive={pathname.startsWith('/explore')}
        >
          <Trans>Explore</Trans>
      </MenuItem>*/}
      <More />
    </>
  )
}

const Navbar = ({ blur }: { blur: boolean }) => {
  const isNftPage = useIsNftPage()
  // const isLandingPage = useIsLandingPage()
  const sellPageState = useProfilePageState((state) => state.state)
  const navigate = useNavigate()
  const isNavSearchInputVisible = useIsNavSearchInputVisible()
  const location = useLocation()
  const isUbestarterPage = location.pathname.startsWith('/ubestarter')

  const { account } = useWeb3React()
  const [accountDrawerOpen, toggleAccountDrawer] = useAccountDrawer()
  const handleUniIconClick = useCallback(() => {
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

  const [isDarkMode, setMode] = useDarkModeManager()
  const toggleDarkMode = () => {
    if (isDarkMode) {
      setMode(ThemeMode.LIGHT)
    } else {
      setMode(ThemeMode.DARK)
    }
  }

  const [showUbeBalanceModal, setShowUbeBalanceModal] = useState<boolean>(false)
  const ubeBalance = useTokenBalance(account ?? undefined, UBE[ChainId.CELO])
  const ubeBalanceFormatted = relevantDigits(ubeBalance)

  return (
    <>
      {blur && <Blur />}
      <Nav>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box className={styles.logoContainer}>
              {isUbestarterPage ? (
                <>
                  <RocketIcon
                    src="/images/rocket-purple.png"
                    data-testid="ubestarter-logo"
                    className={styles.logo}
                    alt="Ubestarter Logo"
                  />
                  <Text fontSize={24} marginTop={-1} style={{ cursor: 'pointer' }}>
                    Ubestarter
                  </Text>
                </>
              ) : (
                <>
                  <UniIcon
                    width="28"
                    height="28"
                    data-testid="uniswap-logo"
                    className={styles.logo}
                    clickable={!account}
                    onClick={handleUniIconClick}
                  />
                  <Text fontSize={24} marginTop={-1}>
                    Ubeswap
                  </Text>
                </>
              )}
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
            className={styles.searchContainer}
            {...(isNavSearchInputVisible && {
              display: 'flex',
            })}
          >
            {/* <SearchBar /> */}
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box position="relative" display={isNavSearchInputVisible ? 'none' : { sm: 'flex' }}>
                {/* <SearchBar /> */}
              </Box>
              {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
              {!isNftPage && (
                <Box display={{ sm: 'none', lg: 'flex' }}>
                  <ChainSelector />
                </Box>
              )}
              {ubeBalance && (
                <HideSmall>
                  <UBEWrapper onClick={() => setShowUbeBalanceModal(true)}>
                    <UBEAmount active={!!account} style={{ pointerEvents: 'auto' }}>
                      {account && (
                        <ThemedText.DeprecatedWhite
                          style={{
                            paddingRight: '.4rem',
                          }}
                        >
                          {ubeBalanceFormatted}
                        </ThemedText.DeprecatedWhite>
                      )}
                      UBE
                    </UBEAmount>
                  </UBEWrapper>
                </HideSmall>
              )}
              <StyledMenuButton aria-label={t('Toggle Dark Mode')} onClick={() => toggleDarkMode()}>
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </StyledMenuButton>
              {/* isLandingPage && <GetTheAppButton /> */}
              <Web3Status />
            </Row>
          </Box>
        </Box>
      </Nav>
      <Modal isOpen={showUbeBalanceModal} onDismiss={() => setShowUbeBalanceModal(false)}>
        <UbeBalanceContent setShowUbeBalanceModal={setShowUbeBalanceModal} />
      </Modal>
    </>
  )
}

export default Navbar
