import { ActivityFetcher, fetchTrendingCollections } from 'nft/queries'
import { TimePeriod } from 'nft/types'
import { useEffect, useState } from 'react'
import { QueryClient, useQuery } from 'react-query'
import styled from 'styled-components/macro'

import { CarouselCard } from './CarouselCard'

const queryClient = new QueryClient()

const BannerContainer = styled.div`
  display: flex;
  width: 100%;
  margin-top: 40px;
  gap: 36px;
  maxwidth: 1000px;
  justify-content: center;
`

const HeaderContainer = styled.div`
  width: 500px;
  font-weight: 500;
  font-size: 60px;
  line-height: 73px;
  padding-top: 40px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%), #fc72ff;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
`

const Banner = () => {
  /* Sets initially displayed collection to random number between 0 and 4  */
  const [current, setCurrent] = useState(Math.floor(Math.random() * 5))
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

  useEffect(() => {
    /* Rotate through Top 5 Collections on 15 second interval */
    const interval = setInterval(async () => {
      if (collections) {
        const nextCollectionIndex = (current + 1) % collections.length
        const nextCollectionAddress = collections[nextCollectionIndex].address
        setCurrent(nextCollectionIndex)
        await queryClient.prefetchQuery(['collectionActivity', nextCollectionAddress], () =>
          ActivityFetcher(nextCollectionAddress as string)
        )
      }
    }, 15_000)
    return () => {
      clearInterval(interval)
    }
  }, [current, collections])

  return (
    <BannerContainer>
      <HeaderContainer>
        Best price. <br />
        Every listing.
      </HeaderContainer>
      {collections && collections[current] ? (
        <CarouselCard collection={collections[current]} />
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
