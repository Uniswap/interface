import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfacePageName, SharedEventName } from '@uniswap/analytics-events'
import { Trace, TraceEvent } from 'analytics'
import { TopPoolTable } from 'components/Pools/PoolTable/PoolTable'
import { AutoRow } from 'components/Row'
import { TopTokensTable } from 'components/Tokens/TokenTable'
import NetworkFilter from 'components/Tokens/TokenTable/NetworkFilter'
import OldTokenTable from 'components/Tokens/TokenTable/OldTokenTable'
import SearchBar from 'components/Tokens/TokenTable/SearchBar'
import TimeSelector from 'components/Tokens/TokenTable/TimeSelector'
import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useResetAtom } from 'jotai/utils'
import { ExploreChartsSection } from 'pages/Explore/charts/ExploreChartsSection'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { StyledInternalLink, ThemedText } from 'theme/components'

import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { getTokenExploreURL, isBackendSupportedChain, validateUrlChainParam } from 'graphql/data/util'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useExploreParams } from './redirects'
import RecentTransactions from './tables/RecentTransactions'

const ExploreContainer = styled.div<{ isInfoExplorePageEnabled?: boolean }>`
  width: 100%;
  min-width: 320px;

  ${({ isInfoExplorePageEnabled }) =>
    isInfoExplorePageEnabled
      ? css`
          padding: 48px 40px 0px;

          @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
            padding: 16px;
            padding-bottom: 0px;
          }
        `
      : css`
          padding: 68px 12px 0px;

          @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
            padding-top: 48px;
          }

          @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
            padding-top: 20px;
          }
        `}
`
const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin-left: auto;
  margin-right: auto;
  display: flex;
`
const NavWrapper = styled.div<{ isInfoExplorePageEnabled: boolean }>`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto;
  margin-bottom: ${({ isInfoExplorePageEnabled }) => (isInfoExplorePageEnabled ? '16px' : '20px')};
  color: ${({ theme }) => theme.neutral3};
  flex-direction: row;

  ${({ isInfoExplorePageEnabled }) =>
    isInfoExplorePageEnabled
      ? css`
          justify-content: space-between;
          @media screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
            flex-direction: column;
            gap: 16px;
          }
        `
      : css`
          @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
            flex-direction: column;
            gap: 8px;
          }
        `};
`
const TabBar = styled(AutoRow)`
  gap: 24px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    gap: 16px;
  }
`
const TabItem = styled(ThemedText.HeadlineMedium)<{ active?: boolean }>`
  align-items: center;
  color: ${({ theme, active }) => (active ? theme.neutral1 : theme.neutral2)};
  cursor: pointer;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} color`};

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    font-size: 24px !important;
    line-height: 32px !important;
  }
`
const FiltersContainer = styled.div<{ isInfoExplorePageEnabled: boolean }>`
  display: flex;
  gap: 8px;
  height: 40px;
  justify-content: flex-start;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    ${({ isInfoExplorePageEnabled }) => !isInfoExplorePageEnabled && 'order: 2; justify-content: space-between;'}
  }
`

const SearchContainer = styled(FiltersContainer)`
  margin-left: 8px;
  width: 100%;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    order: 1;
    margin: 0px;
  }
`
export enum ExploreTab {
  Tokens = 'tokens',
  Pools = 'pools',
  Transactions = 'transactions',
}

interface Page {
  title: React.ReactNode
  key: ExploreTab
  component: () => JSX.Element
  loggingElementName: string
}
const Pages: Array<Page> = [
  {
    title: <Trans>Tokens</Trans>,
    key: ExploreTab.Tokens,
    component: TopTokensTable,
    loggingElementName: InterfaceElementName.EXPLORE_TOKENS_TAB,
  },
  {
    title: <Trans>Pools</Trans>,
    key: ExploreTab.Pools,
    component: TopPoolTable,
    loggingElementName: InterfaceElementName.EXPLORE_POOLS_TAB,
  },
  {
    title: <Trans>Transactions</Trans>,
    key: ExploreTab.Transactions,
    component: RecentTransactions,
    loggingElementName: InterfaceElementName.EXPLORE_TRANSACTIONS_TAB,
  },
]

