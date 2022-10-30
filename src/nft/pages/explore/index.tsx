import Banner from 'nft/components/explore/Banner'
import TrendingCollections from 'nft/components/explore/TrendingCollections'
import styled from 'styled-components/macro'

const ExploreContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 16px;
`

const NftExplore = () => {
  return (
    <ExploreContainer>
      <Banner />
      <TrendingCollections />
    </ExploreContainer>
  )
}

export default NftExplore
