import { InterfacePageName } from '@uniswap/analytics-events'
import styled from 'lib/styled-components'
import Banner from 'nft/components/explore/Banner'
import TrendingCollections from 'nft/components/explore/TrendingCollections'
import { useBag } from 'nft/hooks'
import { useEffect } from 'react'
import Trace from 'uniswap/src/features/telemetry/Trace'

const ExploreContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    gap: 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
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
      <Trace logImpression page={InterfacePageName.NFT_EXPLORE_PAGE}>
        <ExploreContainer>
          <Banner />
          <TrendingCollections />
        </ExploreContainer>
      </Trace>
    </>
  )
}

export default NftExplore
