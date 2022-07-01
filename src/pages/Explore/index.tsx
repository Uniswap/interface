import FavoriteButton from 'components/Explore/FavoriteButton'
import SearchBar from 'components/Explore/SearchBar'
import TimeSelector from 'components/Explore/TimeSelector'
import TokenTable from 'components/Explore/TokenTable'
import { atomWithStorage } from 'jotai/utils'
import styled from 'styled-components/macro'

const GridContainer = styled.div`
  padding: 12px;
`
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 44px;
  width: 960px;
`
export const showFavoritesAtom = atomWithStorage<boolean>('showFavorites', false)
const Explore = () => {
  return (
    <>
      <FiltersContainer>
        <SearchBar />
        <FavoriteButton />
        <TimeSelector />
      </FiltersContainer>

      <GridContainer>
        <TokenTable />
      </GridContainer>
    </>
  )
}

export default Explore
