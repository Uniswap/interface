import { PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from 'components/Explore/constants'
import { filterStringAtom } from 'components/Explore/state'
import FavoriteButton from 'components/Explore/TokenTable/FavoriteButton'
import NetworkFilter from 'components/Explore/TokenTable/NetworkFilter'
import SearchBar from 'components/Explore/TokenTable/SearchBar'
import TimeSelector from 'components/Explore/TokenTable/TimeSelector'
import TokenTable from 'components/Explore/TokenTable/TokenTable'
import { useResetAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'

const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 0px 12px;
`
const TokenTableContainer = styled.div`
  padding: 16px 0px;
`
const TitleContainer = styled.div`
  font-size: 32px;
  margin-bottom: 16px;
  max-width: 960px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
`
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 44px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    order: 2;
  }
`
const SearchContainer = styled(FiltersContainer)`
  width: 100%;
  margin-left: 8px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    margin: 0px;
    order: 1;
  }
`
const FiltersWrapper = styled.div`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    gap: 8px;
  }
`

const Explore = () => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  useEffect(() => {
    resetFilterString()
  }, [location, resetFilterString])

  return (
    <Trace page={PageName.EXPLORE_PAGE} shouldLogImpression>
      <ExploreContainer>
        <TitleContainer>Explore Tokens</TitleContainer>
        <FiltersWrapper>
          <FiltersContainer>
            <NetworkFilter />
            <FavoriteButton />
            <TimeSelector />
          </FiltersContainer>
          <SearchContainer>
            <SearchBar />
          </SearchContainer>
        </FiltersWrapper>

        <TokenTableContainer>
          <TokenTable />
        </TokenTableContainer>
      </ExploreContainer>
    </Trace>
  )
}

export default Explore
