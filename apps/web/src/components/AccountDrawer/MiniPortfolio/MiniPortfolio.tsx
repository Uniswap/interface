import { InterfaceElementName, InterfaceSectionName, SharedEventName } from '@uniswap/analytics-events'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { PortfolioRowWrapper } from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import Column from 'components/deprecated/Column'
import { AutoRow } from 'components/deprecated/Row'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { atom, useAtom } from 'jotai'
import styled, { useTheme } from 'lib/styled-components'
import { Suspense, lazy, useEffect, useState } from 'react'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { Loader } from 'ui/src/loading/Loader'
import { breakpoints } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'

const Tokens = lazy(() => import('components/AccountDrawer/MiniPortfolio/Tokens/TokensTab'))
const NFTs = lazy(() => import('components/AccountDrawer/MiniPortfolio/NFTs/NFTTab'))
const Pools = lazy(() => import('components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'))
const ActivityTab = lazy(() =>
  import('components/AccountDrawer/MiniPortfolio/Activity/ActivityTab').then((module) => ({
    default: module.ActivityTab,
  })),
)

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
    color: ${({ theme, active }) => (active ? theme.neutral1Hovered : theme.neutral2Hovered)};
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
    component: () => (
      <Suspense fallback={<Loader.Box />}>
        <Tokens />
      </Suspense>
    ),
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_TOKENS_TAB,
  },
  {
    title: <Trans i18nKey="common.nfts" />,
    key: 'nfts',
    component: ({ account }: { account: string }) => (
      <Suspense fallback={<Loader.Box />}>
        <NFTs account={account} />
      </Suspense>
    ),
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_NFT_TAB,
  },
  {
    title: <Trans i18nKey="common.pools" />,
    key: 'pools',
    component: ({ account }: { account: string }) => (
      <Suspense fallback={<Loader.Box />}>
        <Pools account={account} />
      </Suspense>
    ),
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_POOLS_TAB,
  },
  {
    title: <Trans i18nKey="common.activity" />,
    key: 'activity',
    component: ({ account }: { account: string }) => (
      <Suspense fallback={<Loader.Box />}>
        <ActivityTab account={account} />
      </Suspense>
    ),
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_ACTIVITY_TAB,
  },
]

export default function MiniPortfolio({ account }: { account: string }) {
  const theme = useTheme()
  const [lastPage, setLastPage] = useAtom(lastPageAtom)
  // Resumes at the last viewed page
  const [currentPage, setCurrentPage] = useState(lastPage)
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
