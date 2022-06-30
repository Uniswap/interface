import FavoriteButton from 'components/Explore/FavoriteButton'
import TimeSelector from 'components/Explore/TimeSelector'
import TokenTable from 'components/Explore/TokenTable'
import styled from 'styled-components/macro'
const GridContainer = styled.div`
  padding: 12px;
`
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
`

const Explore = () => {
  return (
    <>
      <FiltersContainer>
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
