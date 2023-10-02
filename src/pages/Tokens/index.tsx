import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfacePageName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import { Trace } from 'analytics'
import { AutoRow } from 'components/Row'
import { TabbedNav } from 'components/TabbedNav'
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
import styled from 'styled-components'
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
const Nav = styled(AutoRow)`
  gap: 20px;
`

const NavItem = styled(ThemedText.MediumHeader)<{ active?: boolean }>`
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
const FiltersContainer = styled.div<{ isExplore: boolean }>`
  display: flex;
  gap: 8px;
  height: 40px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    ${({ isExplore }) => !isExplore && 'order: 2;'}
    ${({ isExplore }) => isExplore && 'justify-content: space-between;'}
  }
`
const DropdownFilterContainer = styled(FiltersContainer)`
  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    justify-content: flex-start;
  }
`
const SearchContainer = styled(FiltersContainer)<{ isExplore: boolean }>`
  ${({ isExplore }) => !isExplore && 'margin-left: 8px;'}
  width: 100%;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    ${({ isExplore }) => !isExplore && 'order: 1; margin: 0px;'}
    ${({ isExplore }) => isExplore && 'justify-content: flex-end;'}
  }
`
const NavWrapper = styled.div`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.neutral3};
  flex-direction: row;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    gap: 8px;
  }
`

const Pages: Array<TabbedNav> = [
  {
    title: <Trans>Tokens</Trans>,
    key: 'tokens',
    component: TokenTable,
    loggingElementName: 'explore-tokens-tab', // todo: add to InterfaceElementName @uniswap/analytics-events
  },
  {
    title: <Trans>Pools</Trans>,
    key: 'pools',
    component: TokenTable,
    loggingElementName: 'explore-pools-tab',
  },
  {
    title: <Trans>Transactions</Trans>,
    key: 'transactions',
    component: TokenTable,
    loggingElementName: 'explore-transactions-tab',
  },
]

const Tokens = () => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  const [currentTab, setCurrentTab] = useState(0)
  const isExplore = useInfoExplorePageEnabled()

  useEffect(() => {
    resetFilterString()
  }, [location, resetFilterString])

  const { component: Page, key: currentKey } = Pages[currentTab]

  return (
    // TODO: add 'explore-page' to InterfacePageName in @uniswap/analytics-events
    <Trace page={isExplore ? 'explore-page' : InterfacePageName.TOKENS_PAGE} shouldLogImpression>
      <ExploreContainer>
        {/* TODO: add graphs to explore page */}
        {isExplore ? (
          <div></div>
        ) : (
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
        <NavWrapper>
          {isExplore && (
            <Nav data-testid="explore-navbar">
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
                    <NavItem onClick={handleNavItemClick} active={currentTab === index} key={key}>
                      <span>{title}</span>
                    </NavItem>
                  </TraceEvent>
                )
              })}
            </Nav>
          )}
          {isExplore ? (
            <FiltersContainer isExplore>
              <DropdownFilterContainer isExplore>
                <NetworkFilter />
                {currentKey === 'tokens' && <TimeSelector />}
              </DropdownFilterContainer>
              <SearchContainer isExplore>
                {currentKey !== 'transactions' && <SearchBar tab={currentKey} />}
              </SearchContainer>
            </FiltersContainer>
          ) : (
            <>
              <FiltersContainer isExplore={false}>
                <NetworkFilter />
                <TimeSelector />
              </FiltersContainer>
              <SearchContainer isExplore={false}>
                <SearchBar />
              </SearchContainer>
            </>
          )}
        </NavWrapper>
        {isExplore ? <Page /> : <TokenTable />}
      </ExploreContainer>
    </Trace>
  )
}

export default Tokens
