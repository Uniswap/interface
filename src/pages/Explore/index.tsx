import FavoriteButton from 'components/Explore/FavoriteButton'
import TimeSelector from 'components/Explore/TimeSelector'
import TokenTable from 'components/Explore/TokenTable'
import { useState } from 'react'
import styled from 'styled-components/macro'

const GridContainer = styled.div`
  padding: 12px;
`
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 44px;
`

const Explore = () => {
  const [showFavorites, setFavorites] = useState(false)
  return (
    <>
      <FiltersContainer>
        <FavoriteButton onClick={() => setFavorites(!showFavorites)} />
        <TimeSelector />
      </FiltersContainer>

      <GridContainer>
        <TokenTable showFavorites={showFavorites} />
      </GridContainer>
    </>
  )
}

export default Explore
