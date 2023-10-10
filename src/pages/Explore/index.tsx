import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfacePageName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import { Trace } from 'analytics'
import { AutoRow } from 'components/Row'
import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { filterStringAtom } from 'components/Tokens/state'
import NetworkFilter from 'components/Tokens/TokenTable/NetworkFilter'
import SearchBar from 'components/Tokens/TokenTable/SearchBar'
import TimeSelector from 'components/Tokens/TokenTable/TimeSelector'
import TokenTable from 'components/Tokens/TokenTable/TokenTable'
import { MouseoverTooltip } from 'components/Tooltip'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useResetAtom } from 'jotai/utils'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { ThemedText } from 'theme/components'

const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
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

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    gap: 8px;
  }

  ${({ isInfoExplorePageEnabled }) =>
    isInfoExplorePageEnabled &&
    css`
      @media screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
        flex-direction: column;
        gap: 16px;
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
`
const FiltersContainer = styled.div<{ isInfoExplorePageEnabled: boolean }>`
  display: flex;
  gap: 8px;
  height: 40px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    ${({ isInfoExplorePageEnabled }) => !isInfoExplorePageEnabled && 'order: 2;'}
  }

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    ${({ isInfoExplorePageEnabled }) => isInfoExplorePageEnabled && 'justify-content: space-between;'}
  }
`
const DropdownFilterContainer = styled(FiltersContainer)<{ isInfoExplorePageEnabled: boolean }>`
  ${({ isInfoExplorePageEnabled }) =>
    isInfoExplorePageEnabled
      ? css`
          @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
            justify-content: flex-start;
          }
        `
      : css`
          @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
            justify-content: flex-start;
          }
        `};
`
const SearchContainer = styled(FiltersContainer)<{ isInfoExplorePageEnabled: boolean }>`
  ${({ isInfoExplorePageEnabled }) => !isInfoExplorePageEnabled && 'margin-left: 8px;'}
  width: 100%;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    ${({ isInfoExplorePageEnabled }) => !isInfoExplorePageEnabled && 'order: 1; margin: 0px;'}
  }

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    ${({ isInfoExplorePageEnabled }) => isInfoExplorePageEnabled && 'justify-content: flex-end;'}
  }
`

interface Page {
  title: React.ReactNode
  key: string
  component: () => JSX.Element
  loggingElementName: string
}
const Pages: Array<Page> = [
  {
    title: <Trans>Tokens</Trans>,
    key: 'tokens',
    component: TokenTable,
    loggingElementName: InterfaceElementName.EXPLORE_TOKENS_TAB,
  },
  {
    title: <Trans>Pools</Trans>,
    key: 'pools',
    component: TokenTable,
    loggingElementName: InterfaceElementName.EXPLORE_POOLS_TAB,
  },
  {
    title: <Trans>Transactions</Trans>,
    key: 'transactions',
    component: TokenTable,
    loggingElementName: InterfaceElementName.EXPLORE_TRANSACTIONS_TAB,
  },
]

const Explore = () => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  const [currentTab, setCurrentTab] = useState(0)
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  useEffect(() => {
    resetFilterString()
  }, [location, resetFilterString])

  const { component: Page, key: currentKey } = Pages[currentTab]

  return (
    <Trace
      page={isInfoExplorePageEnabled ? InterfacePageName.EXPLORE_PAGE : InterfacePageName.TOKENS_PAGE}
      shouldLogImpression
    >
      <ExploreContainer>
        {/* TODO(WEB-2749 & WEB-2750): add graphs to explore page */}
        {!isInfoExplorePageEnabled && (
          <TitleContainer>
            <MouseoverTooltip
              text={<Trans>This table contains the top tokens by Uniswap volume, sorted based on your input.</Trans>}
              placement="bottom"
            >
              <ThemedText.LargeHeader>
                <Trans>Top tokens on Uniswap</Trans>
              </ThemedText.LargeHeader>
            </MouseoverTooltip>
          </TitleContainer>
        )}
        <NavWrapper isInfoExplorePageEnabled={isInfoExplorePageEnabled}>
          {isInfoExplorePageEnabled && (
            <TabBar data-testid="explore-navbar">
              {Pages.map(({ title, loggingElementName, key }, index) => {
                const handleNavItemClick = () => {
                  setCurrentTab(index)
                }
                return (
                  <TraceEvent
                    events={[BrowserEvent.onClick]}
                    name={SharedEventName.NAVBAR_CLICKED}
                    element={loggingElementName}
                    key={index}
                  >
                    <TabItem onClick={handleNavItemClick} active={currentTab === index} key={key}>
                      {title}
                    </TabItem>
                  </TraceEvent>
                )
              })}
            </TabBar>
          )}
          {isInfoExplorePageEnabled ? (
            <FiltersContainer isInfoExplorePageEnabled>
              <DropdownFilterContainer isInfoExplorePageEnabled>
                <NetworkFilter />
                {currentKey === 'tokens' && <TimeSelector />}
              </DropdownFilterContainer>
              <SearchContainer isInfoExplorePageEnabled>
                {currentKey !== 'transactions' && <SearchBar tab={currentKey} />}
              </SearchContainer>
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
        {isInfoExplorePageEnabled ? <Page /> : <TokenTable />}
      </ExploreContainer>
    </Trace>
  )
}

export default Explore
