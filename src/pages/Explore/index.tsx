import { Trans } from '@lingui/macro'
import { BrowserEvent, SharedEventName } from '@uniswap/analytics-events'
import { Trace, TraceEvent } from 'analytics'
import NetworkFilter from 'components/Explore/FilterBar/NetworkFilter'
import SearchBar from 'components/Explore/FilterBar/SearchBar'
import TimeSelector from 'components/Explore/FilterBar/TimeSelector'
import { AutoRow } from 'components/Row'
import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { filterStringAtom } from 'components/Tokens/state'
import TokenTable from 'components/Tokens/TokenTable/TokenTable'
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

const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 40px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    order: 2;
  }
`
const SearchContainer = styled(FiltersContainer)`
  margin-left: 8px;
  width: 100%;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    margin: 0px;
    order: 1;
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

// copied from MiniPortfolio/index.tsx,, DRY?
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
    loggingElementName: 'explore-tokens-tab', // todo: add to InterfaceSectionName @uniswap/analytics-events
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

const Explore = () => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    resetFilterString()
  }, [location, resetFilterString])

  const { component: Page, key: currentKey } = Pages[currentPage]

  return (
    // TODO: add 'explore-page' to InterfacePageName in @uniswap/analytics-events
    <Trace page="explore-page" shouldLogImpression>
      <ExploreContainer>
        {/* TODO: add graphs */}
        <NavWrapper>
          <Nav data-testid="explore-navbar">
            {Pages.map(({ title, loggingElementName, key }, index) => {
              const handleNavItemClick = () => {
                setCurrentPage(index)
              }
              return (
                <TraceEvent
                  events={[BrowserEvent.onClick]}
                  name={SharedEventName.NAVBAR_CLICKED}
                  element={loggingElementName}
                  key={index}
                >
                  <NavItem onClick={handleNavItemClick} active={currentPage === index} key={key}>
                    <span>{title}</span>
                  </NavItem>
                </TraceEvent>
              )
            })}
          </Nav>
          <FiltersContainer>
            <NetworkFilter />
            {currentKey === 'tokens' && <TimeSelector />}
            {/* <SearchContainer> */}
            {currentKey !== 'transactions' && <SearchBar />}
            {/* </SearchContainer> */}
          </FiltersContainer>
        </NavWrapper>
        <Page />
      </ExploreContainer>
    </Trace>
  )
}

export default Explore
