import { SharedEventName } from '@uniswap/analytics-events'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import Column from 'components/deprecated/Column'
import { AutoRow } from 'components/deprecated/Row'
import { atom, useAtom } from 'jotai'
import styled, { useTheme } from 'lib/styled-components'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { Loader } from 'ui/src/loading/Loader'
import { breakpoints } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'

const Tokens = lazy(() => import('components/AccountDrawer/MiniPortfolio/Tokens/TokensTab'))
const NFTs = lazy(() => import('components/AccountDrawer/MiniPortfolio/NFTs/NFTTab'))
const SharedNFTs = lazy(() => import('components/AccountDrawer/MiniPortfolio/NFTs/NftTabShared'))
const Pools = lazy(() => import('components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'))
const ActivityTab = lazy(() =>
  import('components/AccountDrawer/MiniPortfolio/Activity/ActivityTab').then((module) => ({
    default: module.ActivityTab,
  })),
)
const ActivityTabShared = lazy(() => import('components/AccountDrawer/MiniPortfolio/Activity/ActivityTabShared'))

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

  .portfolio-row-wrapper {
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
  title: string
  key: string
  component: ({ account }: { account: string }) => JSX.Element
  loggingElementName: ElementName
}

export default function MiniPortfolio({ account }: { account: string }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const sharedPortfolioUIEnabled = useFeatureFlag(FeatureFlags.SharedPortfolioUI)

  // Resumes at the last viewed page
  const [lastPage, setLastPage] = useAtom(lastPageAtom)
  const [currentPage, setCurrentPage] = useState(lastPage)
  useEffect(() => void setLastPage(currentPage), [currentPage, setLastPage])

  const pages: Page[] = useMemo(
    () => [
      {
        title: t('common.tokens'),
        key: 'tokens',
        component: () => (
          <Suspense fallback={<Loader.Box />}>
            <Tokens />
          </Suspense>
        ),
        loggingElementName: ElementName.MiniPortfolioTokensTab,
      },
      {
        title: t('common.nfts'),
        key: 'nfts',
        component: ({ account }: { account: string }) => (
          <Suspense fallback={<Loader.Box />}>
            {sharedPortfolioUIEnabled ? <SharedNFTs owner={account} /> : <NFTs account={account} />}
          </Suspense>
        ),
        loggingElementName: ElementName.MiniPortfolioNftTab,
      },
      {
        title: t('common.pools'),
        key: 'pools',
        component: ({ account }: { account: string }) => (
          <Suspense fallback={<Loader.Box />}>
            <Pools account={account} />
          </Suspense>
        ),
        loggingElementName: ElementName.MiniPortfolioPoolsTab,
      },
      {
        title: t('common.activity'),
        key: 'activity',
        component: ({ account }: { account: string }) => (
          <Suspense fallback={<Loader.Box />}>
            {sharedPortfolioUIEnabled ? <ActivityTabShared account={account} /> : <ActivityTab account={account} />}
          </Suspense>
        ),
        loggingElementName: ElementName.MiniPortfolioActivityTab,
      },
    ],
    [t, sharedPortfolioUIEnabled],
  )

  const { component: Page, key: currentKey } = pages[currentPage]

  // Activity related fields
  const [activityUnread, setActivityUnread] = useState(false)
  const { hasPendingActivity } = usePendingActivity()

  useEffect(() => {
    if (hasPendingActivity && currentKey !== 'activity') {
      setActivityUnread(true)
    }
  }, [currentKey, hasPendingActivity])

  return (
    <Trace section={SectionName.MiniPortfolio}>
      <Wrapper>
        <Nav data-testid="mini-portfolio-navbar">
          {pages.map(({ title, loggingElementName, key }, index) => {
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
                <NavItem
                  onClick={handleNavItemClick}
                  active={currentPage === index}
                  key={key}
                  data-testid={loggingElementName}
                >
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
