import { PageName } from 'analytics/constants'
import { Trace } from 'analytics/Trace'
import Banner from 'nft/components/explore/Banner'
import TrendingCollections from 'nft/components/explore/TrendingCollections'

const NftExplore = () => {
  return (
    <>
      <Trace page={PageName.NFT_EXPLORE_PAGE} shouldLogImpression>
        <Banner />
        <TrendingCollections />
      </Trace>
    </>
  )
}

export default NftExplore
