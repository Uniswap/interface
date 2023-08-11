import { InterfacePageName } from '@uniswap/analytics-events'
import { Trace } from 'analytics'
import Banner from 'nft/components/explore/Banner'
import TrendingCollections from 'nft/components/explore/TrendingCollections'
import { useBag } from 'nft/hooks'
import { useEffect } from 'react'
import styled from 'styled-components'

const ExploreContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    gap: 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    gap: 0px;
  }
`

const NftExplore = () => {
  const setBagExpanded = useBag((state) => state.setBagExpanded)

  useEffect(() => {
    setBagExpanded({ bagExpanded: false, manualClose: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Trace page={InterfacePageName.NFT_EXPLORE_PAGE} shouldLogImpression>
        <ExploreContainer>
          <Banner />
          <TrendingCollections />
        </ExploreContainer>
      </Trace>
    </>
  )
}

export default NftExplore
