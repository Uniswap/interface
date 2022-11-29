import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import Banner from 'nft/components/explore/Banner'
import TrendingCollections from 'nft/components/explore/TrendingCollections'
import { WelcomeModal } from 'nft/components/explore/WelcomeModal'
import { useBag } from 'nft/hooks'
import { useEffect } from 'react'
import { useHideNFTWelcomeModal } from 'state/user/hooks'
import styled from 'styled-components/macro'

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
  const [isModalHidden, hideModal] = useHideNFTWelcomeModal()

  useEffect(() => {
    setBagExpanded({ bagExpanded: false, manualClose: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Trace page={PageName.NFT_EXPLORE_PAGE} shouldLogImpression>
        <ExploreContainer>
          <Banner />
          <TrendingCollections />
        </ExploreContainer>
        {!isModalHidden && <WelcomeModal onDismissed={hideModal} />}
      </Trace>
    </>
  )
}

export default NftExplore
