import FavoriteButton from 'components/Explore/FavoriteButton'
import NetworkFilter from 'components/Explore/NetworkFilter'
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
  max-width: 960px;
  margin: 0 auto;
`

const Explore = () => {
  return (
    <ExploreContainer>
      <TitleContainer>Explore Tokens</TitleContainer>
      <FiltersContainer>
        <NetworkFilter />
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
