import { useLoadCollectionQuery } from 'graphql/data/nft/Collection'
import { useIsMobile } from 'nft/hooks'
import { fetchTrendingCollections } from 'nft/queries'
import { TimePeriod } from 'nft/types'
import { Suspense, useMemo } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { Carousel } from './Carousel'
import { CarouselCard, LoadingCarouselCard } from './CarouselCard'

const BannerBackground = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
`

const BannerContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 285px;
  gap: 36px;
  max-width: 1200px;
  justify-content: space-between;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-direction: column;
    height: 100%;
    gap: 14px;
    margin-top: 4px;
    margin-bottom: 6px;
  }
`

const HeaderContainer = styled.div`
  display: flex;
  max-width: 500px;
  font-weight: 500;
  font-size: 72px;
  line-height: 88px;
  justify-content: start;
  align-items: start;
  align-self: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.textPrimary};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    font-size: 48px;
    line-height: 67px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    font-size: 36px;
    line-height: 50px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    font-size: 20px;
    line-height: 28px;
    justify-content: center;
    align-items: center;
    padding-top: 0px;
  }
`

// Exclude collections that are not available in any of the following - OpenSea, X2Y2 and LooksRare:
const EXCLUDED_COLLECTIONS = ['0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb']
const TRENDING_COLLECTION_SIZE = 5

const Banner = () => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const { data } = useQuery(
    ['trendingCollections'],
    () => {
      return fetchTrendingCollections({
        volumeType: 'eth',
        timePeriod: TimePeriod.OneDay,
        size: TRENDING_COLLECTION_SIZE + EXCLUDED_COLLECTIONS.length,
      })
    },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  const collections = useMemo(
    () => data?.filter((collection) => !EXCLUDED_COLLECTIONS.includes(collection.address)).slice(0, 5),
    [data]
  )

  // Trigger queries for the top trending collections, so that the data is immediately available if the user clicks through.
  const collectionAddresses = useMemo(() => collections?.map(({ address }) => address), [collections])
  useLoadCollectionQuery(collectionAddresses)

  return (
    <BannerBackground>
      <BannerContainer>
        <HeaderContainer>
          Better prices. {!isMobile && <br />}
          More listings.
        </HeaderContainer>
        {collections ? (
          <Carousel>
            {collections.map((collection) => (
              <Suspense fallback={<LoadingCarouselCard collection={collection} />} key={collection.address}>
                <CarouselCard
                  key={collection.address}
                  collection={collection}
                  onClick={() => navigate(`/nfts/collection/${collection.address}`)}
                />
              </Suspense>
            ))}
          </Carousel>
        ) : (
          <Carousel>
            {[...Array(TRENDING_COLLECTION_SIZE)].map((index) => (
              <LoadingCarouselCard key={'carouselCard' + index} />
            ))}
          </Carousel>
        )}
      </BannerContainer>
    </BannerBackground>
  )
}

export default Banner
