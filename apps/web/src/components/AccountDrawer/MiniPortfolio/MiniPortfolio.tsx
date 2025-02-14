import { InterfaceElementName, InterfaceSectionName, SharedEventName } from '@uniswap/analytics-events'
import { ActivityTab } from 'components/AccountDrawer/MiniPortfolio/Activity/ActivityTab'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import NFTs from 'components/AccountDrawer/MiniPortfolio/NFTs/NFTTab'
import Pools from 'components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'
import { PortfolioRowWrapper } from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import Tokens from 'components/AccountDrawer/MiniPortfolio/Tokens/TokensTab'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import Column from 'components/deprecated/Column'
import { AutoRow } from 'components/deprecated/Row'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { atom, useAtom } from 'jotai'
import styled, { useTheme } from 'lib/styled-components'
import { useEffect, useState } from 'react'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { breakpoints } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'

const lastPageAtom = atom(0)

const Wrapper = styled(Column)`
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;

  @media screen and (max-width: ${breakpoints.md}px) {
    margin-bottom: 48px;
  }

  ${PortfolioRowWrapper} {
    &:hover {
      background: ${({ theme }) => theme.deprecated_hoverDefault};
    }
  }
`

const Nav = styled(AutoRow)`
  gap: 20px;
`

const NavItem = styled(ThemedText.SubHeader)<{ active?: boolean }>`
  align-items: center;
  color: ${({ theme, active }) => (active ? theme.neutral1 : theme.neutral2)};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} color`};

  &:hover {
    ${({ theme, active }) => !active && `color: ${theme.neutral2}`};
  }
`

const PageWrapper = styled.div`
  border-radius: 12px;
  margin-right: -16px;
  margin-left: -16px;
  width: calc(100% + 32px);
  flex: 1;
`

interface Page {
  title: React.ReactNode
  key: string
  component: ({ account }: { account: string }) => JSX.Element
  loggingElementName: InterfaceElementName
}

const Pages: Array<Page> = [
  {
    title: <Trans i18nKey="common.tokens" />,
    key: 'tokens',
    component: Tokens,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_TOKENS_TAB,
  },
  {
    title: <Trans i18nKey="common.nfts" />,
    key: 'nfts',
    component: NFTs,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_NFT_TAB,
  },
  {
    title: <Trans i18nKey="common.pools" />,
    key: 'pools',
    component: Pools,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_POOLS_TAB,
  },
  {
    title: <Trans i18nKey="common.activity" />,
    key: 'activity',
    component: ActivityTab,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_ACTIVITY_TAB,
  },
]

export default function MiniPortfolio({ account }: { account: string }) {
  const theme = useTheme()
  const isNFTPage = useIsPage(PageType.NFTS)
  const [lastPage, setLastPage] = useAtom(lastPageAtom)
  // Resumes at the last viewed page, unless you are on an NFT page
  const [currentPage, setCurrentPage] = useState(isNFTPage ? 1 : lastPage)
  useEffect(() => void setLastPage(currentPage), [currentPage, setLastPage])

  const shouldDisableNFTRoutes = useDisableNFTRoutes()
  const [activityUnread, setActivityUnread] = useState(false)

  const { component: Page, key: currentKey } = Pages[currentPage]

  const { hasPendingActivity } = usePendingActivity()

  useEffect(() => {
    if (hasPendingActivity && currentKey !== 'activity') {
      setActivityUnread(true)
    }
  }, [currentKey, hasPendingActivity])

  return (
    <Trace section={InterfaceSectionName.MINI_PORTFOLIO}>
      <Wrapper>
        <Nav data-testid="mini-portfolio-navbar">
          {Pages.map(({ title, loggingElementName, key }, index) => {
            if (shouldDisableNFTRoutes && loggingElementName.includes('nft')) {
              return null
            }
            const isUnselectedActivity = key === 'activity' && currentKey !== 'activity'
            const showActivityIndicator = isUnselectedActivity && (hasPendingActivity || activityUnread)
            const handleNavItemClick = () => {
              setCurrentPage(index)
              if (key === 'activity') {
                setActivityUnread(false)
              }
            }
            return (
              <Trace logPress eventOnTrigger={SharedEventName.NAVBAR_CLICKED} element={loggingElementName} key={index}>
                <NavItem onClick={handleNavItemClick} active={currentPage === index} key={key}>
                  <span>{title}</span>
                  {showActivityIndicator && (
                    <>
                      &nbsp;
                      {hasPendingActivity ? (
                        <LoaderV2 />
                      ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="4" cy="4" r="4" fill={theme.accent1} />
                        </svg>
                      )}
                    </>
                  )}
                </NavItem>
              </Trace>
            )
          })}
        </Nav>
        <PageWrapper data-testid="mini-portfolio-page">
          <Page account={account} />
        </PageWrapper>
      </Wrapper>
    </Trace>
  )
}
