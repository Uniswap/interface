import { PageName } from 'analytics/constants'
import { Trace } from 'analytics/Trace'
import Banner from 'nft/components/explore/Banner'
import TrendingCollections from 'nft/components/explore/TrendingCollections'
import styled from 'styled-components/macro'

const ExploreContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 16px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    gap: 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    gap: 0px;
  }
`

const NftExplore = () => {
  return (
    <>
      <Trace page={PageName.NFT_EXPLORE_PAGE} shouldLogImpression>
        <ExploreContainer>
          <Banner />
          <TrendingCollections />
        </ExploreContainer>
      </Trace>
    </>
  )
}

export default NftExplore
