import { fetchTrendingCollections } from 'nft/queries'
import { TimePeriod } from 'nft/types'
import { useQuery } from 'react-query'
import styled from 'styled-components/macro'

import { Carousel } from './Carousel'
import { CarouselCard } from './CarouselCard'

const BannerContainer = styled.div`
  display: flex;
  width: 100%;
  height: 280px;
  margin-top: 40px;
  margin-bottom: 40px;
  gap: 36px;
  max-width: 1100px;
  justify-content: center;
`

const HeaderContainer = styled.div`
  width: 500px;
  font-weight: 500;
  font-size: 60px;
  line-height: 73px;
  padding-top: 40px;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%), #fc72ff;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
`

const Banner = () => {
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

  return (
    <BannerContainer>
      <HeaderContainer>
        Best price. <br />
        Every listing.
      </HeaderContainer>
      {collections ? (
        <Carousel>
          {collections.map((collection, index) => (
            <CarouselCard key={index} collection={collection} />
          ))}
        </Carousel>
      ) : (
        <>
          {/* TODO: Improve Loading State */}
          <p>Loading</p>
        </>
      )}
    </BannerContainer>
  )
}

export default Banner
