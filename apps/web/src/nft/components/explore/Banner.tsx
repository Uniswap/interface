import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { useTrendingCollections } from 'graphql/data/nft/TrendingCollections'
import { calculateCardIndex } from 'nft/utils'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Carousel, LoadingCarousel } from './Carousel'
import { CarouselCard, LoadingCarouselCard } from './CarouselCard'

const BannerContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  padding-top: 22px;
  position: relative;

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding: 32px 16px;
  }
`

const BannerMainArea = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  gap: 36px;
  max-width: ${({ theme }) => theme.maxWidth};
  justify-content: space-between;
  z-index: 2;

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
  font-weight: 535;
  font-size: 72px;
  line-height: 88px;
  align-self: center;
  flex-shrink: 0;
  padding-bottom: 32px;

  color: ${({ theme }) => theme.neutral1};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    font-size: 48px;
    line-height: 67px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    font-size: 36px;
    line-height: 50px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    line-height: 43px;
    text-align: center;
    padding-bottom: 16px;

    br {
      display: none;
    }
  }

  /* Custom breakpoint to split into two lines on smaller screens */
  @media only screen and (max-width: 550px) {
    font-size: 28px;
    line-height: 34px;
    padding-bottom: 0;

    br {
      display: unset;
    }
  }
`

// Exclude collections that are not available in any of the following - OpenSea, X2Y2 and LooksRare:
const EXCLUDED_COLLECTIONS = ['0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb']
const TRENDING_COLLECTION_SIZE = 5

const Banner = () => {
  const navigate = useNavigate()

  const { data: trendingCollections } = useTrendingCollections(
    TRENDING_COLLECTION_SIZE + EXCLUDED_COLLECTIONS.length,
    HistoryDuration.Day
  )

  const collections = useMemo(() => {
    return trendingCollections
      ?.filter((collection) => collection.address && !EXCLUDED_COLLECTIONS.includes(collection.address))
      .slice(0, TRENDING_COLLECTION_SIZE)
  }, [trendingCollections])

  const [activeCollectionIdx, setActiveCollectionIdx] = useState(0)
  const onToggleNextSlide = useCallback(
    (direction: number) => {
      if (!collections) return
      setActiveCollectionIdx((idx) => calculateCardIndex(idx + direction, collections.length))
    },
    [collections]
  )

  return (
    <BannerContainer>
      <BannerMainArea>
        <HeaderContainer>
          Better prices. <br />
          More listings.
        </HeaderContainer>
        {collections ? (
          <Carousel activeIndex={activeCollectionIdx} toggleNextSlide={onToggleNextSlide}>
            {collections.map((collection) => (
              <CarouselCard
                key={collection.address}
                collection={collection}
                onClick={() => navigate(`/nfts/collection/${collection.address}`)}
              />
            ))}
          </Carousel>
        ) : (
          <LoadingCarousel>
            <LoadingCarouselCard />
          </LoadingCarousel>
        )}
      </BannerMainArea>
    </BannerContainer>
  )
}

export default Banner
