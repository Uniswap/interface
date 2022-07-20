import FavoriteButton from 'components/Explore/FavoriteButton'
import SearchBar from 'components/Explore/SearchBar'
import TimeSelector from 'components/Explore/TimeSelector'
import TokenTable from 'components/Explore/TokenTable'
import styled from 'styled-components/macro'

const ExploreContainer = styled.div`
  width: 100%;
  min-width: 390px;
  padding: 0px 12px;
`
const TokenTableContainer = styled.div`
  padding: 16px 0px;
`
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 44px;
  max-width: 960px;
  grid-template-columns: 9fr 1.5fr 1fr;
  margin-left: auto;
  margin-right: auto;
`
const Explore = () => {
  return (
    <ExploreContainer>
      <FiltersContainer>
        <FavoriteButton />
        <TimeSelector />
        <SearchBar />
      </FiltersContainer>
      <TokenTableContainer>
        <TokenTable />
      </TokenTableContainer>
    </ExploreContainer>
  )
}

export default Explore