const Explore = ({ initialTab }: { initialTab?: ExploreTab }) => {
  const resetFilterString = useResetAtom(exploreSearchStringAtom)
  const location = useLocation()
  const tabNavRef = useRef<HTMLDivElement>(null)

  const initialKey: number = useMemo(() => {
    const key = initialTab && Pages.findIndex((page) => page.key === initialTab)

    if (!key || key === -1) return 0
    return key
  }, [initialTab])

  useEffect(() => {
    if (tabNavRef.current && initialTab) {
      const offsetTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: offsetTop - 90, behavior: 'smooth' })
    }
    // scroll to tab navbar on initial page mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [currentTab, setCurrentTab] = useState(initialKey)
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  // to allow backward navigation between tabs
  const { tab: tabName, chainName } = useExploreParams()
  const tab = tabName ?? ExploreTab.Tokens
  const chain = validateUrlChainParam(chainName)
  useEffect(() => {
    const tabIndex = Pages.findIndex((page) => page.key === tab)
    if (tabIndex !== -1) {
      setCurrentTab(tabIndex)
    }
  }, [tab])

  useEffect(() => {
    if (!isInfoExplorePageEnabled) {
      resetFilterString()
    }
  }, [isInfoExplorePageEnabled, location, resetFilterString])

  const { component: Page, key: currentKey } = Pages[currentTab]

  // Automatically trigger a navigation when the app chain changes
  const navigate = useNavigate()
  useOnGlobalChainSwitch(
    useCallback(
      (_chainId, chain) => {
        if (chain && isBackendSupportedChain(chain)) {
          navigate(getTokenExploreURL({ tab, chain }, isInfoExplorePageEnabled))
        }
      },
      [isInfoExplorePageEnabled, navigate, tab]
    )
  )

  return (
    <Trace
      page={isInfoExplorePageEnabled ? InterfacePageName.EXPLORE_PAGE : InterfacePageName.TOKENS_PAGE}
      properties={{ chainName: chain }}
      shouldLogImpression
    >
      <ExploreContainer isInfoExplorePageEnabled={isInfoExplorePageEnabled}>
        {isInfoExplorePageEnabled ? (
          <ExploreChartsSection />
        ) : (
          <TitleContainer>
            <MouseoverTooltip
              text={<Trans>This table contains the top tokens by Uniswap volume, sorted based on your input.</Trans>}
              placement="bottom"
            >
              <ThemedText.H1Large>
                <Trans>Top tokens on Uniswap</Trans>
              </ThemedText.H1Large>
            </MouseoverTooltip>
          </TitleContainer>
        )}
        <NavWrapper isInfoExplorePageEnabled={isInfoExplorePageEnabled} ref={tabNavRef}>
          {isInfoExplorePageEnabled && (
            <TabBar data-testid="explore-navbar">
              {Pages.map(({ title, loggingElementName, key }, index) => {
                return (
                  <TraceEvent
                    events={[BrowserEvent.onClick]}
                    name={SharedEventName.NAVBAR_CLICKED}
                    element={loggingElementName}
                    key={index}
                  >
                    <StyledInternalLink
                      to={`/explore/${key}` + (chain !== Chain.Ethereum ? `/${chain.toLowerCase()}` : '')}
                    >
                      <TabItem onClick={() => setCurrentTab(index)} active={currentTab === index} key={key}>
                        {title}
                      </TabItem>
                    </StyledInternalLink>
                  </TraceEvent>
                )
              })}
            </TabBar>
          )}
          {isInfoExplorePageEnabled ? (
            <FiltersContainer isInfoExplorePageEnabled>
              <NetworkFilter />
              {currentKey === ExploreTab.Tokens && <TimeSelector />}
              {currentKey !== ExploreTab.Transactions && <SearchBar tab={currentKey} />}
            </FiltersContainer>
          ) : (
            <>
              <FiltersContainer isInfoExplorePageEnabled={false}>
                <NetworkFilter />
                <TimeSelector />
              </FiltersContainer>
              <SearchContainer isInfoExplorePageEnabled={false}>
                <SearchBar />
              </SearchContainer>
            </>
          )}
        </NavWrapper>
        {isInfoExplorePageEnabled ? <Page /> : <OldTokenTable />}
      </ExploreContainer>
    </Trace>
  )
}

export default Explore
