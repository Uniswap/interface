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

const BannerContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 320px;
  margin-top: 24px;
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
  padding-top: 40px;
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
const DEFAULT_TRENDING_COLLECTION_QUERY_AMOUNT = 5

const Banner = () => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const { data: collections } = useQuery(
    ['trendingCollections'],
    () => {
      return fetchTrendingCollections({ volumeType: 'eth', timePeriod: TimePeriod.OneDay, size: 5 })
    },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  // Trigger queries for the top trending collections, so that the data is immediately available if the user clicks through.
  const collectionAddresses = useMemo(() => collections?.map(({ address }) => address), [collections])
  useLoadCollectionQuery(collectionAddresses)

  return (
    <BannerContainer>
      <HeaderContainer>
        Better prices. {!isMobile && <br />}
        More listings.
      </HeaderContainer>
      {collections ? (
        <Carousel>
          {collections.map((collection) => (
            <Suspense fallback={<LoadingCarouselCard />} key={collection.address}>
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
          {[...Array(DEFAULT_TRENDING_COLLECTION_QUERY_AMOUNT)].map((index) => (
            <LoadingCarouselCard key={'carouselCard' + index} />
          ))}
        </Carousel>
      )}
    </BannerContainer>
  )
}

export default Banner
